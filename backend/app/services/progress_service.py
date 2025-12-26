"""
Progress Tracking Service

Business logic for progress tracking including:
- Daily progress tracking
- Streak management
- Achievement checking
- Predicted ICAO level calculation
"""

from datetime import datetime, date, timedelta
from typing import List, Optional, Tuple, Dict
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.progress import DailyProgress, Streak, Achievement, UserAchievement
from app.models.vocabulary import VocabularyProgress, VocabularyTerm
from app.models.listening import ListeningAttempt, ListeningExercise
from app.models.speaking import SpeakingSubmission, SpeakingScenario, SubmissionStatus
from app.schemas.progress import (
    DailyProgressResponse,
    DailyProgressList,
    DailyProgressWithStreakResponse,
    StreakResponse,
    StreakUpdate,
    ProgressStatsResponse,
    VocabularyStats,
    ListeningStats,
    SpeakingStats,
    CategoryProgress,
    ICAOCriteriaProgress,
    AchievementResponse,
    AchievementListResponse,
    PracticeSessionRequest,
    PracticeSessionResponse,
)
from app.services.spaced_repetition import calculate_mastery_percent


# ICAO Level descriptions
ICAO_LEVEL_DESCRIPTIONS = {
    1: "Pre-elementary",
    2: "Elementary",
    3: "Pre-operational",
    4: "Operational",
    5: "Extended",
    6: "Expert"
}


class ProgressService:
    """Service for progress tracking operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================================================
    # Daily Progress
    # =========================================================================
    
    def get_daily_progress(
        self,
        user_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        include_streak: bool = False
    ) -> DailyProgressList | DailyProgressWithStreakResponse:
        """
        Get daily progress for a date range.
        
        Args:
            user_id: User's ID
            start_date: Start of range (default: 30 days ago)
            end_date: End of range (default: today)
            include_streak: Whether to include streak information
            
        Returns:
            List of daily progress records, optionally with streak info
        """
        today = date.today()
        
        if end_date is None:
            end_date = today
        if start_date is None:
            start_date = end_date - timedelta(days=30)
        
        # Query daily progress
        query = select(DailyProgress).where(
            DailyProgress.user_id == user_id,
            DailyProgress.date >= start_date,
            DailyProgress.date <= end_date
        ).order_by(DailyProgress.date)
        
        records = self.db.execute(query).scalars().all()
        
        items = []
        for r in records:
            items.append(DailyProgressResponse(
                id=r.id,
                date=r.date,
                vocab_reviewed=r.vocab_reviewed,
                listening_completed=r.listening_completed,
                speaking_completed=r.speaking_completed,
                practice_minutes=r.practice_minutes,
                xp_earned=r.xp_earned,
                goal_met=r.goal_met,
                total_activities=r.total_activities
            ))
        
        # Count active days
        active_days = len([r for r in records if r.total_activities > 0])
        total_days = (end_date - start_date).days + 1
        
        if include_streak:
            streak = self.get_streak(user_id)
            return DailyProgressWithStreakResponse(
                items=items,
                start_date=start_date,
                end_date=end_date,
                total_days=total_days,
                active_days=active_days,
                current_streak=streak.current_streak,
                longest_streak=streak.longest_streak,
                last_practice_date=streak.last_practice_date,
                is_at_risk=streak.is_at_risk
            )
        
        return DailyProgressList(
            items=items,
            start_date=start_date,
            end_date=end_date,
            total_days=total_days,
            active_days=active_days
        )
    
    def get_or_create_daily_progress(self, user_id: str, target_date: date = None) -> DailyProgress:
        """Get or create daily progress record for a date."""
        if target_date is None:
            target_date = date.today()
        
        daily = self.db.execute(
            select(DailyProgress).where(
                DailyProgress.user_id == user_id,
                DailyProgress.date == target_date
            )
        ).scalar_one_or_none()
        
        if daily is None:
            daily = DailyProgress(
                user_id=user_id,
                date=target_date
            )
            self.db.add(daily)
            self.db.flush()
        
        return daily
    
    # =========================================================================
    # Streak Management
    # =========================================================================
    
    def get_streak(self, user_id: str) -> StreakResponse:
        """Get user's streak information."""
        streak = self.db.execute(
            select(Streak).where(Streak.user_id == user_id)
        ).scalar_one_or_none()
        
        if streak is None:
            return StreakResponse(
                current_streak=0,
                longest_streak=0,
                last_practice_date=None,
                freeze_available=0,
                is_at_risk=False
            )
        
        # Check if streak is at risk
        today = date.today()
        is_at_risk = False
        if streak.last_practice_date:
            days_since = (today - streak.last_practice_date).days
            if days_since == 1 and streak.current_streak > 0:
                is_at_risk = True  # Must practice today to maintain streak
        
        return StreakResponse(
            current_streak=streak.current_streak,
            longest_streak=streak.longest_streak,
            last_practice_date=streak.last_practice_date,
            freeze_available=streak.freeze_available,
            is_at_risk=is_at_risk
        )
    
    def update_streak(self, user_id: str, practice_date: date = None) -> StreakUpdate:
        """
        Update streak based on practice.
        
        Streak Logic:
        - If practiced yesterday: increment streak
        - If practiced today: no change
        - If missed a day: reset to 1
        """
        if practice_date is None:
            practice_date = date.today()
        
        # Get or create streak record
        streak = self.db.execute(
            select(Streak).where(Streak.user_id == user_id)
        ).scalar_one_or_none()
        
        if streak is None:
            streak = Streak(user_id=user_id)
            self.db.add(streak)
            self.db.flush()
        
        old_streak = streak.current_streak
        old_longest = streak.longest_streak
        
        # Update streak using model method
        streak_maintained = streak.update_streak(practice_date)
        
        self.db.commit()
        
        streak_increased = streak.current_streak > old_streak
        new_record = streak.longest_streak > old_longest
        
        # Build response
        streak_response = StreakResponse(
            current_streak=streak.current_streak,
            longest_streak=streak.longest_streak,
            last_practice_date=streak.last_practice_date,
            freeze_available=streak.freeze_available,
            is_at_risk=False  # Just practiced, not at risk
        )
        
        return StreakUpdate(
            streak=streak_response,
            streak_maintained=streak_maintained,
            streak_increased=streak_increased,
            new_record=new_record
        )
    
    # =========================================================================
    # Comprehensive Stats
    # =========================================================================
    
    def get_comprehensive_stats(self, user_id: str) -> ProgressStatsResponse:
        """Get comprehensive progress statistics."""
        user = self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        
        # Get vocabulary stats
        vocab_stats = self._get_vocabulary_stats(user_id)
        
        # Get listening stats
        listening_stats = self._get_listening_stats(user_id)
        
        # Get speaking stats
        speaking_stats = self._get_speaking_stats(user_id)
        
        # Calculate predicted ICAO level
        predicted_level, level_progress = self._calculate_predicted_icao_level(
            vocab_stats, listening_stats, speaking_stats
        )
        
        # Get streak info
        streak = self.get_streak(user_id)
        
        # Get time stats
        time_stats = self._get_time_stats(user_id)
        
        # Days until test
        days_until_test = None
        if user.test_date:
            days_until_test = (user.test_date - date.today()).days
            if days_until_test < 0:
                days_until_test = None
        
        return ProgressStatsResponse(
            user_id=user_id,
            display_name=user.display_name,
            vocabulary=vocab_stats,
            listening=listening_stats,
            speaking=speaking_stats,
            predicted_icao_level=predicted_level,
            level_description=ICAO_LEVEL_DESCRIPTIONS.get(int(predicted_level), "Unknown"),
            level_progress_percent=level_progress,
            total_practice_minutes=user.total_practice_minutes,
            practice_this_week_minutes=time_stats["this_week_minutes"],
            average_daily_minutes=time_stats["avg_daily_minutes"],
            total_xp=user.total_xp,
            xp_this_week=time_stats["this_week_xp"],
            streak=streak,
            test_date=user.test_date,
            days_until_test=days_until_test,
            on_track_for_goal=predicted_level >= (user.target_icao_level - 0.5),
            last_practice_at=user.last_practice_at
        )
    
    def _get_vocabulary_stats(self, user_id: str) -> VocabularyStats:
        """Get vocabulary statistics."""
        # Total terms
        total_terms = self.db.execute(
            select(func.count(VocabularyTerm.id))
        ).scalar() or 0
        
        # User's progress
        progress_records = self.db.execute(
            select(VocabularyProgress).where(
                VocabularyProgress.user_id == user_id
            )
        ).scalars().all()
        
        now = datetime.utcnow()
        learned = len(progress_records)
        mastered = 0
        due = 0
        total_reviews = 0
        correct_reviews = 0
        
        for p in progress_records:
            total_reviews += p.total_reviews
            correct_reviews += p.correct_reviews
            
            mastery = calculate_mastery_percent(
                p.ease_factor, p.repetitions, p.correct_reviews, p.total_reviews
            )
            
            if mastery >= 80:
                mastered += 1
            
            if p.next_review_at <= now:
                due += 1
        
        accuracy = (correct_reviews / total_reviews * 100) if total_reviews > 0 else 0
        mastery_percent = (mastered / learned * 100) if learned > 0 else 0
        
        # By category
        by_category = self._get_vocab_category_stats(user_id)
        
        return VocabularyStats(
            total_terms=total_terms,
            learned_terms=learned,
            mastered_terms=mastered,
            due_for_review=due,
            new_available=total_terms - learned,
            mastery_percent=round(mastery_percent, 1),
            by_category=by_category,
            review_accuracy=round(accuracy, 1)
        )
    
    def _get_vocab_category_stats(self, user_id: str) -> List[CategoryProgress]:
        """Get vocabulary stats by category."""
        categories = self.db.execute(
            select(VocabularyTerm.category).distinct()
        ).scalars().all()
        
        result = []
        for cat in categories:
            # Total in category
            total = self.db.execute(
                select(func.count(VocabularyTerm.id)).where(
                    VocabularyTerm.category == cat
                )
            ).scalar() or 0
            
            # User's progress in category
            progress = self.db.execute(
                select(VocabularyProgress)
                .join(VocabularyTerm, VocabularyProgress.term_id == VocabularyTerm.id)
                .where(
                    VocabularyProgress.user_id == user_id,
                    VocabularyTerm.category == cat
                )
            ).scalars().all()
            
            completed = len(progress)
            mastered = 0
            
            for p in progress:
                mastery = calculate_mastery_percent(
                    p.ease_factor, p.repetitions, p.correct_reviews, p.total_reviews
                )
                if mastery >= 80:
                    mastered += 1
            
            result.append(CategoryProgress(
                category=cat,
                display_name=cat.replace("_", " ").title(),
                icon="📚",
                total_items=total,
                completed_items=completed,
                mastered_items=mastered,
                mastery_percent=round(mastered / total * 100, 1) if total > 0 else 0
            ))
        
        return result
    
    def _get_listening_stats(self, user_id: str) -> ListeningStats:
        """Get listening statistics."""
        # Total exercises
        total = self.db.execute(
            select(func.count(ListeningExercise.id))
        ).scalar() or 0
        
        # User's attempts
        attempts = self.db.execute(
            select(ListeningAttempt).where(
                ListeningAttempt.user_id == user_id,
                ListeningAttempt.completed == True
            )
        ).scalars().all()
        
        completed_ids = set(a.exercise_id for a in attempts)
        completed = len(completed_ids)
        
        avg_score = sum(a.score_percent for a in attempts) / len(attempts) if attempts else 0
        
        # By difficulty
        by_difficulty = {}
        for diff in [1, 2, 3]:
            diff_attempts = [a for a in attempts if self._get_exercise_difficulty(a.exercise_id) == diff]
            if diff_attempts:
                by_difficulty[diff] = round(
                    sum(a.score_percent for a in diff_attempts) / len(diff_attempts), 1
                )
            else:
                by_difficulty[diff] = 0
        
        # By category
        by_category = self._get_listening_category_stats(user_id)
        
        return ListeningStats(
            total_exercises=total,
            completed_exercises=completed,
            completion_percent=round(completed / total * 100, 1) if total > 0 else 0,
            average_score=round(avg_score, 1),
            total_attempts=len(attempts),
            by_category=by_category,
            by_difficulty=by_difficulty
        )
    
    def _get_exercise_difficulty(self, exercise_id: str) -> int:
        """Get difficulty of an exercise."""
        exercise = self.db.get(ListeningExercise, exercise_id)
        return exercise.difficulty if exercise else 1
    
    def _get_listening_category_stats(self, user_id: str) -> List[CategoryProgress]:
        """Get listening stats by category."""
        categories = self.db.execute(
            select(ListeningExercise.category).distinct()
        ).scalars().all()
        
        result = []
        for cat in categories:
            total = self.db.execute(
                select(func.count(ListeningExercise.id)).where(
                    ListeningExercise.category == cat
                )
            ).scalar() or 0
            
            attempts = self.db.execute(
                select(ListeningAttempt)
                .join(ListeningExercise, ListeningAttempt.exercise_id == ListeningExercise.id)
                .where(
                    ListeningAttempt.user_id == user_id,
                    ListeningAttempt.completed == True,
                    ListeningExercise.category == cat
                )
            ).scalars().all()
            
            completed_ids = set(a.exercise_id for a in attempts)
            avg_score = sum(a.score_percent for a in attempts) / len(attempts) if attempts else 0
            
            result.append(CategoryProgress(
                category=cat,
                display_name=cat.replace("_", " ").title(),
                icon="🎧",
                total_items=total,
                completed_items=len(completed_ids),
                mastery_percent=round(len(completed_ids) / total * 100, 1) if total > 0 else 0,
                average_score=round(avg_score, 1)
            ))
        
        return result
    
    def _get_speaking_stats(self, user_id: str) -> SpeakingStats:
        """Get speaking statistics."""
        # Total scenarios
        total = self.db.execute(
            select(func.count(SpeakingScenario.id))
        ).scalar() or 0
        
        # Completed submissions
        submissions = self.db.execute(
            select(SpeakingSubmission).where(
                SpeakingSubmission.user_id == user_id,
                SpeakingSubmission.status == SubmissionStatus.COMPLETED
            )
        ).scalars().all()
        
        completed_ids = set(s.scenario_id for s in submissions)
        completed = len(completed_ids)
        
        # Calculate ICAO criteria averages
        criteria_totals = {
            'pronunciation': [], 'structure': [], 'vocabulary': [],
            'fluency': [], 'comprehension': [], 'interaction': []
        }
        
        for s in submissions:
            if s.score_pronunciation:
                criteria_totals['pronunciation'].append(s.score_pronunciation)
            if s.score_structure:
                criteria_totals['structure'].append(s.score_structure)
            if s.score_vocabulary:
                criteria_totals['vocabulary'].append(s.score_vocabulary)
            if s.score_fluency:
                criteria_totals['fluency'].append(s.score_fluency)
            if s.score_comprehension:
                criteria_totals['comprehension'].append(s.score_comprehension)
            if s.score_interaction:
                criteria_totals['interaction'].append(s.score_interaction)
        
        icao_criteria = ICAOCriteriaProgress(
            pronunciation=round(sum(criteria_totals['pronunciation']) / len(criteria_totals['pronunciation']), 2) if criteria_totals['pronunciation'] else 3.0,
            structure=round(sum(criteria_totals['structure']) / len(criteria_totals['structure']), 2) if criteria_totals['structure'] else 3.0,
            vocabulary=round(sum(criteria_totals['vocabulary']) / len(criteria_totals['vocabulary']), 2) if criteria_totals['vocabulary'] else 3.0,
            fluency=round(sum(criteria_totals['fluency']) / len(criteria_totals['fluency']), 2) if criteria_totals['fluency'] else 3.0,
            comprehension=round(sum(criteria_totals['comprehension']) / len(criteria_totals['comprehension']), 2) if criteria_totals['comprehension'] else 3.0,
            interaction=round(sum(criteria_totals['interaction']) / len(criteria_totals['interaction']), 2) if criteria_totals['interaction'] else 3.0
        )
        
        avg_score = icao_criteria.average()
        
        # By category
        by_category = self._get_speaking_category_stats(user_id)
        
        return SpeakingStats(
            total_scenarios=total,
            completed_scenarios=completed,
            completion_percent=round(completed / total * 100, 1) if total > 0 else 0,
            average_score=avg_score,
            total_submissions=len(submissions),
            icao_criteria=icao_criteria,
            by_category=by_category,
            weakest_criterion=icao_criteria.weakest(),
            strongest_criterion=icao_criteria.strongest()
        )
    
    def _get_speaking_category_stats(self, user_id: str) -> List[CategoryProgress]:
        """Get speaking stats by category."""
        categories = self.db.execute(
            select(SpeakingScenario.category).distinct()
        ).scalars().all()
        
        result = []
        for cat in categories:
            total = self.db.execute(
                select(func.count(SpeakingScenario.id)).where(
                    SpeakingScenario.category == cat
                )
            ).scalar() or 0
            
            submissions = self.db.execute(
                select(SpeakingSubmission)
                .join(SpeakingScenario, SpeakingSubmission.scenario_id == SpeakingScenario.id)
                .where(
                    SpeakingSubmission.user_id == user_id,
                    SpeakingSubmission.status == SubmissionStatus.COMPLETED,
                    SpeakingScenario.category == cat
                )
            ).scalars().all()
            
            completed_ids = set(s.scenario_id for s in submissions)
            scores = [s.overall_score for s in submissions if s.overall_score]
            avg_score = sum(scores) / len(scores) * 100 / 6 if scores else 0  # Convert to percentage
            
            result.append(CategoryProgress(
                category=cat,
                display_name=cat.replace("_", " ").title(),
                icon="🎤",
                total_items=total,
                completed_items=len(completed_ids),
                mastery_percent=round(len(completed_ids) / total * 100, 1) if total > 0 else 0,
                average_score=round(avg_score, 1)
            ))
        
        return result
    
    def _get_time_stats(self, user_id: str) -> dict:
        """Get time-related statistics."""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        
        # This week's progress
        week_progress = self.db.execute(
            select(DailyProgress).where(
                DailyProgress.user_id == user_id,
                DailyProgress.date >= week_start,
                DailyProgress.date <= today
            )
        ).scalars().all()
        
        this_week_minutes = sum(p.practice_minutes for p in week_progress)
        this_week_xp = sum(p.xp_earned for p in week_progress)
        active_days = len([p for p in week_progress if p.total_activities > 0])
        
        avg_daily = this_week_minutes / active_days if active_days > 0 else 0
        
        return {
            "this_week_minutes": this_week_minutes,
            "this_week_xp": this_week_xp,
            "avg_daily_minutes": round(avg_daily, 1)
        }
    
    def _calculate_predicted_icao_level(
        self,
        vocab_stats: VocabularyStats,
        listening_stats: ListeningStats,
        speaking_stats: SpeakingStats
    ) -> Tuple[float, float]:
        """
        Calculate predicted ICAO level from all performance data.
        
        ICAO level is primarily determined by speaking scores (the 6 criteria),
        but vocabulary and listening contribute to overall proficiency.
        
        Returns:
            Tuple of (predicted_level, progress_to_next_level)
        """
        # Speaking is the primary determinant
        speaking_level = speaking_stats.icao_criteria.average()
        
        # Listening score (normalized to 1-6 scale)
        listening_normalized = 1 + (listening_stats.average_score / 100) * 5
        
        # Vocabulary mastery (normalized to 1-6 scale)
        vocab_normalized = 1 + (vocab_stats.mastery_percent / 100) * 5
        
        # Weighted average: Speaking 60%, Listening 25%, Vocabulary 15%
        predicted = (
            speaking_level * 0.6 +
            listening_normalized * 0.25 +
            vocab_normalized * 0.15
        )
        
        # Clamp to valid range
        predicted = max(1.0, min(6.0, predicted))
        
        # Calculate progress to next level
        current_floor = int(predicted)
        progress = (predicted - current_floor) * 100
        
        return round(predicted, 2), round(progress, 1)
    
    # =========================================================================
    # Achievements
    # =========================================================================
    
    def get_achievements(self, user_id: str) -> AchievementListResponse:
        """Get user's achievements (earned, in progress, locked)."""
        # Get all achievements
        all_achievements = self.db.execute(
            select(Achievement).order_by(Achievement.sort_order, Achievement.category)
        ).scalars().all()
        
        # Get user's achievement records
        user_achievements = self.db.execute(
            select(UserAchievement).where(UserAchievement.user_id == user_id)
        ).scalars().all()
        
        user_achievement_map = {ua.achievement_id: ua for ua in user_achievements}
        
        earned = []
        in_progress = []
        locked = []
        total_xp = 0
        
        for achievement in all_achievements:
            user_ach = user_achievement_map.get(achievement.id)
            
            if user_ach and user_ach.is_unlocked:
                # Earned
                earned.append(AchievementResponse(
                    id=achievement.id,
                    code=achievement.code,
                    title=achievement.title,
                    description=achievement.description,
                    icon=achievement.icon,
                    category=achievement.category,
                    xp_reward=achievement.xp_reward,
                    is_hidden=achievement.is_hidden,
                    requirement_type=achievement.requirement_type,
                    requirement_value=achievement.requirement_value,
                    is_unlocked=True,
                    unlocked_at=user_ach.unlocked_at,
                    progress=achievement.requirement_value,
                    progress_percent=100
                ))
                total_xp += achievement.xp_reward
            elif user_ach and user_ach.progress > 0:
                # In progress
                progress_pct = min(100, (user_ach.progress / achievement.requirement_value) * 100)
                in_progress.append(AchievementResponse(
                    id=achievement.id,
                    code=achievement.code,
                    title=achievement.title,
                    description=achievement.description,
                    icon=achievement.icon,
                    category=achievement.category,
                    xp_reward=achievement.xp_reward,
                    is_hidden=achievement.is_hidden,
                    requirement_type=achievement.requirement_type,
                    requirement_value=achievement.requirement_value,
                    is_unlocked=False,
                    progress=user_ach.progress,
                    progress_percent=round(progress_pct, 1)
                ))
            elif not achievement.is_hidden:
                # Locked (only show if not hidden)
                locked.append(AchievementResponse(
                    id=achievement.id,
                    code=achievement.code,
                    title=achievement.title,
                    description=achievement.description,
                    icon=achievement.icon,
                    category=achievement.category,
                    xp_reward=achievement.xp_reward,
                    is_hidden=False,
                    requirement_type=achievement.requirement_type,
                    requirement_value=achievement.requirement_value,
                    is_unlocked=False,
                    progress=0,
                    progress_percent=0
                ))
        
        return AchievementListResponse(
            earned=earned,
            in_progress=in_progress,
            locked=locked,
            total_earned=len(earned),
            total_xp_from_achievements=total_xp
        )
    
    def check_and_award_achievements(self, user_id: str) -> List[AchievementResponse]:
        """
        Check for newly unlocked achievements and award them.
        
        Returns list of newly unlocked achievements.
        """
        user = self.db.get(User, user_id)
        if not user:
            return []
        
        streak = self.get_streak(user_id)
        
        # Get current counts
        vocab_count = self.db.execute(
            select(func.count(VocabularyProgress.id)).where(
                VocabularyProgress.user_id == user_id
            )
        ).scalar() or 0
        
        listening_count = self.db.execute(
            select(func.count(func.distinct(ListeningAttempt.exercise_id))).where(
                ListeningAttempt.user_id == user_id,
                ListeningAttempt.completed == True
            )
        ).scalar() or 0
        
        speaking_count = self.db.execute(
            select(func.count(func.distinct(SpeakingSubmission.scenario_id))).where(
                SpeakingSubmission.user_id == user_id,
                SpeakingSubmission.status == SubmissionStatus.COMPLETED
            )
        ).scalar() or 0
        
        # Get all achievements
        achievements = self.db.execute(select(Achievement)).scalars().all()
        
        newly_unlocked = []
        
        for achievement in achievements:
            # Check if already earned
            user_ach = self.db.execute(
                select(UserAchievement).where(
                    UserAchievement.user_id == user_id,
                    UserAchievement.achievement_id == achievement.id
                )
            ).scalar_one_or_none()
            
            if user_ach and user_ach.is_unlocked:
                continue  # Already earned
            
            # Check if requirement met
            current_value = self._get_achievement_progress(
                achievement, user_id, streak, vocab_count, listening_count, speaking_count
            )
            
            if current_value >= achievement.requirement_value:
                # Unlock achievement
                if user_ach is None:
                    user_ach = UserAchievement(
                        user_id=user_id,
                        achievement_id=achievement.id
                    )
                    self.db.add(user_ach)
                
                user_ach.progress = current_value
                user_ach.unlock()
                
                # Award XP
                user.total_xp += achievement.xp_reward
                
                newly_unlocked.append(AchievementResponse(
                    id=achievement.id,
                    code=achievement.code,
                    title=achievement.title,
                    description=achievement.description,
                    icon=achievement.icon,
                    category=achievement.category,
                    xp_reward=achievement.xp_reward,
                    is_hidden=achievement.is_hidden,
                    requirement_type=achievement.requirement_type,
                    requirement_value=achievement.requirement_value,
                    is_unlocked=True,
                    unlocked_at=user_ach.unlocked_at,
                    progress=achievement.requirement_value,
                    progress_percent=100
                ))
            elif current_value > 0 and not user_ach:
                # Update progress
                user_ach = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    progress=current_value
                )
                self.db.add(user_ach)
            elif user_ach:
                user_ach.progress = current_value
        
        self.db.commit()
        return newly_unlocked
    
    def _get_achievement_progress(
        self,
        achievement: Achievement,
        user_id: str,
        streak: StreakResponse,
        vocab_count: int,
        listening_count: int,
        speaking_count: int
    ) -> int:
        """Get current progress toward an achievement."""
        if achievement.requirement_type == "streak":
            return streak.current_streak
        elif achievement.requirement_type == "longest_streak":
            return streak.longest_streak
        elif achievement.requirement_type == "vocab_count":
            return vocab_count
        elif achievement.requirement_type == "listening_count":
            return listening_count
        elif achievement.requirement_type == "speaking_count":
            return speaking_count
        elif achievement.requirement_type == "total_xp":
            user = self.db.get(User, user_id)
            return user.total_xp if user else 0
        elif achievement.requirement_type == "first":
            # First-time achievements
            if achievement.category == "vocabulary":
                return 1 if vocab_count > 0 else 0
            elif achievement.category == "listening":
                return 1 if listening_count > 0 else 0
            elif achievement.category == "speaking":
                return 1 if speaking_count > 0 else 0
            return 0
        
        return 0
    
    # =========================================================================
    # Practice Session
    # =========================================================================
    
    def log_practice_session(
        self,
        user_id: str,
        session: PracticeSessionRequest
    ) -> PracticeSessionResponse:
        """
        Log a completed practice session.
        
        Updates daily progress, streak, and checks achievements.
        """
        user = self.db.get(User, user_id)
        if not user:
            raise ValueError("User not found")
        
        today = date.today()
        
        # Get or create daily progress
        daily = self.get_or_create_daily_progress(user_id, today)
        
        # Update counts
        daily.vocab_reviewed += session.vocab_reviewed
        daily.listening_completed += session.listening_completed
        daily.speaking_completed += session.speaking_completed
        daily.practice_minutes += session.practice_minutes
        
        # Calculate XP (bonus for session)
        session_xp = (
            session.vocab_reviewed * 2 +
            session.listening_completed * 10 +
            session.speaking_completed * 15 +
            session.practice_minutes // 5  # 1 XP per 5 minutes
        )
        daily.xp_earned += session_xp
        user.total_xp += session_xp
        user.total_practice_minutes += session.practice_minutes
        user.last_practice_at = datetime.utcnow()
        
        # Check if goal met
        if user.daily_goal_minutes and daily.practice_minutes >= user.daily_goal_minutes:
            daily.goal_met = True
        
        goal_progress = (daily.practice_minutes / user.daily_goal_minutes * 100) if user.daily_goal_minutes else 100
        
        # Update streak
        streak_update = self.update_streak(user_id, today)
        
        # Check achievements
        new_achievements = self.check_and_award_achievements(user_id)
        
        # Calculate predicted level
        vocab_stats = self._get_vocabulary_stats(user_id)
        listening_stats = self._get_listening_stats(user_id)
        speaking_stats = self._get_speaking_stats(user_id)
        predicted_level, _ = self._calculate_predicted_icao_level(
            vocab_stats, listening_stats, speaking_stats
        )
        
        # Calculate level change (would need previous level stored)
        level_change = 0  # Placeholder
        
        self.db.commit()
        
        return PracticeSessionResponse(
            daily_progress=DailyProgressResponse(
                id=daily.id,
                date=daily.date,
                vocab_reviewed=daily.vocab_reviewed,
                listening_completed=daily.listening_completed,
                speaking_completed=daily.speaking_completed,
                practice_minutes=daily.practice_minutes,
                xp_earned=daily.xp_earned,
                goal_met=daily.goal_met,
                total_activities=daily.total_activities
            ),
            streak=streak_update.streak,
            xp_earned=session_xp,
            streak_maintained=streak_update.streak_maintained,
            streak_increased=streak_update.streak_increased,
            goal_met=daily.goal_met,
            goal_progress_percent=min(100, round(goal_progress, 1)),
            new_achievements=new_achievements,
            predicted_icao_level=predicted_level,
            level_change=level_change
        )

