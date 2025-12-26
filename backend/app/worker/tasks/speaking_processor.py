"""
Speaking Processor Task

Celery tasks for processing speaking submissions:
- Orchestrates transcription + AI feedback pipeline
- Updates submission with results
- Handles retries and failures
"""

import logging
from datetime import datetime, timedelta
from celery import shared_task, chain

from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="app.worker.tasks.speaking_processor.process_submission",
    max_retries=3,
    default_retry_delay=60,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def process_submission(self, submission_id: str) -> dict:
    """
    Main task to process a speaking submission.
    
    Pipeline:
    1. Download audio from S3
    2. Transcribe with Whisper
    3. Generate AI feedback with GPT-4
    4. Update submission with results
    5. Award XP and update progress
    
    Args:
        submission_id: ID of the SpeakingSubmission
        
    Returns:
        Dict with processing result
    """
    import asyncio
    from sqlalchemy import select
    
    from app.db.session import SessionLocal
    from app.models.speaking import SpeakingSubmission, SpeakingScenario, SubmissionStatus
    from app.services.transcription_service import transcription_service
    from app.services.ai_feedback_service import ai_feedback_service
    from app.services.speaking_service import SpeakingService, calculate_speaking_xp
    
    logger.info(f"Processing submission {submission_id}")
    
    db = SessionLocal()
    
    try:
        # Get submission with scenario
        submission = db.execute(
            select(SpeakingSubmission)
            .where(SpeakingSubmission.id == submission_id)
        ).scalar_one_or_none()
        
        if not submission:
            logger.error(f"Submission {submission_id} not found")
            return {"success": False, "error": "Submission not found"}
        
        # Check if already processed
        if submission.status == SubmissionStatus.COMPLETED:
            logger.info(f"Submission {submission_id} already completed")
            return {"success": True, "message": "Already processed"}
        
        # Get scenario details
        scenario = db.get(SpeakingScenario, submission.scenario_id)
        if not scenario:
            _mark_failed(
                db, submission, 
                "Scenario not found",
                error_code=ErrorCodes.SCENARIO_NOT_FOUND
            )
            return {"success": False, "error": "Scenario not found"}
        
        # Update status to processing
        submission.status = SubmissionStatus.PROCESSING
        db.commit()
        
        # Run async processing in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Step 1: Transcribe audio
            logger.info(f"Transcribing audio for {submission_id}")
            transcription_result = loop.run_until_complete(
                transcription_service.transcribe_from_url(
                    submission.audio_url,
                    language="en"
                )
            )
            
            transcript = transcription_result.text
            duration = transcription_result.duration_seconds
            
            if not transcript or len(transcript.strip()) < 3:
                _mark_failed(
                    db, submission, 
                    "Transcription produced no usable text",
                    error_code=ErrorCodes.TRANSCRIPTION_EMPTY
                )
                return {"success": False, "error": "Empty transcription"}
            
            logger.info(
                f"Transcription complete for {submission_id}. "
                f"Length: {len(transcript)}, Duration: {duration}s"
            )
            
            # Step 2: Generate AI feedback
            logger.info(f"Generating AI feedback for {submission_id}")
            scores, feedback = loop.run_until_complete(
                ai_feedback_service.generate_feedback(
                    transcript=transcript,
                    expected_response=scenario.sample_response or "",
                    expected_elements=scenario.expected_elements or [],
                    scenario_context=scenario.setup or "",
                    atc_prompt=scenario.atc_prompt_text or "",
                )
            )
            
            logger.info(
                f"Feedback generated for {submission_id}. "
                f"Average score: {scores.average()}"
            )
            
        finally:
            loop.close()
        
        # Step 3: Update submission with results
        submission.transcript = transcript
        submission.duration_seconds = int(duration) if duration else submission.duration_seconds
        
        # ICAO scores
        submission.score_pronunciation = scores.pronunciation
        submission.score_structure = scores.structure
        submission.score_vocabulary = scores.vocabulary
        submission.score_fluency = scores.fluency
        submission.score_comprehension = scores.comprehension
        submission.score_interaction = scores.interaction
        submission.overall_score = scores.average()
        
        # AI feedback
        submission.ai_feedback = feedback.to_dict()
        
        # Calculate XP
        is_first = _is_first_completed_submission(db, submission.user_id, submission.scenario_id)
        xp_earned = calculate_speaking_xp(scores.average(), scenario.difficulty, is_first)
        submission.xp_earned = xp_earned
        
        # Mark as completed
        submission.status = SubmissionStatus.COMPLETED
        submission.processed_at = datetime.utcnow()
        
        db.commit()
        
        # Step 4: Update user progress
        _update_user_progress(db, submission.user_id, xp_earned)
        
        logger.info(
            f"Submission {submission_id} processed successfully. "
            f"Score: {scores.average()}, XP: {xp_earned}"
        )
        
        return {
            "success": True,
            "submission_id": submission_id,
            "overall_score": scores.average(),
            "xp_earned": xp_earned,
        }
        
    except Exception as e:
        logger.exception(f"Error processing submission {submission_id}: {e}")
        
        try:
            submission = db.get(SpeakingSubmission, submission_id)
            if submission and submission.status != SubmissionStatus.COMPLETED:
                error_code = _get_error_code_from_exception(e)
                _mark_failed(
                    db, submission, 
                    str(e)[:500],
                    error_code=error_code
                )
        except Exception as mark_error:
            logger.exception(f"Failed to mark submission as failed: {mark_error}")
        
        raise
        
    finally:
        db.close()


@shared_task(
    name="app.worker.tasks.speaking_processor.trigger_processing",
)
def trigger_processing(submission_id: str) -> dict:
    """
    Trigger processing for a submission.
    
    Called after upload confirmation to start the processing pipeline.
    """
    logger.info(f"Triggering processing for submission {submission_id}")
    
    # Queue the main processing task
    process_submission.delay(submission_id)
    
    return {"queued": True, "submission_id": submission_id}


@shared_task(
    name="app.worker.tasks.speaking_processor.cleanup_stale_submissions",
)
def cleanup_stale_submissions() -> dict:
    """
    Periodic task to clean up stale submissions.
    
    - Marks submissions stuck in PENDING for >1 hour as failed
    - Retries PROCESSING submissions that seem stuck
    """
    from sqlalchemy import select, and_
    
    from app.db.session import SessionLocal
    from app.models.speaking import SpeakingSubmission, SubmissionStatus
    
    db = SessionLocal()
    stale_count = 0
    retry_count = 0
    
    try:
        now = datetime.utcnow()
        one_hour_ago = now - timedelta(hours=1)
        
        # Find stale PENDING submissions
        stale_pending = db.execute(
            select(SpeakingSubmission).where(
                and_(
                    SpeakingSubmission.status == SubmissionStatus.PENDING,
                    SpeakingSubmission.created_at < one_hour_ago
                )
            )
        ).scalars().all()
        
        for submission in stale_pending:
            # Try to process it
            logger.info(f"Retrying stale submission: {submission.id}")
            process_submission.delay(str(submission.id))
            retry_count += 1
        
        # Find stuck PROCESSING submissions (> 15 minutes)
        fifteen_min_ago = now - timedelta(minutes=15)
        
        stuck_processing = db.execute(
            select(SpeakingSubmission).where(
                and_(
                    SpeakingSubmission.status == SubmissionStatus.PROCESSING,
                    SpeakingSubmission.updated_at < fifteen_min_ago
                )
            )
        ).scalars().all()
        
        for submission in stuck_processing:
            # Reset to pending for retry
            submission.status = SubmissionStatus.PENDING
            retry_count += 1
            logger.info(f"Reset stuck submission: {submission.id}")
        
        db.commit()
        
        logger.info(f"Cleanup complete. Stale: {stale_count}, Retried: {retry_count}")
        
        return {
            "stale_count": stale_count,
            "retry_count": retry_count,
        }
        
    finally:
        db.close()


# =============================================================================
# Error Codes and User-Friendly Messages
# =============================================================================

class ErrorCodes:
    """Machine-readable error codes for frontend handling."""
    AUDIO_NOT_FOUND = "AUDIO_NOT_FOUND"
    AUDIO_DOWNLOAD_FAILED = "AUDIO_DOWNLOAD_FAILED"
    TRANSCRIPTION_FAILED = "TRANSCRIPTION_FAILED"
    TRANSCRIPTION_EMPTY = "TRANSCRIPTION_EMPTY"
    AI_FEEDBACK_FAILED = "AI_FEEDBACK_FAILED"
    SCENARIO_NOT_FOUND = "SCENARIO_NOT_FOUND"
    PROCESSING_TIMEOUT = "PROCESSING_TIMEOUT"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


# Map error codes to user-friendly messages
ERROR_MESSAGES = {
    ErrorCodes.AUDIO_NOT_FOUND: "We couldn't find your audio recording. Please try recording again.",
    ErrorCodes.AUDIO_DOWNLOAD_FAILED: "Failed to download your recording. Please check your internet and try again.",
    ErrorCodes.TRANSCRIPTION_FAILED: "We had trouble transcribing your audio. Please ensure you spoke clearly and try again.",
    ErrorCodes.TRANSCRIPTION_EMPTY: "We couldn't detect any speech in your recording. Please try again and speak clearly.",
    ErrorCodes.AI_FEEDBACK_FAILED: "Our AI feedback system is temporarily unavailable. Your submission has been saved and will be processed shortly.",
    ErrorCodes.SCENARIO_NOT_FOUND: "This practice scenario is no longer available.",
    ErrorCodes.PROCESSING_TIMEOUT: "Processing took too long. Please try again.",
    ErrorCodes.UNKNOWN_ERROR: "An unexpected error occurred. Please try again or contact support.",
}

# Which errors allow retry
RETRYABLE_ERRORS = {
    ErrorCodes.AUDIO_DOWNLOAD_FAILED,
    ErrorCodes.TRANSCRIPTION_FAILED,
    ErrorCodes.AI_FEEDBACK_FAILED,
    ErrorCodes.PROCESSING_TIMEOUT,
    ErrorCodes.UNKNOWN_ERROR,
}

# Suggested user actions
USER_ACTIONS = {
    ErrorCodes.AUDIO_NOT_FOUND: "Record a new response",
    ErrorCodes.AUDIO_DOWNLOAD_FAILED: "Check connection and retry",
    ErrorCodes.TRANSCRIPTION_FAILED: "Try recording again",
    ErrorCodes.TRANSCRIPTION_EMPTY: "Record again, speak clearly",
    ErrorCodes.AI_FEEDBACK_FAILED: "Wait and retry automatically",
    ErrorCodes.SCENARIO_NOT_FOUND: "Choose another scenario",
    ErrorCodes.PROCESSING_TIMEOUT: "Retry submission",
    ErrorCodes.UNKNOWN_ERROR: "Contact support if issue persists",
}


def _get_error_code_from_exception(error: Exception) -> str:
    """Determine the error code based on the exception type and message."""
    error_str = str(error).lower()
    
    if "404" in error_str or "not found" in error_str:
        return ErrorCodes.AUDIO_NOT_FOUND
    elif "download" in error_str or "connection" in error_str or "timeout" in error_str:
        return ErrorCodes.AUDIO_DOWNLOAD_FAILED
    elif "transcri" in error_str or "whisper" in error_str or "speech" in error_str:
        return ErrorCodes.TRANSCRIPTION_FAILED
    elif "openai" in error_str or "gpt" in error_str or "feedback" in error_str:
        return ErrorCodes.AI_FEEDBACK_FAILED
    elif "scenario" in error_str:
        return ErrorCodes.SCENARIO_NOT_FOUND
    else:
        return ErrorCodes.UNKNOWN_ERROR


# =============================================================================
# Helper Functions
# =============================================================================

def _mark_failed(
    db, 
    submission, 
    error_message: str,
    error_code: str = None
):
    """
    Mark submission as failed with user-friendly error info.
    
    Args:
        db: Database session
        submission: SpeakingSubmission instance
        error_message: Technical error message (for logs)
        error_code: Machine-readable error code
    """
    from app.models.speaking import SubmissionStatus
    
    # Determine error code if not provided
    if error_code is None:
        error_code = ErrorCodes.UNKNOWN_ERROR
    
    # Get user-friendly message
    user_message = ERROR_MESSAGES.get(error_code, ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR])
    
    # Check if retry is allowed
    can_retry = error_code in RETRYABLE_ERRORS
    max_retries = submission.max_retries if hasattr(submission, 'max_retries') else 3
    
    # Update submission
    submission.status = SubmissionStatus.FAILED
    submission.error_message = user_message
    submission.error_code = error_code
    submission.processed_at = datetime.utcnow()
    
    # Increment retry count if applicable
    if hasattr(submission, 'retry_count'):
        submission.retry_count = (submission.retry_count or 0) + 1
    
    db.commit()
    
    # Log technical details (not shown to user)
    logger.error(
        f"Submission {submission.id} failed. "
        f"Code: {error_code}, "
        f"Retry: {submission.retry_count}/{max_retries}, "
        f"Technical: {error_message[:200]}"
    )


def _is_first_completed_submission(db, user_id: str, scenario_id: str) -> bool:
    """Check if this is the user's first completed submission for a scenario."""
    from sqlalchemy import select, func
    from app.models.speaking import SpeakingSubmission, SubmissionStatus
    
    count = db.execute(
        select(func.count(SpeakingSubmission.id)).where(
            SpeakingSubmission.user_id == user_id,
            SpeakingSubmission.scenario_id == scenario_id,
            SpeakingSubmission.status == SubmissionStatus.COMPLETED
        )
    ).scalar() or 0
    
    return count == 0


def _update_user_progress(db, user_id: str, xp_earned: int):
    """Update user's progress after successful submission."""
    from datetime import date
    from sqlalchemy import select
    
    from app.models.user import User
    from app.models.progress import DailyProgress
    
    # Update user XP
    user = db.get(User, user_id)
    if user:
        user.total_xp = (user.total_xp or 0) + xp_earned
        user.last_practice_at = datetime.utcnow()
    
    # Update daily progress
    today = date.today()
    
    daily = db.execute(
        select(DailyProgress).where(
            DailyProgress.user_id == user_id,
            DailyProgress.date == today
        )
    ).scalar_one_or_none()
    
    if daily is None:
        daily = DailyProgress(
            user_id=user_id,
            date=today,
            speaking_completed=1,
            xp_earned=xp_earned
        )
        db.add(daily)
    else:
        # Handle NULL values that might exist in database
        daily.speaking_completed = (daily.speaking_completed or 0) + 1
        daily.xp_earned = (daily.xp_earned or 0) + xp_earned
        daily.updated_at = datetime.utcnow()
    
    db.commit()

