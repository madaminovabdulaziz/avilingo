"""
Celery Application Configuration

Sets up Celery for background task processing.
"""

from celery import Celery

from app.core.config import settings


# Create Celery application
celery_app = Celery(
    "avilingo_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.worker.tasks.transcription",
        "app.worker.tasks.speaking_processor",
    ]
)

# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge after task completes
    task_reject_on_worker_lost=True,  # Requeue if worker dies
    
    # Task routing
    task_routes={
        "app.worker.tasks.transcription.*": {"queue": "transcription"},
        "app.worker.tasks.speaking_processor.*": {"queue": "processing"},
    },
    
    # Task time limits
    task_soft_time_limit=300,  # 5 minutes soft limit
    task_time_limit=360,  # 6 minutes hard limit
    
    # Result settings
    result_expires=3600,  # Results expire after 1 hour
    
    # Worker settings
    worker_prefetch_multiplier=1,  # One task at a time for heavy GPU tasks
    worker_concurrency=2,  # 2 concurrent workers
    
    # Beat schedule (periodic tasks)
    beat_schedule={
        "cleanup-old-submissions": {
            "task": "app.worker.tasks.speaking_processor.cleanup_stale_submissions",
            "schedule": 3600.0,  # Every hour
        },
    },
)


# Task priority
celery_app.conf.task_default_priority = 5
celery_app.conf.task_queue_max_priority = 10

