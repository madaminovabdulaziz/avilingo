"""
AviLingo Background Worker

Celery-based background task processing for:
- Audio transcription (Whisper)
- AI feedback generation
- Speaking submission processing
"""

from app.worker.celery_app import celery_app

__all__ = ["celery_app"]

