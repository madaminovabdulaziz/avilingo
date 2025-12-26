"""
Speaking Pydantic Schemas

Validation schemas for speaking practice API operations.
"""

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, field_validator, ConfigDict


# =============================================================================
# SpeakingScenario Schemas
# =============================================================================

class SpeakingScenarioBase(BaseModel):
    """Base scenario fields."""
    
    title: str = Field(..., min_length=1, max_length=200)
    scenario_type: str = Field(..., description="phraseology, picture_description, conversation")
    category: str = Field(..., description="Category: phraseology, emergency, etc.")
    difficulty: int = Field(default=1, ge=1, le=3)


class SpeakingScenarioCreate(SpeakingScenarioBase):
    """Schema for creating a speaking scenario (admin)."""
    
    setup: str = Field(..., min_length=1, description="Context/situation description")
    instructions: Optional[str] = None
    atc_prompt_text: str = Field(..., min_length=1, description="What ATC says")
    atc_prompt_audio_url: Optional[str] = Field(None, max_length=500)
    expected_elements: Optional[List[str]] = None
    sample_response: str = Field(..., min_length=1)
    scoring_rubric: Optional[Dict[str, str]] = None
    common_cis_errors: Optional[List[str]] = None
    icao_level_target: int = Field(default=4, ge=1, le=6)


class SpeakingScenarioUpdate(BaseModel):
    """Schema for updating a speaking scenario (admin)."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    scenario_type: Optional[str] = None
    category: Optional[str] = None
    setup: Optional[str] = None
    instructions: Optional[str] = None
    atc_prompt_text: Optional[str] = None
    atc_prompt_audio_url: Optional[str] = Field(None, max_length=500)
    expected_elements: Optional[List[str]] = None
    sample_response: Optional[str] = None
    scoring_rubric: Optional[Dict[str, str]] = None
    common_cis_errors: Optional[List[str]] = None
    difficulty: Optional[int] = Field(None, ge=1, le=3)
    icao_level_target: Optional[int] = Field(None, ge=1, le=6)

    model_config = ConfigDict(extra='forbid')


class SpeakingScenarioBrief(BaseModel):
    """Brief scenario for list views."""
    
    id: str
    title: str
    scenario_type: str
    category: str
    difficulty: int
    icao_level_target: int
    # User-specific fields
    completed: bool = False
    submission_count: int = 0
    best_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class SpeakingScenarioResponse(BaseModel):
    """
    Full scenario detail for practice.
    Note: sample_response is NOT shown until after submission.
    """
    
    id: str
    title: str
    scenario_type: str
    category: str
    difficulty: int
    icao_level_target: int
    setup: str
    instructions: Optional[str] = None
    atc_prompt_text: str
    atc_prompt_audio_url: Optional[str] = None
    expected_elements: Optional[List[str]] = None
    # sample_response not included - revealed after submission
    created_at: datetime
    # User-specific
    previous_submissions: List["SpeakingSubmissionBrief"] = []

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ICAO Scores
# =============================================================================

class ICAOScores(BaseModel):
    """ICAO criteria scores (1-6 scale)."""
    
    pronunciation: float = Field(..., ge=1, le=6, description="Pronunciation score")
    structure: float = Field(..., ge=1, le=6, description="Grammatical structure score")
    vocabulary: float = Field(..., ge=1, le=6, description="Vocabulary range/accuracy score")
    fluency: float = Field(..., ge=1, le=6, description="Fluency score")
    comprehension: float = Field(..., ge=1, le=6, description="Comprehension score")
    interaction: float = Field(..., ge=1, le=6, description="Interaction score")
    
    def average(self) -> float:
        """Calculate average score."""
        return round(sum([
            self.pronunciation, self.structure, self.vocabulary,
            self.fluency, self.comprehension, self.interaction
        ]) / 6, 2)
    
    def minimum(self) -> float:
        """Get minimum score (ICAO level is limited by lowest criterion)."""
        return min(
            self.pronunciation, self.structure, self.vocabulary,
            self.fluency, self.comprehension, self.interaction
        )


# =============================================================================
# AI Feedback
# =============================================================================

class AIFeedback(BaseModel):
    """AI-generated feedback structure."""
    
    strengths: List[str] = Field(default_factory=list, description="What was done well")
    improvements: List[str] = Field(default_factory=list, description="Areas to improve")
    overall: str = Field(..., description="Overall assessment")
    specific_corrections: Optional[List[Dict[str, str]]] = Field(
        None,
        description="Specific corrections: [{said, should_be, explanation}]"
    )


# =============================================================================
# Submit Request
# =============================================================================

class SpeakingSubmitRequest(BaseModel):
    """
    Schema for speaking submission.
    
    Note: Audio file is sent as multipart form data, not in this schema.
    This schema is for any additional metadata.
    """
    
    duration_seconds: int = Field(
        default=0,
        ge=0,
        le=180,  # Max 3 minutes
        description="Recording duration in seconds"
    )


class SpeakingSubmitMetadata(BaseModel):
    """Metadata about the audio upload."""
    
    filename: str
    content_type: str = Field(..., pattern=r'^audio/(webm|mp4|mpeg|wav|m4a|x-m4a)$')
    file_size_bytes: int = Field(..., gt=0, le=10_485_760)  # Max 10MB
    duration_seconds: int = Field(default=0, ge=0, le=180)


# =============================================================================
# Submission Schemas
# =============================================================================

class SpeakingSubmissionBrief(BaseModel):
    """Brief submission info."""
    
    id: str
    overall_score: Optional[float] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SpeakingSubmissionResponse(BaseModel):
    """Full submission with feedback."""
    
    id: str
    scenario_id: str
    audio_url: Optional[str] = None
    duration_seconds: int
    
    # Transcription
    transcript: Optional[str] = None
    
    # Scores
    scores: Optional[ICAOScores] = None
    overall_score: Optional[float] = None
    
    # Feedback
    ai_feedback: Optional[AIFeedback] = None
    
    # Sample response (revealed after submission)
    sample_response: str
    expected_elements: Optional[List[str]] = None
    common_cis_errors: Optional[List[str]] = None
    
    # Status
    status: str
    error_message: Optional[str] = None
    
    # XP
    xp_earned: int = 0
    
    # Timestamps
    created_at: datetime
    processed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SpeakingSubmissionStatus(BaseModel):
    """Lightweight status for polling."""
    
    id: str
    status: str
    progress_percent: int = Field(default=0, ge=0, le=100)
    estimated_seconds_remaining: Optional[int] = None
    error_message: Optional[str] = None
    error_code: Optional[str] = Field(
        default=None,
        description="Machine-readable error code for frontend handling"
    )
    can_retry: bool = Field(
        default=False,
        description="Whether this submission can be retried"
    )
    retry_count: int = Field(
        default=0,
        description="Number of times this submission has been retried"
    )
    user_action: Optional[str] = Field(
        default=None,
        description="Suggested user action when failed"
    )


# =============================================================================
# List Response
# =============================================================================

class SpeakingListResponse(BaseModel):
    """Paginated speaking scenarios list."""
    
    items: List[SpeakingScenarioBrief]
    total: int
    skip: int
    limit: int
    has_more: bool


class SpeakingSubmissionListResponse(BaseModel):
    """Paginated submissions list."""
    
    items: List[SpeakingSubmissionBrief]
    total: int
    skip: int
    limit: int


# Rebuild models with forward references
SpeakingScenarioResponse.model_rebuild()
