"""
Transcription Task

Celery task for transcribing audio files using Whisper.
"""

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="app.worker.tasks.transcription.transcribe_audio",
    max_retries=3,
    default_retry_delay=30,
    autoretry_for=(Exception,),
    retry_backoff=True,
)
def transcribe_audio(
    self,
    audio_url: str,
    submission_id: str,
    language: str = "en",
) -> dict:
    """
    Transcribe audio file from URL.
    
    Args:
        audio_url: URL to the audio file
        submission_id: Speaking submission ID (for tracking)
        language: Expected language (default: English)
        
    Returns:
        Dict with transcription result
    """
    import asyncio
    from app.services.transcription_service import transcription_service
    
    logger.info(f"Starting transcription for submission {submission_id}")
    
    try:
        # Run async transcription in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            result = loop.run_until_complete(
                transcription_service.transcribe_from_url(audio_url, language)
            )
        finally:
            loop.close()
        
        logger.info(
            f"Transcription complete for {submission_id}. "
            f"Text length: {len(result.text)}, Duration: {result.duration_seconds}s"
        )
        
        return {
            "submission_id": submission_id,
            "text": result.text,
            "language": result.language,
            "duration_seconds": result.duration_seconds,
            "confidence": result.confidence,
            "segments": result.segments,
            "success": True,
        }
        
    except Exception as e:
        logger.error(f"Transcription failed for {submission_id}: {e}")
        
        # Update submission status to failed
        _mark_submission_failed(submission_id, str(e))
        
        raise


def _mark_submission_failed(submission_id: str, error_message: str):
    """Mark a submission as failed in the database."""
    from app.db.session import SessionLocal
    from app.models.speaking import SpeakingSubmission, SubmissionStatus
    
    db = SessionLocal()
    try:
        submission = db.get(SpeakingSubmission, submission_id)
        if submission:
            submission.status = SubmissionStatus.FAILED
            submission.error_message = error_message[:500]  # Truncate if too long
            db.commit()
    finally:
        db.close()

