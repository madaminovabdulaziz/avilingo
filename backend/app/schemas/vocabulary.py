"""
Vocabulary Pydantic Schemas

Validation schemas for vocabulary-related API operations.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# VocabularyTerm Schemas
# =============================================================================

class VocabularyTermBase(BaseModel):
    """Base vocabulary term fields."""
    
    term: str = Field(..., min_length=1, max_length=100, description="The vocabulary term")
    phonetic: Optional[str] = Field(None, max_length=100, description="IPA phonetic notation")
    part_of_speech: Optional[str] = Field(None, max_length=50)
    definition: str = Field(..., min_length=1, description="Term definition")
    aviation_context: Optional[str] = Field(None, description="Aviation usage context")


class VocabularyTermCreate(VocabularyTermBase):
    """Schema for creating a vocabulary term (admin)."""
    
    example_atc: Optional[str] = None
    example_response: Optional[str] = None
    example_sentence: Optional[str] = None
    common_errors: Optional[List[str]] = None
    cis_pronunciation_tips: Optional[str] = None
    related_terms: Optional[List[str]] = None
    category: str = Field(..., description="Category: standard_phraseology, weather, navigation, etc.")
    difficulty: int = Field(default=1, ge=1, le=5, description="Difficulty level 1-5")
    icao_level_target: int = Field(default=4, ge=1, le=6)
    audio_url: Optional[str] = Field(None, max_length=500)


class VocabularyTermUpdate(BaseModel):
    """Schema for updating a vocabulary term (admin)."""
    
    term: Optional[str] = Field(None, min_length=1, max_length=100)
    phonetic: Optional[str] = Field(None, max_length=100)
    part_of_speech: Optional[str] = Field(None, max_length=50)
    definition: Optional[str] = None
    aviation_context: Optional[str] = None
    example_atc: Optional[str] = None
    example_response: Optional[str] = None
    example_sentence: Optional[str] = None
    common_errors: Optional[List[str]] = None
    cis_pronunciation_tips: Optional[str] = None
    related_terms: Optional[List[str]] = None
    category: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    icao_level_target: Optional[int] = Field(None, ge=1, le=6)
    audio_url: Optional[str] = Field(None, max_length=500)

    model_config = ConfigDict(extra='forbid')


class VocabularyTermResponse(BaseModel):
    """Full vocabulary term response."""
    
    id: str
    term: str
    phonetic: Optional[str] = None
    part_of_speech: Optional[str] = None
    definition: str
    aviation_context: Optional[str] = None
    example_atc: Optional[str] = None
    example_response: Optional[str] = None
    example_sentence: Optional[str] = None
    common_errors: Optional[List[str]] = None
    cis_pronunciation_tips: Optional[str] = None
    related_terms: Optional[List[str]] = None
    category: str
    difficulty: int
    icao_level_target: int
    audio_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VocabularyTermBrief(BaseModel):
    """Brief vocabulary term for list views."""
    
    id: str
    term: str
    phonetic: Optional[str] = None
    category: str
    difficulty: int

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# VocabularyProgress Schemas
# =============================================================================

class VocabularyProgressResponse(BaseModel):
    """Schema for vocabulary progress."""
    
    id: str
    term_id: str
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_at: datetime
    total_reviews: int
    correct_reviews: int
    last_quality: Optional[int] = None
    last_reviewed_at: Optional[datetime] = None
    mastery_percent: float  # Computed property
    is_due: bool  # Computed property

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Review Request/Response
# =============================================================================

class VocabularyReviewRequest(BaseModel):
    """
    Schema for submitting a vocabulary review.
    
    Quality rating follows SM-2 algorithm:
    - 0: Complete blackout, no recall
    - 1: Incorrect, but recognized when shown answer
    - 2: Incorrect, but easy to recall once reminded
    - 3: Correct with significant difficulty
    - 4: Correct with some hesitation
    - 5: Perfect, instant recall
    """
    
    quality: int = Field(
        ..., 
        ge=0, 
        le=5,
        description="Recall quality rating (0=forgot, 5=perfect)"
    )
    time_spent_seconds: Optional[int] = Field(
        None,
        ge=0,
        description="Time spent on this card in seconds"
    )


class VocabularyReviewResponse(BaseModel):
    """Response after submitting a review."""
    
    term_id: str
    new_ease_factor: float
    new_interval_days: int
    new_repetitions: int
    next_review_at: datetime
    mastery_percent: float
    xp_earned: int
    streak_maintained: bool


# =============================================================================
# Review Queue
# =============================================================================

class VocabularyReviewQueueItem(BaseModel):
    """Item in the review queue."""
    
    term: VocabularyTermResponse
    progress: Optional[VocabularyProgressResponse] = None
    is_new: bool = Field(default=False, description="True if never reviewed")
    priority: int = Field(default=0, description="Higher = more urgent")
    overdue_days: int = Field(default=0, description="Days overdue")


class VocabularyReviewQueue(BaseModel):
    """Review queue response."""
    
    items: List[VocabularyReviewQueueItem]
    total_due: int
    total_new: int


# =============================================================================
# List Response
# =============================================================================

class VocabularyListResponse(BaseModel):
    """Paginated vocabulary list response."""
    
    items: List[VocabularyTermBrief]
    total: int
    skip: int
    limit: int
    has_more: bool


# =============================================================================
# Category Stats
# =============================================================================

class VocabularyCategoryStats(BaseModel):
    """Statistics for a vocabulary category."""
    
    category: str
    total_terms: int
    learned_terms: int
    mastered_terms: int  # mastery >= 80%
    due_for_review: int
    average_mastery: float
