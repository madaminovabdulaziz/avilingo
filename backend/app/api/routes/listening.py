"""
Listening API Routes

Endpoints:
- GET /listening - List listening exercises with filters
- GET /listening/filters - Get available filter options
- GET /listening/stats - Get user's listening statistics
- GET /listening/{id} - Get exercise with questions
- POST /listening/{id}/submit - Submit answers and get score
- GET /listening/attempts/{id} - Get specific attempt details
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import logging

from app.db.session import get_db
from app.models.user import User
from app.api.dependencies import get_current_user, get_optional_user
from app.services.listening_service import ListeningService
from app.schemas.listening import (
    ListeningListResponse,
    ListeningExerciseResponse,
    ListeningSubmitRequest,
    ListeningSubmitResponse,
    ListeningAttemptResponse,
    ListeningFilters,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# List Exercises
# =============================================================================

@router.get(
    "",
    response_model=ListeningListResponse,
    summary="List listening exercises",
    description="Get paginated list of listening exercises with optional filters. Transcripts are NOT included."
)
async def list_listening_exercises(
    category: Optional[str] = Query(
        None, 
        description="Filter by category (clearance_delivery, ground, tower, approach, etc.)"
    ),
    difficulty: Optional[int] = Query(
        None, 
        ge=1, 
        le=3, 
        description="Filter by difficulty level (1=easy, 2=medium, 3=hard)"
    ),
    accent: Optional[str] = Query(
        None, 
        description="Filter by accent (American, British, Indian, etc.)"
    ),
    speed: Optional[str] = Query(
        None, 
        description="Filter by speed (slow, normal, fast)"
    ),
    completed: Optional[bool] = Query(
        None, 
        description="Filter by completion status (requires authentication)"
    ),
    skip: int = Query(0, ge=0, description="Number of items to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of items to return"),
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    List listening exercises with filters.
    
    **Categories:**
    - clearance_delivery
    - ground
    - tower
    - approach
    - departure
    - en_route
    - emergency
    
    **Note:** Transcript is NOT included in list view - only revealed after attempt.
    
    If authenticated, includes user's completion status and best scores.
    """
    service = ListeningService(db)
    
    user_id = user.id if user else None
    
    return service.list_exercises(
        user_id=user_id,
        category=category,
        difficulty=difficulty,
        accent=accent,
        speed=speed,
        completed=completed,
        skip=skip,
        limit=limit
    )


# =============================================================================
# Get Filter Options
# =============================================================================

@router.get(
    "/filters",
    response_model=ListeningFilters,
    summary="Get filter options",
    description="Get available options for filtering listening exercises."
)
async def get_listening_filters(
    db: Session = Depends(get_db)
):
    """
    Get available filter options for listening exercises.
    
    Returns lists of available categories, accents, speeds, and difficulty levels.
    """
    service = ListeningService(db)
    return service.get_available_filters()


# =============================================================================
# User Statistics
# =============================================================================

@router.get(
    "/stats",
    summary="Get listening statistics",
    description="Get user's listening exercise statistics."
)
async def get_listening_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's listening exercise statistics.
    
    Returns:
    - Total exercises available
    - Exercises completed
    - Total attempts
    - Average score
    - Total time spent
    - Total XP earned
    """
    service = ListeningService(db)
    return service.get_user_stats(user.id)


# =============================================================================
# Get Single Exercise
# =============================================================================

@router.get(
    "/{exercise_id}",
    response_model=ListeningExerciseResponse,
    summary="Get exercise with questions",
    description="Get a listening exercise with its questions. Transcript is NOT included until submission."
)
async def get_listening_exercise(
    exercise_id: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get a listening exercise with its questions.
    
    **Includes:**
    - Exercise metadata (title, category, difficulty, etc.)
    - Audio URL
    - Questions (without correct answers)
    - User's previous attempts (if authenticated)
    
    **Does NOT include:**
    - Transcript (revealed only after submission)
    - Correct answers (revealed only after submission)
    - Explanations (revealed only after submission)
    """
    service = ListeningService(db)
    
    user_id = user.id if user else None
    exercise = service.get_exercise(exercise_id, user_id)
    
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listening exercise not found"
        )
    
    return exercise


# =============================================================================
# Submit Answers
# =============================================================================

@router.post(
    "/{exercise_id}/submit",
    response_model=ListeningSubmitResponse,
    summary="Submit answers",
    description="Submit answers for a listening exercise and get results."
)
async def submit_listening_answers(
    exercise_id: str,
    submission: ListeningSubmitRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submit answers for a listening exercise.
    
    **Request body:**
    - answers: Dictionary mapping question_id to user's answer
    - time_spent_seconds: Total time spent on the exercise
    - audio_plays: Number of times audio was played
    
    **Response includes:**
    - Score percentage
    - Correct/incorrect for each question
    - Explanations for wrong answers
    - Full transcript (revealed after submission)
    - Teaching points
    - XP earned
    
    **XP Calculation:**
    - Base XP by difficulty (10/15/20)
    - Multiplied by score percentage
    - 1.5x bonus for first attempt
    - 1.25x bonus for perfect score
    """
    service = ListeningService(db)
    
    result = service.submit_answers(
        user_id=user.id,
        exercise_id=exercise_id,
        submission=submission
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listening exercise not found"
        )
    
    logger.info(
        f"User {user.id} completed listening exercise {exercise_id}. "
        f"Score: {result.score_percent}%, XP: {result.xp_earned}"
    )
    
    return result


# =============================================================================
# Get Attempt Details
# =============================================================================

@router.get(
    "/attempts/{attempt_id}",
    response_model=ListeningAttemptResponse,
    summary="Get attempt details",
    description="Get details of a specific listening attempt."
)
async def get_listening_attempt(
    attempt_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific listening attempt.
    
    Only the user who made the attempt can view it.
    """
    service = ListeningService(db)
    
    attempt = service.get_attempt(attempt_id, user.id)
    
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt not found"
        )
    
    return ListeningAttemptResponse(
        id=attempt.id,
        user_id=attempt.user_id,
        exercise_id=attempt.exercise_id,
        score_percent=attempt.score_percent,
        correct_count=attempt.correct_count,
        total_questions=attempt.total_questions,
        answers=attempt.answers,
        time_spent_seconds=attempt.time_spent_seconds,
        audio_plays=attempt.audio_plays,
        completed=attempt.completed,
        xp_earned=attempt.xp_earned,
        created_at=attempt.created_at,
        completed_at=attempt.completed_at
    )


# =============================================================================
# Get User Attempts for Exercise
# =============================================================================

@router.get(
    "/{exercise_id}/attempts",
    summary="Get attempts for exercise",
    description="Get user's attempts for a specific exercise."
)
async def get_exercise_attempts(
    exercise_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's attempts for a specific exercise.
    
    Returns list of all attempts with scores and timestamps.
    """
    from sqlalchemy import select, desc
    from app.models.listening import ListeningAttempt, ListeningExercise
    
    # Verify exercise exists
    exercise = db.get(ListeningExercise, exercise_id)
    if not exercise:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listening exercise not found"
        )
    
    # Get attempts
    attempts = db.execute(
        select(ListeningAttempt).where(
            ListeningAttempt.user_id == user.id,
            ListeningAttempt.exercise_id == exercise_id
        ).order_by(desc(ListeningAttempt.created_at))
    ).scalars().all()
    
    return {
        "exercise_id": exercise_id,
        "exercise_title": exercise.title,
        "attempts": [
            {
                "id": a.id,
                "score_percent": a.score_percent,
                "correct_count": a.correct_count,
                "total_questions": a.total_questions,
                "time_spent_seconds": a.time_spent_seconds,
                "xp_earned": a.xp_earned,
                "created_at": a.created_at,
                "completed_at": a.completed_at
            }
            for a in attempts
        ],
        "total_attempts": len(attempts),
        "best_score": max((a.score_percent for a in attempts), default=0)
    }
