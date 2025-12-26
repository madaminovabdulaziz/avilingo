"""
Vocabulary API Routes

Endpoints:
- GET /vocabulary - List vocabulary terms with filters
- GET /vocabulary/{id} - Get single term details
- GET /vocabulary/review-queue - Get terms due for review
- POST /vocabulary/{id}/review - Submit review with quality rating
- GET /vocabulary/stats - Get vocabulary statistics
- GET /vocabulary/categories - Get available categories
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import Optional
import logging

from app.db.session import get_db
from app.models.vocabulary import VocabularyTerm, VocabularyProgress
from app.models.user import User
from app.api.dependencies import get_current_user, get_optional_user
from app.services.vocabulary_service import VocabularyService
from app.schemas.vocabulary import (
    VocabularyTermResponse,
    VocabularyTermBrief,
    VocabularyListResponse,
    VocabularyReviewRequest,
    VocabularyReviewResponse,
    VocabularyReviewQueue,
    VocabularyCategoryStats,
    VocabularyProgressResponse,
)
from app.services.spaced_repetition import calculate_mastery_percent

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# List Vocabulary
# =============================================================================

@router.get(
    "",
    response_model=VocabularyListResponse,
    summary="List vocabulary terms",
    description="Get paginated list of vocabulary terms with optional filters."
)
async def list_vocabulary(
    category: Optional[str] = Query(
        None, 
        description="Filter by category (e.g., standard_phraseology, weather, navigation)"
    ),
    difficulty: Optional[int] = Query(
        None, 
        ge=1, 
        le=5, 
        description="Filter by difficulty level (1-5)"
    ),
    icao_level: Optional[int] = Query(
        None,
        ge=1,
        le=6,
        description="Filter by target ICAO level"
    ),
    search: Optional[str] = Query(
        None,
        min_length=2,
        max_length=100,
        description="Search in term and definition"
    ),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    db: Session = Depends(get_db)
):
    """
    List vocabulary terms with optional filters and pagination.
    
    Categories include:
    - standard_phraseology
    - weather
    - navigation
    - emergencies
    - aircraft_systems
    - airport_operations
    """
    service = VocabularyService(db)
    
    return service.list_terms(
        category=category,
        difficulty=difficulty,
        icao_level=icao_level,
        search=search,
        skip=skip,
        limit=limit
    )


# =============================================================================
# Get Categories
# =============================================================================

@router.get(
    "/categories",
    summary="Get vocabulary categories",
    description="Get list of available vocabulary categories with term counts."
)
async def get_categories(
    db: Session = Depends(get_db)
):
    """Get all available vocabulary categories with counts."""
    result = db.execute(
        select(
            VocabularyTerm.category,
            func.count(VocabularyTerm.id).label('count')
        ).group_by(VocabularyTerm.category)
    )
    
    categories = [
        {"category": row[0], "count": row[1]}
        for row in result.all()
    ]
    
    return {"categories": categories}


# =============================================================================
# Review Queue
# =============================================================================

@router.get(
    "/review-queue",
    response_model=VocabularyReviewQueue,
    summary="Get review queue",
    description="Get vocabulary terms due for review, sorted by priority."
)
async def get_review_queue(
    limit: int = Query(10, ge=1, le=50, description="Maximum cards to return"),
    include_new: bool = Query(True, description="Include new (never reviewed) terms"),
    category: Optional[str] = Query(None, description="Filter by category"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get vocabulary terms due for review.
    
    Returns terms sorted by priority using SM-2 algorithm:
    1. Overdue items come first (higher priority for longer overdue)
    2. Harder items (lower ease factor) get higher priority
    3. Less established items (fewer repetitions) get higher priority
    4. New items are added after due items
    """
    service = VocabularyService(db)
    
    return service.get_review_queue(
        user_id=user.id,
        limit=limit,
        include_new=include_new,
        category=category
    )


# =============================================================================
# Vocabulary Statistics
# =============================================================================

@router.get(
    "/stats",
    summary="Get vocabulary statistics",
    description="Get user's overall vocabulary learning statistics."
)
async def get_vocabulary_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's vocabulary learning statistics.
    
    Returns:
    - Total terms available
    - Terms learned (reviewed at least once)
    - Terms mastered (mastery >= 80%)
    - Terms due for review
    - Overall accuracy
    """
    service = VocabularyService(db)
    return service.get_user_vocabulary_stats(user.id)


@router.get(
    "/stats/categories",
    response_model=list[VocabularyCategoryStats],
    summary="Get statistics by category",
    description="Get vocabulary learning statistics broken down by category."
)
async def get_category_stats(
    category: Optional[str] = Query(None, description="Specific category or all"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get vocabulary statistics grouped by category."""
    service = VocabularyService(db)
    return service.get_category_stats(user.id, category)


# =============================================================================
# Get Single Term
# =============================================================================

@router.get(
    "/{term_id}",
    response_model=VocabularyTermResponse,
    summary="Get vocabulary term",
    description="Get detailed information about a single vocabulary term."
)
async def get_vocabulary_term(
    term_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a single vocabulary term by ID.
    
    Returns full term details including:
    - Term and phonetics
    - Definition and aviation context
    - Example ATC instruction and pilot response
    - Common errors and pronunciation tips
    - Related terms
    """
    term = db.get(VocabularyTerm, term_id)
    
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary term not found"
        )
    
    return VocabularyTermResponse.model_validate(term)


@router.get(
    "/{term_id}/progress",
    response_model=VocabularyProgressResponse,
    summary="Get term progress",
    description="Get user's learning progress for a specific term."
)
async def get_term_progress(
    term_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's progress for a specific vocabulary term.
    
    Returns SM-2 algorithm values and learning statistics.
    """
    # Verify term exists
    term = db.get(VocabularyTerm, term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary term not found"
        )
    
    # Get progress
    progress = db.execute(
        select(VocabularyProgress).where(
            VocabularyProgress.user_id == user.id,
            VocabularyProgress.term_id == term_id
        )
    ).scalar_one_or_none()
    
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No progress found for this term. Review it first."
        )
    
    return VocabularyProgressResponse(
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
        is_due=progress.is_due
    )


# =============================================================================
# Submit Review
# =============================================================================

@router.post(
    "/{term_id}/review",
    response_model=VocabularyReviewResponse,
    summary="Submit vocabulary review",
    description="Submit a vocabulary review with quality rating (0-5)."
)
async def submit_review(
    term_id: str,
    review: VocabularyReviewRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit a vocabulary review.
    
    Quality rating (SM-2 algorithm):
    - 0: Complete blackout, no recall at all
    - 1: Incorrect response, but recognized when shown answer
    - 2: Incorrect response, but answer was easy to recall
    - 3: Correct response with significant difficulty
    - 4: Correct response with some hesitation
    - 5: Perfect response, instant recall
    
    The SM-2 algorithm updates:
    - Ease factor: Adjusted based on quality (min 1.3)
    - Interval: Days until next review
    - Repetitions: Consecutive correct reviews
    
    Quality < 3 resets the card (failed recall).
    Quality >= 3 extends the interval.
    """
    service = VocabularyService(db)
    
    result = service.submit_review(
        user_id=user.id,
        term_id=term_id,
        review=review
    )
    
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary term not found"
        )
    
    logger.info(
        f"User {user.id} reviewed term {term_id} with quality {review.quality}. "
        f"Next review in {result.new_interval_days} days."
    )
    
    return result
