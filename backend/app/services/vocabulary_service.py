"""
Vocabulary Service

Business logic for vocabulary operations including:
- Listing and filtering vocabulary terms
- Managing review queue with SM-2 algorithm
- Processing vocabulary reviews
"""

from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import Session

from app.models.vocabulary import VocabularyTerm, VocabularyProgress
from app.models.user import User
from app.models.progress import DailyProgress
from app.services.spaced_repetition import (
    calculate_sm2,
    calculate_priority,
    get_xp_for_quality,
    calculate_mastery_percent,
    DEFAULT_EASE_FACTOR,
)
from app.schemas.vocabulary import (
    VocabularyReviewRequest,
    VocabularyReviewResponse,
    VocabularyReviewQueueItem,
    VocabularyReviewQueue,
    VocabularyTermResponse,
    VocabularyProgressResponse,
    VocabularyListResponse,
    VocabularyTermBrief,
    VocabularyCategoryStats,
)


class VocabularyService:
    """Service for vocabulary operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================================================
    # List & Get Terms
    # =========================================================================
    
    def list_terms(
        self,
        category: Optional[str] = None,
        difficulty: Optional[int] = None,
        icao_level: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> VocabularyListResponse:
        """
        List vocabulary terms with optional filters.
        
        Args:
            category: Filter by category
            difficulty: Filter by difficulty level (1-5)
            icao_level: Filter by target ICAO level
            search: Search in term and definition
            skip: Number of items to skip
            limit: Maximum items to return
            
        Returns:
            Paginated list of vocabulary terms
        """
        query = select(VocabularyTerm)
        
        # Apply filters
        conditions = []
        
        if category:
            conditions.append(VocabularyTerm.category == category)
        
        if difficulty is not None:
            conditions.append(VocabularyTerm.difficulty == difficulty)
        
        if icao_level is not None:
            conditions.append(VocabularyTerm.icao_level_target <= icao_level)
        
        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    VocabularyTerm.term.ilike(search_pattern),
                    VocabularyTerm.definition.ilike(search_pattern)
                )
            )
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count(VocabularyTerm.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total = self.db.execute(count_query).scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(
            VocabularyTerm.category,
            VocabularyTerm.difficulty,
            VocabularyTerm.term
        ).offset(skip).limit(limit)
        
        result = self.db.execute(query)
        terms = result.scalars().all()
        
        return VocabularyListResponse(
            items=[VocabularyTermBrief.model_validate(t) for t in terms],
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(terms)) < total
        )
    
    def get_term(self, term_id: str) -> Optional[VocabularyTerm]:
        """Get a single vocabulary term by ID."""
        return self.db.get(VocabularyTerm, term_id)
    
    def get_term_with_progress(
        self, 
        term_id: str, 
        user_id: str
    ) -> Tuple[Optional[VocabularyTerm], Optional[VocabularyProgress]]:
        """Get a term with user's progress."""
        term = self.get_term(term_id)
        if not term:
            return None, None
        
        progress = self.db.execute(
            select(VocabularyProgress).where(
                VocabularyProgress.user_id == user_id,
                VocabularyProgress.term_id == term_id
            )
        ).scalar_one_or_none()
        
        return term, progress
    
    # =========================================================================
    # Review Queue
    # =========================================================================
    
    def get_review_queue(
        self,
        user_id: str,
        limit: int = 10,
        include_new: bool = True,
        category: Optional[str] = None
    ) -> VocabularyReviewQueue:
        """
        Get vocabulary terms due for review.
        
        Priority order:
        1. Overdue items (sorted by priority)
        2. New items (never reviewed)
        
        Args:
            user_id: User's ID
            limit: Maximum items to return
            include_new: Whether to include never-reviewed terms
            category: Optional category filter
            
        Returns:
            Review queue with prioritized items
        """
        now = datetime.utcnow()
        items: List[VocabularyReviewQueueItem] = []
        
        # Get due items (have progress record and are due)
        due_query = (
            select(VocabularyProgress, VocabularyTerm)
            .join(VocabularyTerm, VocabularyProgress.term_id == VocabularyTerm.id)
            .where(
                VocabularyProgress.user_id == user_id,
                VocabularyProgress.next_review_at <= now
            )
        )
        
        if category:
            due_query = due_query.where(VocabularyTerm.category == category)
        
        due_result = self.db.execute(due_query)
        due_items = due_result.all()
        
        # Calculate priority and sort
        due_with_priority = []
        for progress, term in due_items:
            priority, overdue_days = calculate_priority(
                progress.next_review_at,
                progress.ease_factor,
                progress.repetitions
            )
            due_with_priority.append((priority, overdue_days, progress, term))
        
        # Sort by priority (descending)
        due_with_priority.sort(key=lambda x: x[0], reverse=True)
        
        # Add due items to queue
        for priority, overdue_days, progress, term in due_with_priority[:limit]:
            items.append(VocabularyReviewQueueItem(
                term=VocabularyTermResponse.model_validate(term),
                progress=VocabularyProgressResponse(
                    id=progress.id,
                    term_id=progress.term_id,
                    ease_factor=progress.ease_factor,
                    interval_days=progress.interval_days,
                    repetitions=progress.repetitions,
                    next_review_at=progress.next_review_at,
                    total_reviews=progress.total_reviews,
                    correct_reviews=progress.correct_reviews,
                    last_quality=progress.last_quality,
                    last_reviewed_at=progress.last_reviewed_at,
                    mastery_percent=calculate_mastery_percent(
                        progress.ease_factor,
                        progress.repetitions,
                        progress.correct_reviews,
                        progress.total_reviews
                    ),
                    is_due=True
                ),
                is_new=False,
                priority=priority,
                overdue_days=overdue_days
            ))
        
        total_due = len(due_items)
        total_new = 0
        
        # Add new items if we have room and include_new is True
        if include_new and len(items) < limit:
            remaining = limit - len(items)
            
            # Get terms user has never reviewed
            reviewed_term_ids = select(VocabularyProgress.term_id).where(
                VocabularyProgress.user_id == user_id
            )
            
            new_query = (
                select(VocabularyTerm)
                .where(VocabularyTerm.id.not_in(reviewed_term_ids))
            )
            
            if category:
                new_query = new_query.where(VocabularyTerm.category == category)
            
            # Order by difficulty (easier first for new learners)
            new_query = new_query.order_by(
                VocabularyTerm.difficulty,
                VocabularyTerm.term
            ).limit(remaining)
            
            new_result = self.db.execute(new_query)
            new_terms = new_result.scalars().all()
            
            # Count total new
            count_new_query = (
                select(func.count(VocabularyTerm.id))
                .where(VocabularyTerm.id.not_in(reviewed_term_ids))
            )
            if category:
                count_new_query = count_new_query.where(VocabularyTerm.category == category)
            total_new = self.db.execute(count_new_query).scalar() or 0
            
            for term in new_terms:
                items.append(VocabularyReviewQueueItem(
                    term=VocabularyTermResponse.model_validate(term),
                    progress=None,
                    is_new=True,
                    priority=0,
                    overdue_days=0
                ))
        
        return VocabularyReviewQueue(
            items=items,
            total_due=total_due,
            total_new=total_new
        )
    
    # =========================================================================
    # Review Processing
    # =========================================================================
    
    def submit_review(
        self,
        user_id: str,
        term_id: str,
        review: VocabularyReviewRequest
    ) -> Optional[VocabularyReviewResponse]:
        """
        Process a vocabulary review using SM-2 algorithm.
        
        Args:
            user_id: User's ID
            term_id: Term ID being reviewed
            review: Review data with quality rating
            
        Returns:
            Review response with new scheduling, or None if term not found
        """
        # Verify term exists
        term = self.get_term(term_id)
        if not term:
            return None
        
        # Get or create progress record
        progress = self.db.execute(
            select(VocabularyProgress).where(
                VocabularyProgress.user_id == user_id,
                VocabularyProgress.term_id == term_id
            )
        ).scalar_one_or_none()
        
        if progress is None:
            # First time reviewing this term
            progress = VocabularyProgress(
                user_id=user_id,
                term_id=term_id,
                ease_factor=DEFAULT_EASE_FACTOR,
                interval_days=1,
                repetitions=0
            )
            self.db.add(progress)
        
        # Calculate new SM-2 values
        sm2_result = calculate_sm2(
            quality=review.quality,
            current_ease_factor=progress.ease_factor,
            current_interval=progress.interval_days,
            current_repetitions=progress.repetitions
        )
        
        # Update progress record
        progress.ease_factor = sm2_result.ease_factor
        progress.interval_days = sm2_result.interval_days
        progress.repetitions = sm2_result.repetitions
        progress.next_review_at = sm2_result.next_review_at
        progress.total_reviews = (progress.total_reviews or 0) + 1
        progress.last_quality = review.quality
        progress.last_reviewed_at = datetime.utcnow()
        
        if review.quality >= 3:
            progress.correct_reviews = (progress.correct_reviews or 0) + 1
        
        # Calculate XP earned
        xp_earned = get_xp_for_quality(review.quality)
        
        # Update daily progress
        self._update_daily_progress(user_id, xp_earned)
        
        # Update user stats
        self._update_user_stats(user_id, xp_earned)
        
        self.db.commit()
        
        # Calculate mastery
        mastery = calculate_mastery_percent(
            progress.ease_factor,
            progress.repetitions,
            progress.correct_reviews,
            progress.total_reviews
        )
        
        return VocabularyReviewResponse(
            term_id=term_id,
            new_ease_factor=sm2_result.ease_factor,
            new_interval_days=sm2_result.interval_days,
            new_repetitions=sm2_result.repetitions,
            next_review_at=sm2_result.next_review_at,
            mastery_percent=mastery,
            xp_earned=xp_earned,
            streak_maintained=review.quality >= 3
        )
    
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
                vocab_reviewed=1,
                xp_earned=xp_earned
            )
            self.db.add(daily)
        else:
            # Handle NULL values that might exist in database
            daily.vocab_reviewed = (daily.vocab_reviewed or 0) + 1
            daily.xp_earned = (daily.xp_earned or 0) + xp_earned
            daily.updated_at = datetime.utcnow()
    
    def _update_user_stats(self, user_id: str, xp_earned: int) -> None:
        """Update user's total XP."""
        user = self.db.get(User, user_id)
        if user:
            user.total_xp = (user.total_xp or 0) + xp_earned
            user.last_practice_at = datetime.utcnow()
    
    # =========================================================================
    # Statistics
    # =========================================================================
    
    def get_category_stats(
        self, 
        user_id: str, 
        category: Optional[str] = None
    ) -> List[VocabularyCategoryStats]:
        """Get vocabulary statistics by category."""
        # Get all categories or specific one
        if category:
            categories = [category]
        else:
            cat_query = select(VocabularyTerm.category).distinct()
            categories = [
                r[0] for r in self.db.execute(cat_query).all()
            ]
        
        stats = []
        
        for cat in categories:
            # Total terms in category
            total = self.db.execute(
                select(func.count(VocabularyTerm.id)).where(
                    VocabularyTerm.category == cat
                )
            ).scalar() or 0
            
            # Get user's progress for this category
            progress_query = (
                select(VocabularyProgress)
                .join(VocabularyTerm, VocabularyProgress.term_id == VocabularyTerm.id)
                .where(
                    VocabularyProgress.user_id == user_id,
                    VocabularyTerm.category == cat
                )
            )
            progress_records = self.db.execute(progress_query).scalars().all()
            
            learned = 0
            mastered = 0
            due = 0
            total_mastery = 0.0
            
            now = datetime.utcnow()
            
            for p in progress_records:
                learned += 1
                mastery = calculate_mastery_percent(
                    p.ease_factor, p.repetitions, p.correct_reviews, p.total_reviews
                )
                total_mastery += mastery
                
                if mastery >= 80:
                    mastered += 1
                
                if p.next_review_at <= now:
                    due += 1
            
            avg_mastery = total_mastery / learned if learned > 0 else 0.0
            
            stats.append(VocabularyCategoryStats(
                category=cat,
                total_terms=total,
                learned_terms=learned,
                mastered_terms=mastered,
                due_for_review=due,
                average_mastery=round(avg_mastery, 1)
            ))
        
        return stats
    
    def get_user_vocabulary_stats(self, user_id: str) -> dict:
        """Get overall vocabulary statistics for a user."""
        # Total terms
        total_terms = self.db.execute(
            select(func.count(VocabularyTerm.id))
        ).scalar() or 0
        
        # User's progress records
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
        
        accuracy = correct_reviews / total_reviews if total_reviews > 0 else 0
        
        return {
            "total_terms": total_terms,
            "learned_terms": learned,
            "mastered_terms": mastered,
            "due_for_review": due,
            "total_reviews": total_reviews,
            "accuracy_percent": round(accuracy * 100, 1),
            "progress_percent": round(learned / total_terms * 100, 1) if total_terms > 0 else 0
        }

