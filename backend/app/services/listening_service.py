"""
Listening Exercise Service

Business logic for listening exercises including:
- Listing and filtering exercises
- Exercise details with questions
- Answer submission and scoring
- XP calculation
"""

from datetime import datetime
from typing import List, Optional, Tuple, Dict
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.listening import ListeningExercise, ListeningQuestion, ListeningAttempt
from app.models.user import User
from app.models.progress import DailyProgress
from app.schemas.listening import (
    ListeningExerciseBrief,
    ListeningExerciseResponse,
    ListeningQuestionResponse,
    ListeningAttemptBrief,
    ListeningSubmitRequest,
    ListeningSubmitResponse,
    ListeningQuestionResult,
    ListeningListResponse,
    ListeningFilters,
)


# XP rewards based on score percentage
def calculate_listening_xp(score_percent: float, difficulty: int, is_first_attempt: bool) -> int:
    """
    Calculate XP earned for a listening exercise.
    
    Base XP by difficulty:
    - Difficulty 1: 10 XP
    - Difficulty 2: 15 XP  
    - Difficulty 3: 20 XP
    
    Multiplied by score percentage, with bonus for first attempt.
    """
    base_xp = {1: 10, 2: 15, 3: 20}.get(difficulty, 10)
    
    # Score multiplier (0% = 0x, 100% = 1x)
    score_multiplier = score_percent / 100
    
    # First attempt bonus
    first_attempt_bonus = 1.5 if is_first_attempt else 1.0
    
    # Perfect score bonus
    perfect_bonus = 1.25 if score_percent == 100 else 1.0
    
    xp = int(base_xp * score_multiplier * first_attempt_bonus * perfect_bonus)
    
    return max(1, xp)  # Minimum 1 XP for any attempt


class ListeningService:
    """Service for listening exercise operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================================================
    # List Exercises
    # =========================================================================
    
    def list_exercises(
        self,
        user_id: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[int] = None,
        accent: Optional[str] = None,
        speed: Optional[str] = None,
        completed: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> ListeningListResponse:
        """
        List listening exercises with filters.
        
        Args:
            user_id: Optional user ID for completion status
            category: Filter by category
            difficulty: Filter by difficulty (1-3)
            accent: Filter by accent
            speed: Filter by speed
            completed: Filter by completion status (requires user_id)
            skip: Pagination offset
            limit: Maximum items to return
            
        Returns:
            Paginated list of exercises (without transcripts)
        """
        query = select(ListeningExercise)
        
        # Apply filters
        conditions = []
        
        if category:
            conditions.append(ListeningExercise.category == category)
        
        if difficulty is not None:
            conditions.append(ListeningExercise.difficulty == difficulty)
        
        if accent:
            conditions.append(ListeningExercise.accent == accent)
        
        if speed:
            conditions.append(ListeningExercise.speed == speed)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count(ListeningExercise.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total = self.db.execute(count_query).scalar() or 0
        
        # Apply pagination and ordering
        query = query.options(
            joinedload(ListeningExercise.questions)
        ).order_by(
            ListeningExercise.difficulty,
            ListeningExercise.category,
            ListeningExercise.title
        ).offset(skip).limit(limit)
        
        result = self.db.execute(query)
        exercises = result.unique().scalars().all()
        
        # Build response with user-specific data
        items = []
        for exercise in exercises:
            # Get user's attempts for this exercise
            attempt_count = 0
            best_score = None
            has_completed = False
            
            if user_id:
                attempts = self.db.execute(
                    select(ListeningAttempt).where(
                        ListeningAttempt.user_id == user_id,
                        ListeningAttempt.exercise_id == exercise.id,
                        ListeningAttempt.completed == True
                    ).order_by(desc(ListeningAttempt.score_percent))
                ).scalars().all()
                
                attempt_count = len(attempts)
                if attempts:
                    has_completed = True
                    best_score = attempts[0].score_percent
            
            # Filter by completed status if specified
            if completed is not None:
                if completed and not has_completed:
                    continue
                if not completed and has_completed:
                    continue
            
            items.append(ListeningExerciseBrief(
                id=exercise.id,
                title=exercise.title,
                category=exercise.category,
                scenario_type=exercise.scenario_type,
                accent=exercise.accent,
                speed=exercise.speed,
                difficulty=exercise.difficulty,
                icao_level_target=exercise.icao_level_target,
                duration_seconds=exercise.duration_seconds,
                audio_url=exercise.audio_url,
                question_count=len(exercise.questions),
                completed=has_completed,
                attempt_count=attempt_count,
                best_score=best_score
            ))
        
        return ListeningListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(items)) < total
        )
    
    # =========================================================================
    # Get Exercise
    # =========================================================================
    
    def get_exercise(
        self, 
        exercise_id: str, 
        user_id: Optional[str] = None
    ) -> Optional[ListeningExerciseResponse]:
        """
        Get exercise details with questions (without transcript).
        
        Args:
            exercise_id: Exercise ID
            user_id: Optional user ID for previous attempts
            
        Returns:
            Exercise with questions, or None if not found
        """
        exercise = self.db.execute(
            select(ListeningExercise)
            .options(joinedload(ListeningExercise.questions))
            .where(ListeningExercise.id == exercise_id)
        ).unique().scalar_one_or_none()
        
        if not exercise:
            return None
        
        # Get previous attempts
        previous_attempts = []
        if user_id:
            attempts = self.db.execute(
                select(ListeningAttempt).where(
                    ListeningAttempt.user_id == user_id,
                    ListeningAttempt.exercise_id == exercise_id,
                    ListeningAttempt.completed == True
                ).order_by(desc(ListeningAttempt.created_at)).limit(5)
            ).scalars().all()
            
            previous_attempts = [
                ListeningAttemptBrief(
                    id=a.id,
                    score_percent=a.score_percent,
                    completed_at=a.completed_at
                )
                for a in attempts
            ]
        
        # Build questions (without correct answers)
        questions = [
            ListeningQuestionResponse(
                id=q.id,
                question_type=q.question_type,
                question_text=q.question_text,
                options=q.options,
                order=q.order
            )
            for q in sorted(exercise.questions, key=lambda x: x.order)
        ]
        
        return ListeningExerciseResponse(
            id=exercise.id,
            title=exercise.title,
            audio_url=exercise.audio_url,
            duration_seconds=exercise.duration_seconds,
            category=exercise.category,
            scenario_type=exercise.scenario_type,
            accent=exercise.accent,
            speed=exercise.speed,
            difficulty=exercise.difficulty,
            icao_level_target=exercise.icao_level_target,
            questions=questions,
            created_at=exercise.created_at,
            previous_attempts=previous_attempts
        )
    
    # =========================================================================
    # Submit Answers
    # =========================================================================
    
    def submit_answers(
        self,
        user_id: str,
        exercise_id: str,
        submission: ListeningSubmitRequest
    ) -> Optional[ListeningSubmitResponse]:
        """
        Submit answers for a listening exercise.
        
        Args:
            user_id: User's ID
            exercise_id: Exercise ID
            submission: User's answers and timing data
            
        Returns:
            Submission result with scores and correct answers, or None if not found
        """
        # Get exercise with questions
        exercise = self.db.execute(
            select(ListeningExercise)
            .options(joinedload(ListeningExercise.questions))
            .where(ListeningExercise.id == exercise_id)
        ).unique().scalar_one_or_none()
        
        if not exercise:
            return None
        
        # Check if this is the first attempt
        existing_attempts = self.db.execute(
            select(func.count(ListeningAttempt.id)).where(
                ListeningAttempt.user_id == user_id,
                ListeningAttempt.exercise_id == exercise_id,
                ListeningAttempt.completed == True
            )
        ).scalar() or 0
        is_first_attempt = existing_attempts == 0
        
        # Grade answers
        results = []
        correct_count = 0
        total_questions = len(exercise.questions)
        
        for question in exercise.questions:
            user_answer = submission.answers.get(question.id, "")
            is_correct = self._check_answer(user_answer, question.correct_answer, question.question_type)
            
            if is_correct:
                correct_count += 1
            
            results.append(ListeningQuestionResult(
                question_id=question.id,
                question_text=question.question_text,
                question_type=question.question_type,
                user_answer=user_answer,
                correct_answer=question.correct_answer,
                is_correct=is_correct,
                explanation=question.explanation if not is_correct else None
            ))
        
        # Calculate score
        score_percent = (correct_count / total_questions * 100) if total_questions > 0 else 0
        score_percent = round(score_percent, 1)
        
        # Calculate XP
        xp_earned = calculate_listening_xp(score_percent, exercise.difficulty, is_first_attempt)
        
        # Create attempt record
        now = datetime.utcnow()
        attempt = ListeningAttempt(
            user_id=user_id,
            exercise_id=exercise_id,
            score_percent=score_percent,
            answers=submission.answers,
            correct_count=correct_count,
            total_questions=total_questions,
            time_spent_seconds=submission.time_spent_seconds,
            audio_plays=submission.audio_plays,
            completed=True,
            xp_earned=xp_earned,
            completed_at=now
        )
        self.db.add(attempt)
        
        # Update daily progress
        self._update_daily_progress(user_id, xp_earned)
        
        # Update user stats
        self._update_user_stats(user_id, xp_earned)
        
        self.db.commit()
        self.db.refresh(attempt)
        
        return ListeningSubmitResponse(
            attempt_id=attempt.id,
            exercise_id=exercise_id,
            score_percent=score_percent,
            correct_count=correct_count,
            total_questions=total_questions,
            results=results,
            transcript=exercise.transcript,  # Reveal transcript after submission
            teaching_points=exercise.teaching_points,
            model_readback=exercise.model_readback,
            xp_earned=xp_earned,
            time_spent_seconds=submission.time_spent_seconds,
            completed_at=now
        )
    
    def _check_answer(
        self, 
        user_answer: str, 
        correct_answer: str, 
        question_type: str
    ) -> bool:
        """
        Check if user's answer is correct.
        
        Uses case-insensitive comparison with whitespace normalization.
        """
        # Normalize answers
        user_normalized = " ".join(user_answer.lower().strip().split())
        correct_normalized = " ".join(correct_answer.lower().strip().split())
        
        if question_type == "multiple_choice":
            # Exact match for multiple choice
            return user_normalized == correct_normalized
        
        elif question_type == "true_false":
            # Boolean comparison
            true_values = {"true", "t", "yes", "y", "1"}
            false_values = {"false", "f", "no", "n", "0"}
            
            user_bool = user_normalized in true_values
            correct_bool = correct_normalized in true_values
            
            if user_normalized in true_values or user_normalized in false_values:
                return user_bool == correct_bool
            return False
        
        elif question_type == "fill_blank":
            # More lenient matching for fill-in-the-blank
            # Remove punctuation and compare
            import re
            user_clean = re.sub(r'[^\w\s]', '', user_normalized)
            correct_clean = re.sub(r'[^\w\s]', '', correct_normalized)
            return user_clean == correct_clean
        
        else:
            # Default: exact match
            return user_normalized == correct_normalized
    
    def _update_daily_progress(self, user_id: str, xp_earned: int) -> None:
        """Update or create daily progress record."""
        today = datetime.utcnow().date()
        
        daily = self.db.execute(
            select(DailyProgress).where(
                DailyProgress.user_id == user_id,
                DailyProgress.date == today
            )
        ).scalar_one_or_none()
        
        if daily is None:
            daily = DailyProgress(
                user_id=user_id,
                date=today,
                listening_completed=1,
                xp_earned=xp_earned
            )
            self.db.add(daily)
        else:
            # Handle NULL values that might exist in database
            daily.listening_completed = (daily.listening_completed or 0) + 1
            daily.xp_earned = (daily.xp_earned or 0) + xp_earned
            daily.updated_at = datetime.utcnow()
    
    def _update_user_stats(self, user_id: str, xp_earned: int) -> None:
        """Update user's total XP."""
        user = self.db.get(User, user_id)
        if user:
            user.total_xp = (user.total_xp or 0) + xp_earned
            user.last_practice_at = datetime.utcnow()
    
    # =========================================================================
    # Get Attempt
    # =========================================================================
    
    def get_attempt(
        self, 
        attempt_id: str, 
        user_id: str
    ) -> Optional[ListeningAttempt]:
        """Get a specific attempt by ID."""
        attempt = self.db.execute(
            select(ListeningAttempt).where(
                ListeningAttempt.id == attempt_id,
                ListeningAttempt.user_id == user_id
            )
        ).scalar_one_or_none()
        
        return attempt
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    def get_user_stats(self, user_id: str) -> dict:
        """Get user's listening exercise statistics."""
        # Total exercises
        total_exercises = self.db.execute(
            select(func.count(ListeningExercise.id))
        ).scalar() or 0
        
        # User's completed attempts
        attempts = self.db.execute(
            select(ListeningAttempt).where(
                ListeningAttempt.user_id == user_id,
                ListeningAttempt.completed == True
            )
        ).scalars().all()
        
        # Unique exercises completed
        completed_exercise_ids = set(a.exercise_id for a in attempts)
        exercises_completed = len(completed_exercise_ids)
        
        # Calculate averages
        if attempts:
            avg_score = sum(a.score_percent for a in attempts) / len(attempts)
            total_time = sum(a.time_spent_seconds for a in attempts)
            total_xp = sum(a.xp_earned for a in attempts)
        else:
            avg_score = 0
            total_time = 0
            total_xp = 0
        
        return {
            "total_exercises": total_exercises,
            "exercises_completed": exercises_completed,
            "total_attempts": len(attempts),
            "average_score": round(avg_score, 1),
            "total_time_seconds": total_time,
            "total_xp_earned": total_xp,
            "progress_percent": round(exercises_completed / total_exercises * 100, 1) if total_exercises > 0 else 0
        }
    
    def get_available_filters(self) -> ListeningFilters:
        """Get available filter options."""
        categories = [
            r[0] for r in self.db.execute(
                select(ListeningExercise.category).distinct()
            ).all()
        ]
        
        accents = [
            r[0] for r in self.db.execute(
                select(ListeningExercise.accent).distinct()
            ).all()
        ]
        
        speeds = [
            r[0] for r in self.db.execute(
                select(ListeningExercise.speed).distinct()
            ).all()
        ]
        
        difficulties = [
            r[0] for r in self.db.execute(
                select(ListeningExercise.difficulty).distinct().order_by(ListeningExercise.difficulty)
            ).all()
        ]
        
        return ListeningFilters(
            categories=categories,
            accents=accents,
            speeds=speeds,
            difficulties=difficulties
        )

