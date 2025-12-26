"""
Progress Pydantic Schemas

Validation schemas for progress tracking API operations.
"""

from datetime import datetime, date
from typing import Optional, List, Dict
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# DailyProgress Schemas
# =============================================================================

class DailyProgressBase(BaseModel):
    """Base daily progress fields."""
    
    vocab_reviewed: int = Field(default=0, ge=0)
    listening_completed: int = Field(default=0, ge=0)
    speaking_completed: int = Field(default=0, ge=0)
    practice_minutes: int = Field(default=0, ge=0)


class DailyProgressCreate(DailyProgressBase):
    """Schema for creating/updating daily progress."""
    pass


class DailyProgressResponse(BaseModel):
    """Daily progress data."""
    
    id: str
    date: date
    vocab_reviewed: int
    listening_completed: int
    speaking_completed: int
    practice_minutes: int
    xp_earned: int
    goal_met: bool
    total_activities: int  # Computed

    model_config = ConfigDict(from_attributes=True)


class DailyProgressList(BaseModel):
    """List of daily progress records with streak info."""
    
    items: List[DailyProgressResponse]
    start_date: date
    end_date: date
    total_days: int
    active_days: int


class DailyProgressWithStreakResponse(BaseModel):
    """Daily activity data with streak information."""
    
    items: List[DailyProgressResponse]
    start_date: date
    end_date: date
    total_days: int
    active_days: int
    # Streak info
    current_streak: int
    longest_streak: int
    last_practice_date: Optional[date] = None
    is_at_risk: bool = Field(default=False, description="True if streak will break tomorrow")


# =============================================================================
# Streak Schemas
# =============================================================================

class StreakResponse(BaseModel):
    """Streak information."""
    
    current_streak: int = Field(..., ge=0)
    longest_streak: int = Field(..., ge=0)
    last_practice_date: Optional[date] = None
    freeze_available: int = Field(default=0, ge=0)
    is_at_risk: bool = Field(default=False, description="True if streak will break tomorrow")

    model_config = ConfigDict(from_attributes=True)


class StreakUpdate(BaseModel):
    """Response after streak update."""
    
    streak: StreakResponse
    streak_maintained: bool
    streak_increased: bool
    new_record: bool  # True if new longest streak


# =============================================================================
# Category Progress
# =============================================================================

class CategoryProgress(BaseModel):
    """Progress for a specific category."""
    
    category: str
    display_name: str
    icon: str = "📚"
    total_items: int
    completed_items: int
    mastered_items: int = 0
    mastery_percent: float = Field(..., ge=0, le=100)
    average_score: Optional[float] = Field(None, ge=0, le=100)
    due_for_review: int = 0


# =============================================================================
# ICAO Criteria Progress
# =============================================================================

class ICAOCriteriaProgress(BaseModel):
    """Progress for each ICAO criteria."""
    
    pronunciation: float = Field(..., ge=0, le=6)
    structure: float = Field(..., ge=0, le=6)
    vocabulary: float = Field(..., ge=0, le=6)
    fluency: float = Field(..., ge=0, le=6)
    comprehension: float = Field(..., ge=0, le=6)
    interaction: float = Field(..., ge=0, le=6)
    
    def average(self) -> float:
        """Calculate average score."""
        return round(sum([
            self.pronunciation, self.structure, self.vocabulary,
            self.fluency, self.comprehension, self.interaction
        ]) / 6, 2)
    
    def weakest(self) -> str:
        """Get the weakest criterion."""
        scores = {
            'pronunciation': self.pronunciation,
            'structure': self.structure,
            'vocabulary': self.vocabulary,
            'fluency': self.fluency,
            'comprehension': self.comprehension,
            'interaction': self.interaction
        }
        return min(scores, key=scores.get)
    
    def strongest(self) -> str:
        """Get the strongest criterion."""
        scores = {
            'pronunciation': self.pronunciation,
            'structure': self.structure,
            'vocabulary': self.vocabulary,
            'fluency': self.fluency,
            'comprehension': self.comprehension,
            'interaction': self.interaction
        }
        return max(scores, key=scores.get)


# =============================================================================
# Comprehensive Progress Stats
# =============================================================================

class VocabularyStats(BaseModel):
    """Vocabulary progress statistics."""
    
    total_terms: int
    learned_terms: int  # At least 1 review
    mastered_terms: int  # Mastery >= 80%
    due_for_review: int
    new_available: int
    mastery_percent: float = Field(..., ge=0, le=100)
    by_category: List[CategoryProgress]
    review_accuracy: float = Field(..., ge=0, le=100)


class ListeningStats(BaseModel):
    """Listening progress statistics."""
    
    total_exercises: int
    completed_exercises: int
    completion_percent: float = Field(..., ge=0, le=100)
    average_score: float = Field(..., ge=0, le=100)
    total_attempts: int
    by_category: List[CategoryProgress]
    by_difficulty: Dict[int, float]  # difficulty -> average score


class SpeakingStats(BaseModel):
    """Speaking progress statistics."""
    
    total_scenarios: int
    completed_scenarios: int
    completion_percent: float = Field(..., ge=0, le=100)
    average_score: float = Field(..., ge=0, le=6)
    total_submissions: int
    icao_criteria: ICAOCriteriaProgress
    by_category: List[CategoryProgress]
    weakest_criterion: str
    strongest_criterion: str


class ProgressStatsResponse(BaseModel):
    """Comprehensive progress statistics."""
    
    # User info
    user_id: str
    display_name: str
    
    # Vocabulary
    vocabulary: VocabularyStats
    
    # Listening
    listening: ListeningStats
    
    # Speaking
    speaking: SpeakingStats
    
    # Overall
    predicted_icao_level: float = Field(..., ge=1, le=6)
    level_description: str  # "Operational", "Extended", etc.
    level_progress_percent: float = Field(..., ge=0, le=100)  # Progress to next level
    
    # Time
    total_practice_minutes: int
    practice_this_week_minutes: int
    average_daily_minutes: float
    
    # XP
    total_xp: int
    xp_this_week: int
    
    # Streak
    streak: StreakResponse
    
    # Test countdown
    test_date: Optional[date] = None
    days_until_test: Optional[int] = None
    on_track_for_goal: bool = True
    
    # Last activity
    last_practice_at: Optional[datetime] = None


# =============================================================================
# Achievement Schemas
# =============================================================================

class AchievementBase(BaseModel):
    """Base achievement fields."""
    
    code: str
    title: str
    description: str
    icon: str
    category: str
    xp_reward: int


class AchievementCreate(AchievementBase):
    """Schema for creating an achievement (admin)."""
    
    requirement_type: str
    requirement_value: int = 1
    requirement_field: Optional[str] = None
    is_hidden: bool = False
    sort_order: int = 0


class AchievementResponse(BaseModel):
    """Achievement with unlock status."""
    
    id: str
    code: str
    title: str
    description: str
    icon: str
    category: str
    xp_reward: int
    is_hidden: bool
    requirement_type: str
    requirement_value: int
    # User-specific
    is_unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    progress: int = 0
    progress_percent: float = Field(default=0, ge=0, le=100)

    model_config = ConfigDict(from_attributes=True)


class AchievementListResponse(BaseModel):
    """List of achievements."""
    
    earned: List[AchievementResponse]
    in_progress: List[AchievementResponse]
    locked: List[AchievementResponse]
    total_earned: int
    total_xp_from_achievements: int


class AchievementUnlocked(BaseModel):
    """Notification of newly unlocked achievement."""
    
    achievement: AchievementResponse
    xp_earned: int
    unlocked_at: datetime


# =============================================================================
# Practice Session
# =============================================================================

class PracticeSessionRequest(BaseModel):
    """Request to log a practice session."""
    
    vocab_reviewed: int = Field(default=0, ge=0)
    listening_completed: int = Field(default=0, ge=0)
    speaking_completed: int = Field(default=0, ge=0)
    practice_minutes: int = Field(default=0, ge=0)


class PracticeSessionResponse(BaseModel):
    """Response after logging a session."""
    
    # Updated stats
    daily_progress: DailyProgressResponse
    streak: StreakResponse
    
    # Session results
    xp_earned: int
    streak_maintained: bool
    streak_increased: bool
    goal_met: bool
    goal_progress_percent: float = Field(..., ge=0, le=100)
    
    # New achievements
    new_achievements: List[AchievementResponse] = []
    
    # Predicted level change
    predicted_icao_level: float
    level_change: float  # Positive = improvement


# =============================================================================
# Activity Timeline
# =============================================================================

class ActivityItem(BaseModel):
    """Single activity in timeline."""
    
    type: str  # vocabulary, listening, speaking
    action: str  # reviewed, completed, submitted
    title: str
    score: Optional[float] = None
    xp_earned: int = 0
    timestamp: datetime


class ActivityTimeline(BaseModel):
    """User activity timeline."""
    
    items: List[ActivityItem]
    total: int
    has_more: bool


# =============================================================================
# Weekly/Monthly Summary
# =============================================================================

class WeeklySummary(BaseModel):
    """Weekly progress summary."""
    
    week_start: date
    week_end: date
    
    # Activity counts
    vocab_reviewed: int
    listening_completed: int
    speaking_completed: int
    
    # Time
    practice_minutes: int
    active_days: int
    
    # Progress
    xp_earned: int
    new_terms_learned: int
    
    # Scores
    average_listening_score: Optional[float] = None
    average_speaking_score: Optional[float] = None
    
    # Comparison to previous week
    practice_minutes_change: int = 0
    xp_change: int = 0
    
    # Level progress
    icao_level_change: float = 0
