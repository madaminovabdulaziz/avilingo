"""
Speaking Practice Service

Business logic for speaking practice including:
- Listing and filtering scenarios
- Audio upload handling
- Submission management
- XP calculation
"""

import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import select, func, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.speaking import SpeakingScenario, SpeakingSubmission, SubmissionStatus
from app.models.user import User
from app.models.progress import DailyProgress
from app.schemas.speaking import (
    SpeakingScenarioBrief,
    SpeakingScenarioResponse,
    SpeakingSubmissionBrief,
    SpeakingSubmissionResponse,
    SpeakingSubmissionStatus,
    SpeakingListResponse,
    ICAOScores,
    AIFeedback,
)


# Allowed audio formats
ALLOWED_AUDIO_FORMATS = {"webm", "m4a", "mp3", "wav", "mp4", "mpeg", "x-m4a", "ogg"}
ALLOWED_CONTENT_TYPES = {
    "audio/webm", "audio/m4a", "audio/x-m4a", "audio/mp3", 
    "audio/mpeg", "audio/wav", "audio/x-wav", "audio/mp4",
    "audio/ogg", "video/webm"  # Some browsers send video/webm for audio
}

# Max file size: 10MB
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# Max duration: 3 minutes
MAX_DURATION_SECONDS = 180


def calculate_speaking_xp(overall_score: float, difficulty: int, is_first_submission: bool) -> int:
    """
    Calculate XP earned for a speaking submission.
    
    Base XP by difficulty:
    - Difficulty 1: 15 XP
    - Difficulty 2: 25 XP  
    - Difficulty 3: 35 XP
    
    Multiplied by score factor, with bonus for first submission.
    """
    base_xp = {1: 15, 2: 25, 3: 35}.get(difficulty, 15)
    
    # Score multiplier (ICAO 1-6 scale mapped to 0-1)
    # Score 3 = 0.5x, Score 4 = 0.67x, Score 5 = 0.83x, Score 6 = 1.0x
    score_multiplier = max(0.2, (overall_score - 1) / 5)
    
    # First submission bonus
    first_bonus = 1.5 if is_first_submission else 1.0
    
    # High score bonus (5+)
    high_score_bonus = 1.25 if overall_score >= 5 else 1.0
    
    xp = int(base_xp * score_multiplier * first_bonus * high_score_bonus)
    
    return max(5, xp)  # Minimum 5 XP


class SpeakingService:
    """Service for speaking practice operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================================================
    # List Scenarios
    # =========================================================================
    
    def list_scenarios(
        self,
        user_id: Optional[str] = None,
        scenario_type: Optional[str] = None,
        category: Optional[str] = None,
        difficulty: Optional[int] = None,
        completed: Optional[bool] = None,
        skip: int = 0,
        limit: int = 20
    ) -> SpeakingListResponse:
        """
        List speaking scenarios with filters.
        
        Args:
            user_id: Optional user ID for completion status
            scenario_type: Filter by type (phraseology, picture_description, conversation)
            category: Filter by category
            difficulty: Filter by difficulty (1-3)
            completed: Filter by completion status (requires user_id)
            skip: Pagination offset
            limit: Maximum items to return
            
        Returns:
            Paginated list of scenarios
        """
        query = select(SpeakingScenario)
        
        # Apply filters
        conditions = []
        
        if scenario_type:
            conditions.append(SpeakingScenario.scenario_type == scenario_type)
        
        if category:
            conditions.append(SpeakingScenario.category == category)
        
        if difficulty is not None:
            conditions.append(SpeakingScenario.difficulty == difficulty)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        # Get total count
        count_query = select(func.count(SpeakingScenario.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total = self.db.execute(count_query).scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(
            SpeakingScenario.difficulty,
            SpeakingScenario.scenario_type,
            SpeakingScenario.title
        ).offset(skip).limit(limit)
        
        result = self.db.execute(query)
        scenarios = result.scalars().all()
        
        # Build response with user-specific data
        items = []
        for scenario in scenarios:
            # Get user's submissions for this scenario
            submission_count = 0
            best_score = None
            has_completed = False
            
            if user_id:
                submissions = self.db.execute(
                    select(SpeakingSubmission).where(
                        SpeakingSubmission.user_id == user_id,
                        SpeakingSubmission.scenario_id == scenario.id,
                        SpeakingSubmission.status == SubmissionStatus.COMPLETED
                    ).order_by(desc(SpeakingSubmission.overall_score))
                ).scalars().all()
                
                submission_count = len(submissions)
                if submissions:
                    has_completed = True
                    # Get best overall score
                    scores = [s.overall_score for s in submissions if s.overall_score]
                    if scores:
                        best_score = max(scores)
            
            # Filter by completed status if specified
            if completed is not None:
                if completed and not has_completed:
                    continue
                if not completed and has_completed:
                    continue
            
            items.append(SpeakingScenarioBrief(
                id=scenario.id,
                title=scenario.title,
                scenario_type=scenario.scenario_type,
                category=scenario.category,
                difficulty=scenario.difficulty,
                icao_level_target=scenario.icao_level_target,
                completed=has_completed,
                submission_count=submission_count,
                best_score=best_score
            ))
        
        return SpeakingListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
            has_more=(skip + len(items)) < total
        )
    
    # =========================================================================
    # Get Scenario
    # =========================================================================
    
    def get_scenario(
        self, 
        scenario_id: str, 
        user_id: Optional[str] = None
    ) -> Optional[SpeakingScenarioResponse]:
        """
        Get scenario details (without sample response until after submission).
        
        Args:
            scenario_id: Scenario ID
            user_id: Optional user ID for previous submissions
            
        Returns:
            Scenario details, or None if not found
        """
        scenario = self.db.get(SpeakingScenario, scenario_id)
        
        if not scenario:
            return None
        
        # Get previous submissions
        previous_submissions = []
        if user_id:
            submissions = self.db.execute(
                select(SpeakingSubmission).where(
                    SpeakingSubmission.user_id == user_id,
                    SpeakingSubmission.scenario_id == scenario_id
                ).order_by(desc(SpeakingSubmission.created_at)).limit(10)
            ).scalars().all()
            
            previous_submissions = [
                SpeakingSubmissionBrief(
                    id=s.id,
                    overall_score=s.overall_score,
                    status=s.status.value,
                    created_at=s.created_at
                )
                for s in submissions
            ]
        
        return SpeakingScenarioResponse(
            id=scenario.id,
            title=scenario.title,
            scenario_type=scenario.scenario_type,
            category=scenario.category,
            difficulty=scenario.difficulty,
            icao_level_target=scenario.icao_level_target,
            setup=scenario.setup,
            instructions=scenario.instructions,
            atc_prompt_text=scenario.atc_prompt_text,
            atc_prompt_audio_url=scenario.atc_prompt_audio_url,
            expected_elements=scenario.expected_elements,
            # sample_response NOT included - revealed after submission
            created_at=scenario.created_at,
            previous_submissions=previous_submissions
        )
    
    # =========================================================================
    # Create Submission
    # =========================================================================
    
    def create_submission(
        self,
        user_id: str,
        scenario_id: str,
        audio_url: str,
        audio_format: str,
        file_size_bytes: int,
        duration_seconds: int = 0
    ) -> Optional[SpeakingSubmission]:
        """
        Create a pending speaking submission.
        
        Args:
            user_id: User's ID
            scenario_id: Scenario ID
            audio_url: URL to uploaded audio
            audio_format: Audio format (webm, m4a, mp3, wav)
            file_size_bytes: File size in bytes
            duration_seconds: Audio duration
            
        Returns:
            Created submission, or None if scenario not found
        """
        # Verify scenario exists
        scenario = self.db.get(SpeakingScenario, scenario_id)
        if not scenario:
            return None
        
        # Create submission with pending status
        submission = SpeakingSubmission(
            user_id=user_id,
            scenario_id=scenario_id,
            audio_url=audio_url,
            audio_format=audio_format,
            file_size_bytes=file_size_bytes,
            duration_seconds=duration_seconds,
            status=SubmissionStatus.PENDING
        )
        
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        
        return submission
    
    # =========================================================================
    # Get Submission
    # =========================================================================
    
    def get_submission(
        self, 
        submission_id: str, 
        user_id: str
    ) -> Optional[SpeakingSubmissionResponse]:
        """
        Get submission with feedback (if completed).
        
        Args:
            submission_id: Submission ID
            user_id: User's ID (for authorization)
            
        Returns:
            Submission with feedback, or None if not found
        """
        submission = self.db.execute(
            select(SpeakingSubmission)
            .options(joinedload(SpeakingSubmission.scenario))
            .where(
                SpeakingSubmission.id == submission_id,
                SpeakingSubmission.user_id == user_id
            )
        ).unique().scalar_one_or_none()
        
        if not submission:
            return None
        
        # Build scores object if available
        scores = None
        if submission.status == SubmissionStatus.COMPLETED and all([
            submission.score_pronunciation,
            submission.score_structure,
            submission.score_vocabulary,
            submission.score_fluency,
            submission.score_comprehension,
            submission.score_interaction
        ]):
            scores = ICAOScores(
                pronunciation=submission.score_pronunciation,
                structure=submission.score_structure,
                vocabulary=submission.score_vocabulary,
                fluency=submission.score_fluency,
                comprehension=submission.score_comprehension,
                interaction=submission.score_interaction
            )
        
        # Build AI feedback if available
        ai_feedback = None
        if submission.ai_feedback:
            ai_feedback = AIFeedback(**submission.ai_feedback)
        
        return SpeakingSubmissionResponse(
            id=submission.id,
            scenario_id=submission.scenario_id,
            audio_url=submission.audio_url,
            duration_seconds=submission.duration_seconds,
            transcript=submission.transcript,
            scores=scores,
            overall_score=submission.overall_score,
            ai_feedback=ai_feedback,
            sample_response=submission.scenario.sample_response,  # Revealed after submission
            expected_elements=submission.scenario.expected_elements,
            common_cis_errors=submission.scenario.common_cis_errors,
            status=submission.status.value,
            error_message=submission.error_message,
            xp_earned=submission.xp_earned,
            created_at=submission.created_at,
            processed_at=submission.processed_at
        )
    
    # =========================================================================
    # Get Submission Status
    # =========================================================================
    
    def get_submission_status(
        self, 
        submission_id: str, 
        user_id: str
    ) -> Optional[SpeakingSubmissionStatus]:
        """
        Get lightweight submission status for polling.
        
        Args:
            submission_id: Submission ID
            user_id: User's ID (for authorization)
            
        Returns:
            Status object, or None if not found
        """
        submission = self.db.execute(
            select(SpeakingSubmission).where(
                SpeakingSubmission.id == submission_id,
                SpeakingSubmission.user_id == user_id
            )
        ).scalar_one_or_none()
        
        if not submission:
            return None
        
        # Estimate progress and time remaining
        progress_percent = 0
        estimated_seconds = None
        
        if submission.status == SubmissionStatus.PENDING:
            progress_percent = 0
            estimated_seconds = 30
        elif submission.status == SubmissionStatus.PROCESSING:
            progress_percent = 50
            estimated_seconds = 15
        elif submission.status == SubmissionStatus.COMPLETED:
            progress_percent = 100
            estimated_seconds = 0
        elif submission.status == SubmissionStatus.FAILED:
            progress_percent = 0
            estimated_seconds = None
        
        # Determine retry eligibility
        retry_count = submission.retry_count or 0
        max_retries = getattr(submission, 'max_retries', 3) or 3
        error_code = getattr(submission, 'error_code', None)
        
        # Define retryable error codes
        RETRYABLE_ERRORS = {
            "AUDIO_DOWNLOAD_FAILED",
            "TRANSCRIPTION_FAILED", 
            "AI_FEEDBACK_FAILED",
            "PROCESSING_TIMEOUT",
            "UNKNOWN_ERROR",
        }
        
        # User action suggestions
        USER_ACTIONS = {
            "AUDIO_NOT_FOUND": "Record a new response",
            "AUDIO_DOWNLOAD_FAILED": "Check connection and retry",
            "TRANSCRIPTION_FAILED": "Try recording again",
            "TRANSCRIPTION_EMPTY": "Record again, speak clearly",
            "AI_FEEDBACK_FAILED": "Wait and retry automatically",
            "SCENARIO_NOT_FOUND": "Choose another scenario",
            "PROCESSING_TIMEOUT": "Retry submission",
            "UNKNOWN_ERROR": "Contact support if issue persists",
        }
        
        can_retry = (
            submission.status == SubmissionStatus.FAILED
            and error_code in RETRYABLE_ERRORS
            and retry_count < max_retries
        )
        
        user_action = USER_ACTIONS.get(error_code) if error_code else None
        
        return SpeakingSubmissionStatus(
            id=submission.id,
            status=submission.status.value,
            progress_percent=progress_percent,
            estimated_seconds_remaining=estimated_seconds,
            error_message=submission.error_message,
            error_code=error_code,
            can_retry=can_retry,
            retry_count=retry_count,
            user_action=user_action
        )
    
    # =========================================================================
    # Process Submission (Placeholder for background job)
    # =========================================================================
    
    def process_submission(
        self,
        submission_id: str,
        transcript: str,
        scores: ICAOScores,
        ai_feedback: AIFeedback
    ) -> Optional[SpeakingSubmission]:
        """
        Process a submission with transcription and AI feedback.
        
        This would be called by a background job after Whisper transcription
        and AI analysis are complete.
        
        Args:
            submission_id: Submission ID
            transcript: Transcription text
            scores: ICAO criteria scores
            ai_feedback: AI-generated feedback
            
        Returns:
            Updated submission, or None if not found
        """
        submission = self.db.get(SpeakingSubmission, submission_id)
        if not submission:
            return None
        
        # Update submission with results
        submission.transcript = transcript
        submission.score_pronunciation = scores.pronunciation
        submission.score_structure = scores.structure
        submission.score_vocabulary = scores.vocabulary
        submission.score_fluency = scores.fluency
        submission.score_comprehension = scores.comprehension
        submission.score_interaction = scores.interaction
        submission.overall_score = scores.average()
        submission.ai_feedback = ai_feedback.model_dump()
        submission.status = SubmissionStatus.COMPLETED
        submission.processed_at = datetime.utcnow()
        
        # Calculate XP
        scenario = self.db.get(SpeakingScenario, submission.scenario_id)
        is_first = self._is_first_completed_submission(submission.user_id, submission.scenario_id)
        xp_earned = calculate_speaking_xp(scores.average(), scenario.difficulty, is_first)
        submission.xp_earned = xp_earned
        
        # Update daily progress
        self._update_daily_progress(submission.user_id, xp_earned)
        
        # Update user stats
        self._update_user_stats(submission.user_id, xp_earned)
        
        self.db.commit()
        self.db.refresh(submission)
        
        return submission
    
    def _is_first_completed_submission(self, user_id: str, scenario_id: str) -> bool:
        """Check if this is the user's first completed submission for a scenario."""
        count = self.db.execute(
            select(func.count(SpeakingSubmission.id)).where(
                SpeakingSubmission.user_id == user_id,
                SpeakingSubmission.scenario_id == scenario_id,
                SpeakingSubmission.status == SubmissionStatus.COMPLETED
            )
        ).scalar() or 0
        return count == 0
    
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
                speaking_completed=1,
                xp_earned=xp_earned
            )
            self.db.add(daily)
        else:
            # Handle NULL values that might exist in database
            daily.speaking_completed = (daily.speaking_completed or 0) + 1
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
    
    def get_user_stats(self, user_id: str) -> dict:
        """Get user's speaking practice statistics."""
        # Total scenarios
        total_scenarios = self.db.execute(
            select(func.count(SpeakingScenario.id))
        ).scalar() or 0
        
        # User's completed submissions
        submissions = self.db.execute(
            select(SpeakingSubmission).where(
                SpeakingSubmission.user_id == user_id,
                SpeakingSubmission.status == SubmissionStatus.COMPLETED
            )
        ).scalars().all()
        
        # Unique scenarios completed
        completed_scenario_ids = set(s.scenario_id for s in submissions)
        scenarios_completed = len(completed_scenario_ids)
        
        # Calculate averages
        if submissions:
            scores = [s.overall_score for s in submissions if s.overall_score]
            avg_score = sum(scores) / len(scores) if scores else 0
            total_duration = sum(s.duration_seconds for s in submissions)
            total_xp = sum(s.xp_earned for s in submissions)
        else:
            avg_score = 0
            total_duration = 0
            total_xp = 0
        
        # Average by ICAO criterion
        criterion_averages = {}
        for criterion in ['pronunciation', 'structure', 'vocabulary', 'fluency', 'comprehension', 'interaction']:
            values = [getattr(s, f'score_{criterion}') for s in submissions if getattr(s, f'score_{criterion}')]
            criterion_averages[criterion] = round(sum(values) / len(values), 2) if values else None
        
        return {
            "total_scenarios": total_scenarios,
            "scenarios_completed": scenarios_completed,
            "total_submissions": len(submissions),
            "average_score": round(avg_score, 2),
            "total_duration_seconds": total_duration,
            "total_xp_earned": total_xp,
            "progress_percent": round(scenarios_completed / total_scenarios * 100, 1) if total_scenarios > 0 else 0,
            "criterion_averages": criterion_averages
        }
    
    def get_available_filters(self) -> dict:
        """Get available filter options."""
        scenario_types = [
            r[0] for r in self.db.execute(
                select(SpeakingScenario.scenario_type).distinct()
            ).all()
        ]
        
        categories = [
            r[0] for r in self.db.execute(
                select(SpeakingScenario.category).distinct()
            ).all()
        ]
        
        difficulties = [
            r[0] for r in self.db.execute(
                select(SpeakingScenario.difficulty).distinct().order_by(SpeakingScenario.difficulty)
            ).all()
        ]
        
        return {
            "scenario_types": scenario_types,
            "categories": categories,
            "difficulties": difficulties
        }


# =============================================================================
# Audio Upload Utilities
# =============================================================================

def validate_audio_file(
    content_type: str,
    file_size: int,
    filename: str
) -> tuple[bool, str]:
    """
    Validate audio file before upload.
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check content type
    if content_type not in ALLOWED_CONTENT_TYPES:
        return False, f"Invalid audio format. Allowed: webm, m4a, mp3, wav. Got: {content_type}"
    
    # Check file size
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
    
    # Check extension
    if filename:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        if ext and ext not in ALLOWED_AUDIO_FORMATS:
            return False, f"Invalid file extension. Allowed: webm, m4a, mp3, wav"
    
    return True, ""


def get_content_type_for_extension(extension: str) -> str:
    """Get MIME type for audio file extension."""
    content_types = {
        'webm': 'audio/webm',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'm4a': 'audio/m4a',
        'mp4': 'audio/mp4',
        'ogg': 'audio/ogg',
    }
    return content_types.get(extension.lower(), 'audio/webm')


async def save_audio_file(
    file_content: bytes,
    user_id: str,
    submission_id: str,
    file_extension: str
) -> tuple[bool, str, str]:
    """
    Save audio file to cloud storage (S3/MinIO).
    
    Args:
        file_content: Raw audio bytes
        user_id: User's ID
        submission_id: Speaking submission ID
        file_extension: File extension (webm, mp3, wav, m4a)
    
    Returns:
        Tuple of (success, url, error_message)
    """
    from app.services.storage_service import storage_service
    
    content_type = get_content_type_for_extension(file_extension)
    
    return await storage_service.upload_audio(
        file_content=file_content,
        user_id=user_id,
        submission_id=submission_id,
        file_extension=file_extension,
        content_type=content_type
    )


def get_presigned_upload_url(
    user_id: str,
    submission_id: str,
    file_extension: str = "webm"
) -> tuple[str, str, dict]:
    """
    Get a pre-signed URL for direct client upload to S3.
    
    This allows the frontend to upload directly to S3 without
    going through the backend, reducing latency and server load.
    
    Args:
        user_id: User's ID
        submission_id: Submission ID
        file_extension: Expected file extension
        
    Returns:
        Tuple of (upload_url, object_key, form_fields)
    """
    from app.services.storage_service import storage_service
    
    return storage_service.generate_upload_url(
        user_id=user_id,
        submission_id=submission_id,
        file_extension=file_extension,
        content_type=get_content_type_for_extension(file_extension)
    )

