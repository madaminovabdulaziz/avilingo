"""
Vocabulary Models

- VocabularyTerm: Aviation vocabulary terms
- VocabularyProgress: User's spaced repetition progress per term
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Integer, Float, Text, ForeignKey, JSON, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class VocabularyTerm(Base):
    """
    Aviation vocabulary term.
    
    Contains the term, definition, phonetics, examples, and learning aids
    specific to aviation English.
    """
    
    __tablename__ = "vocabulary_terms"
    
    __table_args__ = (
        Index("ix_vocab_category_difficulty", "category", "difficulty"),
        Index("ix_vocab_icao_level", "icao_level_target"),
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
    # Core Content
    # ==========================================================================
    term: Mapped[str] = mapped_column(
        String(100), 
        index=True,
        nullable=False,
        comment="The vocabulary term/phrase"
    )
    phonetic: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True,
        comment="IPA phonetic transcription"
    )
    part_of_speech: Mapped[Optional[str]] = mapped_column(
        String(50), 
        nullable=True,
        comment="noun, verb, phrase, etc."
    )
    definition: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Definition in aviation context"
    )
    aviation_context: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="When/how used in aviation"
    )
    
    # ==========================================================================
    # Examples
    # ==========================================================================
    example_atc: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Example ATC instruction using this term"
    )
    example_response: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Example pilot response"
    )
    example_sentence: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="General example sentence"
    )
    
    # ==========================================================================
    # Learning Aids
    # ==========================================================================
    common_errors: Mapped[Optional[List]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Common mistakes to avoid"
    )
    cis_pronunciation_tips: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Pronunciation tips for CIS speakers"
    )
    related_terms: Mapped[Optional[List]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Related vocabulary terms"
    )
    
    # ==========================================================================
    # Classification
    # ==========================================================================
    category: Mapped[str] = mapped_column(
        String(50), 
        index=True,
        nullable=False,
        comment="standard_phraseology, weather, navigation, emergencies, etc."
    )
    difficulty: Mapped[int] = mapped_column(
        Integer, 
        default=1,
        comment="Difficulty level 1-5"
    )
    icao_level_target: Mapped[int] = mapped_column(
        Integer, 
        default=4,
        comment="Target ICAO level for this term"
    )
    
    # ==========================================================================
    # Media
    # ==========================================================================
    audio_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="URL to pronunciation audio"
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
    progress_records: Mapped[List["VocabularyProgress"]] = relationship(
        back_populates="term",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<VocabularyTerm {self.term}>"


class VocabularyProgress(Base):
    """
    User's progress on a vocabulary term.
    
    Implements SM-2 spaced repetition algorithm fields:
    - ease_factor: How easy the card is (starts at 2.5)
    - interval_days: Days until next review
    - repetitions: Consecutive correct answers
    - next_review_at: When to show the card again
    """
    
    __tablename__ = "vocabulary_progress"
    
    __table_args__ = (
        UniqueConstraint("user_id", "term_id", name="uq_user_term"),
        Index("ix_vocab_progress_review", "user_id", "next_review_at"),
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
    term_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("vocabulary_terms.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # SM-2 Algorithm Fields
    # ==========================================================================
    ease_factor: Mapped[float] = mapped_column(
        Float, 
        default=2.5,
        comment="Ease factor (min 1.3, default 2.5)"
    )
    interval_days: Mapped[int] = mapped_column(
        Integer, 
        default=1,
        comment="Current interval in days"
    )
    repetitions: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Consecutive correct reviews"
    )
    next_review_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        index=True,
        comment="When this card is due for review"
    )
    
    # ==========================================================================
    # Statistics
    # ==========================================================================
    total_reviews: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Total number of reviews"
    )
    correct_reviews: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Number of correct reviews (quality >= 3)"
    )
    last_quality: Mapped[Optional[int]] = mapped_column(
        Integer, 
        nullable=True,
        comment="Last review quality rating (0-5)"
    )
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_reviewed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        nullable=True,
        comment="When the term was last reviewed"
    )
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="vocabulary_progress")
    term: Mapped["VocabularyTerm"] = relationship(back_populates="progress_records")
    
    def __repr__(self) -> str:
        return f"<VocabularyProgress user={self.user_id} term={self.term_id}>"
    
    @property
    def is_due(self) -> bool:
        """Check if this card is due for review."""
        return datetime.utcnow() >= self.next_review_at
    
    @property
    def mastery_percent(self) -> float:
        """Calculate mastery percentage."""
        if self.total_reviews == 0:
            return 0.0
        accuracy = self.correct_reviews / self.total_reviews
        ease_normalized = min(1.0, max(0.0, (self.ease_factor - 1.3) / 1.7))
        rep_factor = min(1.0, self.repetitions / 5)
        return round((accuracy * 0.4 + ease_normalized * 0.3 + rep_factor * 0.3) * 100, 1)
