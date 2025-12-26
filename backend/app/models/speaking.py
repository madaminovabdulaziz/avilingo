"""
Speaking Models

- SpeakingScenario: Speaking practice scenarios
- SpeakingSubmission: User's audio submissions with AI feedback
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Integer, Float, Text, ForeignKey, Enum as SQLEnum, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
import enum

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class SubmissionStatus(str, enum.Enum):
    """Status of a speaking submission."""
    PENDING = "pending"        # Uploaded, waiting for processing
    PROCESSING = "processing"  # Currently being transcribed/analyzed
    COMPLETED = "completed"    # Processing complete, feedback available
    FAILED = "failed"          # Processing failed


class ScenarioType(str, enum.Enum):
    """Types of speaking scenarios."""
    PHRASEOLOGY = "phraseology"           # Standard ATC readbacks
    PICTURE_DESCRIPTION = "picture_description"  # Describe aviation situations
    CONVERSATION = "conversation"          # Interactive ATC conversations


class SpeakingScenario(Base):
    """
    Speaking practice scenario.
    
    Contains the context, ATC prompt, and expected response elements
    for speaking practice.
    """
    
    __tablename__ = "speaking_scenarios"
    
    __table_args__ = (
        Index("ix_scenario_type_category", "scenario_type", "category"),
        Index("ix_scenario_difficulty", "difficulty"),
    )
    
    # ==========================================================================
    # Primary Key
    # ==========================================================================
    id: Mapped[str] = mapped_column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # ==========================================================================
    # Content
    # ==========================================================================
    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        comment="Scenario title"
    )
    scenario_type: Mapped[str] = mapped_column(
        String(50), 
        index=True,
        nullable=False,
        comment="phraseology, picture_description, conversation"
    )
    category: Mapped[str] = mapped_column(
        String(50), 
        index=True,
        nullable=False,
        comment="Category: phraseology, emergency, etc."
    )
    
    # ==========================================================================
    # Instructions
    # ==========================================================================
    setup: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Context/situation description"
    )
    instructions: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="Specific instructions for the user"
    )
    atc_prompt_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="What ATC says"
    )
    atc_prompt_audio_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="Audio of ATC prompt"
    )
    
    # ==========================================================================
    # Expected Response
    # ==========================================================================
    expected_elements: Mapped[Optional[List]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Required elements in the response"
    )
    sample_response: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Example correct response"
    )
    
    # ==========================================================================
    # Scoring Guidance
    # ==========================================================================
    scoring_rubric: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Rubric for each ICAO criterion"
    )
    common_cis_errors: Mapped[Optional[List]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Common errors by CIS speakers"
    )
    
    # ==========================================================================
    # Classification
    # ==========================================================================
    difficulty: Mapped[int] = mapped_column(
        Integer, 
        default=1, 
        index=True,
        comment="Difficulty level 1-3"
    )
    icao_level_target: Mapped[int] = mapped_column(
        Integer, 
        default=4,
        comment="Target ICAO level"
    )
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow
    )
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    submissions: Mapped[List["SpeakingSubmission"]] = relationship(
        back_populates="scenario",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<SpeakingScenario {self.title}>"


class SpeakingSubmission(Base):
    """
    User's speaking submission with AI feedback.
    
    Stores the audio recording, transcript, and ICAO criteria scores.
    """
    
    __tablename__ = "speaking_submissions"
    
    __table_args__ = (
        Index("ix_submission_user_scenario", "user_id", "scenario_id"),
        Index("ix_submission_user_status", "user_id", "status"),
        Index("ix_submission_created", "created_at"),
    )
    
    # ==========================================================================
    # Primary Key
    # ==========================================================================
    id: Mapped[str] = mapped_column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # ==========================================================================
    # Foreign Keys
    # ==========================================================================
    user_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    scenario_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("speaking_scenarios.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # Audio
    # ==========================================================================
    audio_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="URL to uploaded audio file"
    )
    audio_format: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="webm, m4a, mp3, wav"
    )
    duration_seconds: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Recording duration"
    )
    file_size_bytes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Audio file size"
    )
    
    # ==========================================================================
    # Transcription
    # ==========================================================================
    transcript: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Whisper transcription of the audio"
    )
    transcript_confidence: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="Confidence score from Whisper"
    )
    
    # ==========================================================================
    # AI Feedback
    # ==========================================================================
    ai_feedback: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        comment='{"strengths": [...], "improvements": [...], "overall": "..."}'
    )
    
    # ==========================================================================
    # ICAO Criteria Scores (1-6 scale)
    # ==========================================================================
    scores: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        comment='{"pronunciation": 4.2, "structure": 4.5, ...}'
    )
    # Individual score columns for easier querying
    score_pronunciation: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    score_structure: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    score_vocabulary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    score_fluency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    score_comprehension: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    score_interaction: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Overall score (weighted average or minimum)
    overall_score: Mapped[Optional[float]] = mapped_column(
        Float, 
        nullable=True,
        comment="Overall ICAO score (1-6)"
    )
    
    # ==========================================================================
    # Status
    # ==========================================================================
    status: Mapped[SubmissionStatus] = mapped_column(
        SQLEnum(SubmissionStatus),
        default=SubmissionStatus.PENDING,
        index=True
    )
    error_message: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Error message if processing failed"
    )
    retry_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of processing retries"
    )
    
    # ==========================================================================
    # XP
    # ==========================================================================
    xp_earned: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="XP earned from this submission"
    )
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        nullable=True,
        comment="When processing completed"
    )
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="speaking_submissions")
    scenario: Mapped["SpeakingScenario"] = relationship(back_populates="submissions")
    
    def __repr__(self) -> str:
        return f"<SpeakingSubmission user={self.user_id} status={self.status}>"
    
    @property
    def is_processed(self) -> bool:
        """Check if submission has been processed."""
        return self.status == SubmissionStatus.COMPLETED
    
    def calculate_overall_score(self) -> Optional[float]:
        """Calculate overall score as average of ICAO criteria."""
        scores = [
            self.score_pronunciation,
            self.score_structure,
            self.score_vocabulary,
            self.score_fluency,
            self.score_comprehension,
            self.score_interaction
        ]
        valid_scores = [s for s in scores if s is not None]
        if valid_scores:
            return round(sum(valid_scores) / len(valid_scores), 2)
        return None
