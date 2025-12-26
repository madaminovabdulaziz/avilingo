"""
Speaking API Routes

Endpoints:
- GET /speaking/scenarios - List speaking scenarios with filters
- GET /speaking/scenarios/filters - Get available filter options
- GET /speaking/stats - Get user's speaking statistics
- GET /speaking/scenarios/{id} - Get scenario details
- POST /speaking/scenarios/{id}/submit - Upload audio recording
- GET /speaking/submissions/{id} - Get submission with feedback
- GET /speaking/submissions/{id}/status - Check processing status
- GET /speaking/submissions - List user's submissions
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from typing import Optional
import logging

from app.db.session import get_db
from app.models.user import User
from app.models.speaking import SpeakingSubmission, SubmissionStatus
from app.api.dependencies import get_current_user, get_optional_user
from app.services.speaking_service import (
    SpeakingService,
    validate_audio_file,
    save_audio_file,
    get_presigned_upload_url,
    MAX_FILE_SIZE,
    MAX_DURATION_SECONDS,
)
from app.schemas.speaking import (
    SpeakingListResponse,
    SpeakingScenarioResponse,
    SpeakingSubmissionResponse,
    SpeakingSubmissionStatus,
    SpeakingSubmissionBrief,
)

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# List Scenarios
# =============================================================================

@router.get(
    "/scenarios",
    response_model=SpeakingListResponse,
    summary="List speaking scenarios",
    description="Get paginated list of speaking scenarios with optional filters."
)
async def list_speaking_scenarios(
    scenario_type: Optional[str] = Query(
        None, 
        description="Filter by type: phraseology, picture_description, conversation"
    ),
    category: Optional[str] = Query(
        None, 
        description="Filter by category"
    ),
    difficulty: Optional[int] = Query(
        None, 
        ge=1, 
        le=3,
        description="Filter by difficulty (1=easy, 2=medium, 3=hard)"
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
    List speaking scenarios with filters.
    
    **Scenario Types:**
    - phraseology: Standard ATC readbacks and calls
    - picture_description: Describe aviation situations
    - conversation: Interactive ATC conversations
    
    If authenticated, includes user's completion status and best scores.
    """
    service = SpeakingService(db)
    
    user_id = user.id if user else None
    
    return service.list_scenarios(
        user_id=user_id,
        scenario_type=scenario_type,
        category=category,
        difficulty=difficulty,
        completed=completed,
        skip=skip,
        limit=limit
    )


# =============================================================================
# Get Filter Options
# =============================================================================

@router.get(
    "/scenarios/filters",
    summary="Get filter options",
    description="Get available options for filtering speaking scenarios."
)
async def get_speaking_filters(
    db: Session = Depends(get_db)
):
    """
    Get available filter options for speaking scenarios.
    
    Returns lists of scenario types, categories, and difficulty levels.
    """
    service = SpeakingService(db)
    return service.get_available_filters()


# =============================================================================
# Pre-signed Upload URL
# =============================================================================

@router.post(
    "/upload-url",
    summary="Get pre-signed upload URL",
    description="Get a pre-signed URL for direct audio upload to cloud storage."
)
async def get_upload_url(
    scenario_id: str = Query(..., description="Scenario ID for the submission"),
    file_extension: str = Query("webm", description="Audio file extension (webm, mp3, wav, m4a)"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a pre-signed URL for direct client upload to S3/MinIO.
    
    **Benefits:**
    - Faster uploads (direct to storage, no proxy through backend)
    - Reduced server load
    - Support for larger files
    
    **Usage:**
    1. Call this endpoint to get upload URL and form fields
    2. Upload file directly to the returned URL using multipart/form-data
    3. Call POST /scenarios/{id}/confirm-upload with the object_key
    
    **Returns:**
    - upload_url: URL to POST the file to
    - object_key: S3 key for the file (needed for confirmation)
    - fields: Form fields to include in the upload
    - submission_id: Pre-generated submission ID
    """
    # Verify scenario exists
    service = SpeakingService(db)
    scenario = service.get_scenario(scenario_id)
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Speaking scenario not found"
        )
    
    # Validate file extension
    allowed_extensions = {"webm", "mp3", "wav", "m4a", "mp4", "ogg"}
    if file_extension.lower() not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Generate submission ID upfront
    submission_id = str(uuid.uuid4())
    
    try:
        upload_url, object_key, fields = get_presigned_upload_url(
            user_id=user.id,
            submission_id=submission_id,
            file_extension=file_extension.lower()
        )
        
        return {
            "upload_url": upload_url,
            "object_key": object_key,
            "fields": fields,
            "submission_id": submission_id,
            "scenario_id": scenario_id,
            "expires_in_seconds": 3600,
            "max_file_size_bytes": MAX_FILE_SIZE,
            "instructions": {
                "method": "POST",
                "content_type": "multipart/form-data",
                "steps": [
                    "Include all 'fields' as form fields",
                    "Add file as 'file' field (must be last)",
                    "POST to upload_url",
                    "On success, call POST /scenarios/{id}/confirm-upload"
                ]
            }
        }
    except Exception as e:
        logger.error(f"Failed to generate upload URL: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )


@router.post(
    "/scenarios/{scenario_id}/confirm-upload",
    summary="Confirm direct upload",
    description="Confirm a file was uploaded directly to S3 and create submission."
)
async def confirm_direct_upload(
    scenario_id: str,
    submission_id: str = Query(..., description="Pre-generated submission ID"),
    object_key: str = Query(..., description="S3 object key from upload-url response"),
    duration_seconds: int = Query(0, ge=0, le=MAX_DURATION_SECONDS),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm a direct upload and create the submission record.
    
    Call this after successfully uploading to the pre-signed URL.
    
    **Required parameters:**
    - submission_id: The ID returned from /upload-url
    - object_key: The S3 key returned from /upload-url
    - duration_seconds: Audio duration in seconds
    """
    from app.services.storage_service import storage_service
    
    # Verify scenario exists
    service = SpeakingService(db)
    scenario_obj = service.get_scenario(scenario_id)
    
    if not scenario_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Speaking scenario not found"
        )
    
    # Verify file exists in S3
    if not storage_service.file_exists(object_key):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Upload not found. Please upload the file first."
        )
    
    # Get file info
    file_info = storage_service.get_file_info(object_key)
    file_size = file_info['size'] if file_info else 0
    
    # Extract file extension from key
    file_extension = object_key.rsplit('.', 1)[-1] if '.' in object_key else 'webm'
    
    # Generate audio URL
    audio_url = storage_service._get_public_url(object_key)
    
    # Create submission
    from app.models.speaking import SpeakingSubmission, SubmissionStatus
    
    submission = SpeakingSubmission(
        id=submission_id,
        user_id=user.id,
        scenario_id=scenario_id,
        audio_url=audio_url,
        audio_format=file_extension,
        file_size_bytes=file_size,
        duration_seconds=duration_seconds,
        status=SubmissionStatus.PENDING
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    logger.info(
        f"Direct upload confirmed. User: {user.id}, Scenario: {scenario_id}, "
        f"Submission: {submission_id}"
    )
    
    # Trigger background processing
    try:
        from app.worker.tasks.speaking_processor import trigger_processing
        trigger_processing.delay(str(submission.id))
        logger.info(f"Background processing queued for submission {submission.id}")
    except Exception as e:
        logger.warning(f"Failed to queue background processing: {e}. Will be picked up by cleanup task.")
    
    return {
        "submission_id": submission.id,
        "scenario_id": scenario_id,
        "status": submission.status.value,
        "audio_url": audio_url,
        "file_size_bytes": file_size,
        "duration_seconds": duration_seconds,
        "message": "Upload confirmed. Processing will begin shortly.",
        "next_step": f"Poll GET /api/v1/speaking/submissions/{submission.id}/status to check progress"
    }


# =============================================================================
# User Statistics
# =============================================================================

@router.get(
    "/stats",
    summary="Get speaking statistics",
    description="Get user's speaking practice statistics."
)
async def get_speaking_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's speaking practice statistics.
    
    Returns:
    - Total scenarios available
    - Scenarios completed
    - Total submissions
    - Average ICAO score
    - Scores by criterion
    - Total XP earned
    """
    service = SpeakingService(db)
    return service.get_user_stats(user.id)


# =============================================================================
# Get Single Scenario
# =============================================================================

@router.get(
    "/scenarios/{scenario_id}",
    response_model=SpeakingScenarioResponse,
    summary="Get scenario details",
    description="Get speaking scenario details with user's previous submissions."
)
async def get_speaking_scenario(
    scenario_id: str,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get a speaking scenario with details.
    
    **Includes:**
    - Context/setup
    - ATC prompt (text and audio URL)
    - Expected response elements
    - User's previous submissions (if authenticated)
    
    **Does NOT include:**
    - Sample response (revealed only after submission)
    """
    service = SpeakingService(db)
    
    user_id = user.id if user else None
    scenario = service.get_scenario(scenario_id, user_id)
    
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Speaking scenario not found"
        )
    
    return scenario


# =============================================================================
# Submit Audio Recording
# =============================================================================

@router.post(
    "/scenarios/{scenario_id}/submit",
    summary="Upload audio recording",
    description="Submit an audio recording for a speaking scenario."
)
async def submit_speaking_recording(
    scenario_id: str,
    audio: UploadFile = File(..., description="Audio recording (webm, m4a, mp3, wav)"),
    duration_seconds: int = Form(default=0, ge=0, le=MAX_DURATION_SECONDS),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload audio recording for a speaking scenario.
    
    **Audio Requirements:**
    - Formats: webm, m4a, mp3, wav
    - Maximum duration: 3 minutes
    - Maximum file size: 10MB
    
    **Processing:**
    - Creates a submission with status 'pending'
    - Audio is stored in cloud storage
    - Transcription and AI feedback are processed asynchronously
    - Poll /submissions/{id}/status to check progress
    
    **Returns:**
    - Submission ID
    - Status (pending)
    - Message about async processing
    """
    # Validate audio file
    is_valid, error_msg = validate_audio_file(
        content_type=audio.content_type or "",
        file_size=audio.size or 0,
        filename=audio.filename or ""
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Check file size by reading content
    content = await audio.read()
    file_size = len(content)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Get file extension
    filename = audio.filename or "audio.webm"
    file_extension = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'webm'
    
    # Generate submission ID
    submission_id = str(uuid.uuid4())
    
    # Save audio file to cloud storage (S3/MinIO)
    try:
        success, audio_url, error_msg = await save_audio_file(
            file_content=content,
            user_id=user.id,
            submission_id=submission_id,
            file_extension=file_extension
        )
        
        if not success:
            logger.error(f"Failed to save audio file: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save audio file: {error_msg}"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save audio file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save audio file"
        )
    
    # Create submission
    service = SpeakingService(db)
    
    submission = service.create_submission(
        user_id=user.id,
        scenario_id=scenario_id,
        audio_url=audio_url,
        audio_format=file_extension,
        file_size_bytes=file_size,
        duration_seconds=duration_seconds
    )
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Speaking scenario not found"
        )
    
    logger.info(
        f"User {user.id} submitted audio for scenario {scenario_id}. "
        f"Submission ID: {submission.id}, Size: {file_size} bytes"
    )
    
    # Trigger background processing
    try:
        from app.worker.tasks.speaking_processor import trigger_processing
        trigger_processing.delay(str(submission.id))
        logger.info(f"Background processing queued for submission {submission.id}")
    except Exception as e:
        logger.warning(f"Failed to queue background processing: {e}. Will be picked up by cleanup task.")
    
    return {
        "submission_id": submission.id,
        "scenario_id": scenario_id,
        "status": submission.status.value,
        "audio_url": audio_url,
        "file_size_bytes": file_size,
        "duration_seconds": duration_seconds,
        "message": "Audio uploaded successfully. Processing will begin shortly.",
        "next_step": f"Poll GET /api/v1/speaking/submissions/{submission.id}/status to check progress"
    }


# =============================================================================
# Get Submission with Feedback
# =============================================================================

@router.get(
    "/submissions/{submission_id}",
    response_model=SpeakingSubmissionResponse,
    summary="Get submission with feedback",
    description="Get a speaking submission with transcript and AI feedback."
)
async def get_speaking_submission(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a speaking submission with feedback.
    
    If processing is complete, includes:
    - Transcript
    - 6 ICAO criteria scores (pronunciation, structure, vocabulary, fluency, comprehension, interaction)
    - AI feedback with strengths, improvements, and specific corrections
    - Sample response (revealed after submission)
    - XP earned
    
    If still processing, returns current status.
    """
    service = SpeakingService(db)
    
    submission = service.get_submission(submission_id, user.id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    return submission


# =============================================================================
# Check Submission Status
# =============================================================================

@router.get(
    "/submissions/{submission_id}/status",
    response_model=SpeakingSubmissionStatus,
    summary="Check processing status",
    description="Lightweight status check for polling."
)
async def get_submission_status(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Check processing status of a submission.
    
    Lightweight endpoint for polling.
    
    **Statuses:**
    - pending: Uploaded, waiting to be processed
    - processing: Currently being transcribed/analyzed
    - completed: Processing complete, feedback available
    - failed: Processing failed (check error_message)
    
    **Polling recommendation:**
    - Poll every 2-3 seconds
    - Stop when status is 'completed' or 'failed'
    """
    service = SpeakingService(db)
    
    status_obj = service.get_submission_status(submission_id, user.id)
    
    if not status_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    return status_obj


# =============================================================================
# List User's Submissions
# =============================================================================

@router.get(
    "/submissions",
    summary="List user's submissions",
    description="Get list of user's speaking submissions."
)
async def list_user_submissions(
    scenario_id: Optional[str] = Query(None, description="Filter by scenario"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's speaking submissions.
    
    Returns submissions sorted by creation date (newest first).
    """
    query = select(SpeakingSubmission).where(
        SpeakingSubmission.user_id == user.id
    )
    
    if scenario_id:
        query = query.where(SpeakingSubmission.scenario_id == scenario_id)
    
    if status_filter:
        try:
            status_enum = SubmissionStatus(status_filter)
            query = query.where(SpeakingSubmission.status == status_enum)
        except ValueError:
            pass  # Ignore invalid status filter
    
    # Get total count
    from sqlalchemy import func
    count_query = select(func.count(SpeakingSubmission.id)).where(
        SpeakingSubmission.user_id == user.id
    )
    if scenario_id:
        count_query = count_query.where(SpeakingSubmission.scenario_id == scenario_id)
    if status_filter:
        try:
            status_enum = SubmissionStatus(status_filter)
            count_query = count_query.where(SpeakingSubmission.status == status_enum)
        except ValueError:
            pass
    total = db.execute(count_query).scalar() or 0
    
    # Get submissions
    query = query.order_by(desc(SpeakingSubmission.created_at)).offset(skip).limit(limit)
    submissions = db.execute(query).scalars().all()
    
    return {
        "items": [
            SpeakingSubmissionBrief(
                id=s.id,
                overall_score=s.overall_score,
                status=s.status.value,
                created_at=s.created_at
            )
            for s in submissions
        ],
        "total": total,
        "skip": skip,
        "limit": limit
    }


# =============================================================================
# Retry Failed Submission
# =============================================================================

@router.post(
    "/submissions/{submission_id}/retry",
    summary="Retry failed submission",
    description="Retry processing for a failed submission."
)
async def retry_submission(
    submission_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retry processing for a failed submission.
    
    Only works for submissions with status 'failed'.
    Maximum 3 retries allowed.
    """
    submission = db.execute(
        select(SpeakingSubmission).where(
            SpeakingSubmission.id == submission_id,
            SpeakingSubmission.user_id == user.id
        )
    ).scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.status != SubmissionStatus.FAILED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot retry submission with status '{submission.status.value}'"
        )
    
    if submission.retry_count >= 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum retry attempts reached"
        )
    
    # Reset status and increment retry count
    submission.status = SubmissionStatus.PENDING
    submission.error_message = None
    submission.retry_count += 1
    
    db.commit()
    
    logger.info(f"Retry requested for submission {submission_id}. Attempt {submission.retry_count}")
    
    return {
        "submission_id": submission.id,
        "status": submission.status.value,
        "retry_count": submission.retry_count,
        "message": "Submission queued for reprocessing"
    }
