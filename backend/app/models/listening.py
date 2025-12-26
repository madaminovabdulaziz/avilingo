"""
Listening Models

- ListeningExercise: ATC audio clips with metadata
- ListeningQuestion: Questions for each exercise
- ListeningAttempt: User's attempts and scores
"""

import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Integer, Float, Text, ForeignKey, Boolean, JSON, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class ListeningExercise(Base):
    """
    ATC listening exercise with audio.
    
    Contains an audio clip of ATC communications with questions
    to test comprehension.
    """
    
    __tablename__ = "listening_exercises"
    
    __table_args__ = (
        Index("ix_listening_category_difficulty", "category", "difficulty"),
        Index("ix_listening_accent_speed", "accent", "speed"),
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
        comment="Exercise title"
    )
    audio_url: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True,
        comment="URL to audio file"
    )
    transcript: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Full transcript of the audio"
    )
    duration_seconds: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Audio duration in seconds"
    )
    
    # ==========================================================================
    # Classification
    # ==========================================================================
    category: Mapped[str] = mapped_column(
        String(50), 
        index=True,
        nullable=False,
        comment="clearance_delivery, ground, tower, approach, etc."
    )
    scenario_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="routine, non_routine, emergency"
    )
    accent: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="American, British, Indian, etc."
    )
    speed: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="slow, normal, fast"
    )
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
    # Teaching Content
    # ==========================================================================
    teaching_points: Mapped[Optional[List]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Key learning points from this exercise"
    )
    model_readback: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Example correct readback"
    )
    audio_generation_notes: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Notes for audio generation"
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
    questions: Mapped[List["ListeningQuestion"]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan",
        order_by="ListeningQuestion.order"
    )
    attempts: Mapped[List["ListeningAttempt"]] = relationship(
        back_populates="exercise",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<ListeningExercise {self.title}>"


class ListeningQuestion(Base):
    """
    Question for a listening exercise.
    
    Supports multiple choice, fill-in-the-blank, and true/false questions.
    """
    
    __tablename__ = "listening_questions"
    
    __table_args__ = (
        Index("ix_question_exercise_order", "exercise_id", "order"),
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
    # Foreign Key
    # ==========================================================================
    exercise_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("listening_exercises.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # Question Content
    # ==========================================================================
    question_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="multiple_choice, fill_blank, true_false"
    )
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="The question text"
    )
    options: Mapped[Optional[List]] = mapped_column(
        JSON, 
        nullable=True,
        comment="Options for multiple choice questions"
    )
    correct_answer: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="The correct answer"
    )
    explanation: Mapped[Optional[str]] = mapped_column(
        Text, 
        nullable=True,
        comment="Explanation shown after answering"
    )
    
    # ==========================================================================
    # Ordering
    # ==========================================================================
    order: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Display order within exercise"
    )
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    exercise: Mapped["ListeningExercise"] = relationship(back_populates="questions")
    
    def __repr__(self) -> str:
        return f"<ListeningQuestion {self.question_type}: {self.question_text[:30]}...>"


class ListeningAttempt(Base):
    """
    User's attempt at a listening exercise.
    
    Records the user's answers, score, and completion status.
    """
    
    __tablename__ = "listening_attempts"
    
    __table_args__ = (
        Index("ix_attempt_user_exercise", "user_id", "exercise_id"),
        Index("ix_attempt_user_date", "user_id", "created_at"),
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
    exercise_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("listening_exercises.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # Results
    # ==========================================================================
    score_percent: Mapped[float] = mapped_column(
        Float, 
        default=0.0,
        comment="Score as percentage (0-100)"
    )
    answers: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True,
        comment="User's answers: {question_id: answer}"
    )
    correct_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of correct answers"
    )
    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Total number of questions"
    )
    
    # ==========================================================================
    # Timing
    # ==========================================================================
    time_spent_seconds: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Time spent on the exercise"
    )
    audio_plays: Mapped[int] = mapped_column(
        Integer,
        default=1,
        comment="Number of times audio was played"
    )
    
    # ==========================================================================
    # Status
    # ==========================================================================
    completed: Mapped[bool] = mapped_column(
        Boolean, 
        default=False,
        comment="Whether the attempt was completed"
    )
    
    # ==========================================================================
    # XP
    # ==========================================================================
    xp_earned: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="XP earned from this attempt"
    )
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        nullable=True,
        comment="When the attempt was completed"
    )
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    user: Mapped["User"] = relationship(back_populates="listening_attempts")
    exercise: Mapped["ListeningExercise"] = relationship(back_populates="attempts")
    
    def __repr__(self) -> str:
        return f"<ListeningAttempt user={self.user_id} score={self.score_percent}%>"
