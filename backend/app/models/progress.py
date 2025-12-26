"""
Progress Models

- DailyProgress: Daily activity tracking
- Streak: User streak information
- Achievement: Achievement definitions
- UserAchievement: User's unlocked achievements
"""

import uuid
from datetime import datetime, date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, DateTime, Date, Integer, Text, ForeignKey, Boolean, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.mysql import CHAR

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class DailyProgress(Base):
    """
    Daily progress tracking for a user.
    
    Records activity counts for each day to track consistency
    and calculate streaks.
    """
    
    __tablename__ = "daily_progress"
    
    __table_args__ = (
        UniqueConstraint("user_id", "date", name="uq_user_date"),
        Index("ix_daily_progress_user_date", "user_id", "date"),
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
    user_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # Date
    # ==========================================================================
    date: Mapped[date] = mapped_column(
        Date, 
        index=True,
        nullable=False,
        comment="The date for this progress record"
    )
    
    # ==========================================================================
    # Activity Counts
    # ==========================================================================
    vocab_reviewed: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Number of vocabulary cards reviewed"
    )
    listening_completed: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Number of listening exercises completed"
    )
    speaking_completed: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Number of speaking submissions"
    )
    
    # ==========================================================================
    # Time Tracking
    # ==========================================================================
    practice_minutes: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Total practice time in minutes"
    )
    
    # ==========================================================================
    # XP
    # ==========================================================================
    xp_earned: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Total XP earned this day"
    )
    
    # ==========================================================================
    # Goal Tracking
    # ==========================================================================
    goal_met: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether daily goal was met"
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
    user: Mapped["User"] = relationship(back_populates="daily_progress")
    
    def __repr__(self) -> str:
        return f"<DailyProgress user={self.user_id} date={self.date}>"
    
    @property
    def total_activities(self) -> int:
        """Total number of activities completed."""
        return self.vocab_reviewed + self.listening_completed + self.speaking_completed


class Streak(Base):
    """
    User streak tracking.
    
    Maintains current and longest streak information.
    One record per user.
    """
    
    __tablename__ = "streaks"
    
    # ==========================================================================
    # Primary Key
    # ==========================================================================
    id: Mapped[str] = mapped_column(
        CHAR(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4())
    )
    
    # ==========================================================================
    # Foreign Key (one-to-one with User)
    # ==========================================================================
    user_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # Streak Data
    # ==========================================================================
    current_streak: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Current consecutive days streak"
    )
    longest_streak: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Longest streak ever achieved"
    )
    last_practice_date: Mapped[Optional[date]] = mapped_column(
        Date, 
        nullable=True,
        comment="Date of last practice"
    )
    
    # ==========================================================================
    # Streak Freeze (premium feature)
    # ==========================================================================
    freeze_available: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Number of streak freezes available"
    )
    freeze_used_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True,
        comment="Date when freeze was last used"
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
    user: Mapped["User"] = relationship(back_populates="streak")
    
    def __repr__(self) -> str:
        return f"<Streak user={self.user_id} current={self.current_streak}>"
    
    def update_streak(self, practice_date: date) -> bool:
        """
        Update streak based on practice date.
        
        Returns True if streak was maintained/incremented, False if broken.
        """
        if self.last_practice_date is None:
            # First practice
            self.current_streak = 1
            self.last_practice_date = practice_date
            self.longest_streak = max(self.longest_streak, 1)
            return True
        
        days_diff = (practice_date - self.last_practice_date).days
        
        if days_diff == 0:
            # Same day, no change
            return True
        elif days_diff == 1:
            # Consecutive day, increment
            self.current_streak += 1
            self.last_practice_date = practice_date
            self.longest_streak = max(self.longest_streak, self.current_streak)
            return True
        else:
            # Streak broken
            self.current_streak = 1
            self.last_practice_date = practice_date
            return False


class Achievement(Base):
    """
    Achievement definition.
    
    Defines the achievements that users can earn through various activities.
    """
    
    __tablename__ = "achievements"
    
    __table_args__ = (
        Index("ix_achievement_category", "category"),
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
    # Identification
    # ==========================================================================
    code: Mapped[str] = mapped_column(
        String(50), 
        unique=True, 
        index=True,
        nullable=False,
        comment="Unique code: first_word, week_streak, etc."
    )
    
    # ==========================================================================
    # Display
    # ==========================================================================
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Achievement title"
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Achievement description"
    )
    icon: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Emoji or icon name"
    )
    
    # ==========================================================================
    # Requirements
    # ==========================================================================
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="vocabulary, listening, speaking, streak, general"
    )
    requirement_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="count, streak, score, first, etc."
    )
    requirement_value: Mapped[int] = mapped_column(
        Integer, 
        default=1,
        comment="Target value to unlock"
    )
    requirement_field: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Field to check for requirement"
    )
    
    # ==========================================================================
    # Rewards
    # ==========================================================================
    xp_reward: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="XP awarded when unlocked"
    )
    
    # ==========================================================================
    # Display Options
    # ==========================================================================
    is_hidden: Mapped[bool] = mapped_column(
        Boolean, 
        default=False,
        comment="Hidden until unlocked (secret achievements)"
    )
    sort_order: Mapped[int] = mapped_column(
        Integer,
        default=0,
        comment="Display order in achievement list"
    )
    
    # ==========================================================================
    # Timestamps
    # ==========================================================================
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # ==========================================================================
    # Relationships
    # ==========================================================================
    user_achievements: Mapped[List["UserAchievement"]] = relationship(
        back_populates="achievement",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Achievement {self.code}: {self.title}>"


class UserAchievement(Base):
    """
    User's unlocked achievements.
    
    Links users to their earned achievements with unlock timestamps.
    """
    
    __tablename__ = "user_achievements"
    
    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
        Index("ix_user_achievement_user", "user_id"),
        Index("ix_user_achievement_date", "unlocked_at"),
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
    achievement_id: Mapped[str] = mapped_column(
        CHAR(36), 
        ForeignKey("achievements.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    
    # ==========================================================================
    # Progress
    # ==========================================================================
    progress: Mapped[int] = mapped_column(
        Integer, 
        default=0,
        comment="Progress toward achievement (for incremental)"
    )
    
    # ==========================================================================
    # Unlock Status
    # ==========================================================================
    unlocked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        default=None,
        comment="When the achievement was unlocked (null if not yet)"
    )
    is_unlocked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether achievement is unlocked"
    )
    
    # ==========================================================================
    # Notification
    # ==========================================================================
    notified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Whether user has been notified of unlock"
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
    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="user_achievements")
    
    def __repr__(self) -> str:
        status = "unlocked" if self.is_unlocked else f"progress={self.progress}"
        return f"<UserAchievement user={self.user_id} {self.achievement_id} {status}>"
    
    def unlock(self) -> None:
        """Mark achievement as unlocked."""
        self.is_unlocked = True
        self.unlocked_at = datetime.utcnow()
