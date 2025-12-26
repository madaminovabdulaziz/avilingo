"""
Celery Tasks

Background tasks for:
- Audio transcription
- Speaking submission processing
- AI feedback generation
"""

from app.worker.tasks.transcription import transcribe_audio
from app.worker.tasks.speaking_processor import process_speaking_submission

__all__ = [
    "transcribe_audio",
    "process_speaking_submission",
]

