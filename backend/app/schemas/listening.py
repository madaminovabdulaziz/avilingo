"""
Listening Pydantic Schemas

Validation schemas for listening exercise API operations.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict


# =============================================================================
# ListeningExercise Schemas
# =============================================================================

class ListeningExerciseBase(BaseModel):
    """Base listening exercise fields."""
    
    title: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., description="clearance_delivery, ground, tower, etc.")
    scenario_type: str = Field(..., description="routine, non_routine, emergency")
    accent: str = Field(..., description="American, British, Indian, etc.")
    speed: str = Field(..., description="slow, normal, fast")
    difficulty: int = Field(default=1, ge=1, le=3)


class ListeningExerciseCreate(ListeningExerciseBase):
    """Schema for creating a listening exercise (admin)."""
    
    audio_url: Optional[str] = Field(None, max_length=500)
    transcript: str = Field(..., min_length=1)
    duration_seconds: int = Field(default=0, ge=0)
    icao_level_target: int = Field(default=4, ge=1, le=6)
    teaching_points: Optional[List[str]] = None
    model_readback: Optional[str] = None
    audio_generation_notes: Optional[str] = None


class ListeningExerciseUpdate(BaseModel):
    """Schema for updating a listening exercise (admin)."""
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    audio_url: Optional[str] = Field(None, max_length=500)
    transcript: Optional[str] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    category: Optional[str] = None
    scenario_type: Optional[str] = None
    accent: Optional[str] = None
    speed: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=3)
    icao_level_target: Optional[int] = Field(None, ge=1, le=6)
    teaching_points: Optional[List[str]] = None
    model_readback: Optional[str] = None

    model_config = ConfigDict(extra='forbid')


class ListeningExerciseBrief(BaseModel):
    """Brief exercise for list views (no transcript)."""
    
    id: str
    title: str
    category: str
    scenario_type: str
    accent: str
    speed: str
    difficulty: int
    icao_level_target: int
    duration_seconds: int
    audio_url: Optional[str] = None
    question_count: int = 0
    # User-specific fields (added by API)
    completed: bool = False
    attempt_count: int = 0
    best_score: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class ListeningExerciseResponse(BaseModel):
    """
    Full exercise detail for taking the exercise.
    Note: transcript is NOT included until after submission.
    """
    
    id: str
    title: str
    audio_url: Optional[str] = None
    duration_seconds: int
    category: str
    scenario_type: str
    accent: str
    speed: str
    difficulty: int
    icao_level_target: int
    questions: List["ListeningQuestionResponse"]
    created_at: datetime
    # User-specific
    previous_attempts: List["ListeningAttemptBrief"] = []

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ListeningQuestion Schemas
# =============================================================================

class ListeningQuestionBase(BaseModel):
    """Base question fields."""
    
    question_type: str = Field(..., description="multiple_choice, fill_blank, true_false")
    question_text: str = Field(..., min_length=1)
    order: int = Field(default=0, ge=0)


class ListeningQuestionCreate(ListeningQuestionBase):
    """Schema for creating a question (admin)."""
    
    exercise_id: str
    options: Optional[List[str]] = Field(None, description="Options for multiple choice")
    correct_answer: str = Field(..., min_length=1)
    explanation: Optional[str] = None
    
    @field_validator('options')
    @classmethod
    def validate_options(cls, v, info):
        """Validate options for multiple choice questions."""
        if info.data.get('question_type') == 'multiple_choice':
            if not v or len(v) < 2:
                raise ValueError('Multiple choice questions must have at least 2 options')
        return v


class ListeningQuestionResponse(BaseModel):
    """Question response (without correct answer until submitted)."""
    
    id: str
    question_type: str
    question_text: str
    options: Optional[List[str]] = None
    order: int

    model_config = ConfigDict(from_attributes=True)


class ListeningQuestionWithAnswer(ListeningQuestionResponse):
    """Question with correct answer (shown after submission)."""
    
    correct_answer: str
    explanation: Optional[str] = None


# =============================================================================
# Submit Request/Response
# =============================================================================

class ListeningSubmitRequest(BaseModel):
    """
    Schema for submitting listening exercise answers.
    
    answers: Dictionary mapping question_id to user's answer
    """
    
    answers: Dict[str, str] = Field(
        ..., 
        min_length=1,
        description="Map of question_id to user answer"
    )
    time_spent_seconds: int = Field(
        default=0, 
        ge=0,
        description="Total time spent on exercise"
    )
    audio_plays: int = Field(
        default=1,
        ge=1,
        description="Number of times audio was played"
    )
    
    @field_validator('answers')
    @classmethod
    def validate_answers(cls, v):
        """Validate answers dictionary."""
        if not v:
            raise ValueError('At least one answer is required')
        # Validate all values are non-empty strings
        for question_id, answer in v.items():
            if not isinstance(answer, str):
                raise ValueError(f'Answer for {question_id} must be a string')
        return v


class ListeningQuestionResult(BaseModel):
    """Result for a single question."""
    
    question_id: str
    question_text: str
    question_type: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None


class ListeningSubmitResponse(BaseModel):
    """Response after submitting answers."""
    
    attempt_id: str
    exercise_id: str
    score_percent: float = Field(..., ge=0, le=100)
    correct_count: int
    total_questions: int
    results: List[ListeningQuestionResult]
    transcript: str  # Revealed after submission
    teaching_points: Optional[List[str]] = None
    model_readback: Optional[str] = None
    xp_earned: int
    time_spent_seconds: int
    completed_at: datetime


# =============================================================================
# ListeningAttempt Schemas
# =============================================================================

class ListeningAttemptBrief(BaseModel):
    """Brief attempt info."""
    
    id: str
    score_percent: float
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ListeningAttemptResponse(BaseModel):
    """Full attempt details."""
    
    id: str
    user_id: str
    exercise_id: str
    score_percent: float
    correct_count: int
    total_questions: int
    answers: Optional[Dict[str, str]] = None
    time_spent_seconds: int
    audio_plays: int
    completed: bool
    xp_earned: int
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# List Response
# =============================================================================

class ListeningListResponse(BaseModel):
    """Paginated listening exercises list."""
    
    items: List[ListeningExerciseBrief]
    total: int
    skip: int
    limit: int
    has_more: bool


# =============================================================================
# Filter Options
# =============================================================================

class ListeningFilters(BaseModel):
    """Available filter options for listing."""
    
    categories: List[str]
    accents: List[str]
    speeds: List[str]
    difficulties: List[int]


# Rebuild models with forward references
ListeningExerciseResponse.model_rebuild()
