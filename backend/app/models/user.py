"""
User Model

Stores user account information and preferences.
"""

import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Date, Integer, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR
import enum

from app.db.base import Base

# Avoid circular imports for type hints
if TYPE_CHECKING:
    from app.models.vocabulary import VocabularyProgress
    from app.models.listening import ListeningAttempt
    from app.models.speaking import SpeakingSubmission
    from app.models.progress import DailyProgress, Streak, UserAchievement


class SubscriptionTier(str, enum.Enum):
    """User subscription tiers."""
    FREE = "free"
    PREMIUM = "premium"
    LIFETIME = "lifetime"


class User(Base):
    """
    User account model.
    
    Stores authentication credentials, profile information, learning preferences,
    and subscription status.
    """
    
    __tablename__ = "users"
    
    # Table-level indexes
    __table_args__ = (
        Index("ix_users_email_lower", "email"),
        Index("ix_users_subscription", "subscription_tier"),
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
    # Authentication
    # ==========================================================================
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        index=True,
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    
    # ==========================================================================
    # Profile
    # ==========================================================================
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    native_language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # ==========================================================================
    # ICAO Levels (1-6 scale)
    # ==========================================================================
    current_icao_level: Mapped[Optional[int]] = mapped_column(
        Integer, 
        nullable=True,
        comment="User's current/last tested ICAO level"
    )
    target_icao_level: Mapped[int] = mapped_column(
        Integer, 
        default=4,
        comment="User's target ICAO level to achieve"
    )
    predicted_icao_level: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        comment="AI-predicted ICAO level based on performance"
    )
    
    # ==========================================================================
    # Test Date
    # ==========================================================================
    test_date: Mapped[Optional[date]] = mapped_column(
        Date, 
        nullable=True,
        comment="Scheduled ICAO test date"
    )
    test_location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # ==========================================================================
    # Subscription
    # ==========================================================================
    subscription_tier: Mapped[SubscriptionTier] = mapped_column(
        SQLEnum(SubscriptionTier),
        default=SubscriptionTier.FREE
    )
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, 
        nullable=True
    )
    
    # ==========================================================================
    # Settings
    # ==========================================================================
    daily_goal_minutes: Mapped[int] = mapped_column(Integer, default=15)
    reminder_enabled: Mapped[bool] = mapped_column(default=True)
    reminder_time: Mapped[Optional[str]] = mapped_column(
        String(5), 
        nullable=True,
        comment="HH:MM format"
    )
    preferred_difficulty: Mapped[int] = mapped_column(Integer, default=2)
    
    # ==========================================================================
    # Stats
    # ==========================================================================
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    total_practice_minutes: Mapped[int] = mapped_column(Integer, default=0)
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_practice_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    vocabulary_progress: Mapped[List["VocabularyProgress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    listening_attempts: Mapped[List["ListeningAttempt"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    speaking_submissions: Mapped[List["SpeakingSubmission"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    daily_progress: Mapped[List["DailyProgress"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    streak: Mapped[Optional["Streak"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        uselist=False
    )
    achievements: Mapped[List["UserAchievement"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    def __repr__(self) -> str:
        return f"<User {self.email}>"
    
    @property
    def days_until_test(self) -> Optional[int]:
        """Calculate days remaining until test date."""
        if self.test_date:
            delta = self.test_date - date.today()
            return delta.days
        return None
