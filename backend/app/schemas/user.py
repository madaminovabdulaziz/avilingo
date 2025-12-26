"""
User Pydantic Schemas

Validation schemas for user-related API operations.
"""

from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
import re


# =============================================================================
# Base Schema
# =============================================================================

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(..., description="User's email address")
    display_name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="Display name shown in the app"
    )


# =============================================================================
# Create Schema (POST /auth/register)
# =============================================================================

class UserCreate(UserBase):
    """Schema for creating a new user account."""
    
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=100,
        description="Password (min 8 chars, must contain uppercase and digit)"
    )
    native_language: Optional[str] = Field(
        None, 
        max_length=50,
        description="User's native language (Russian, Uzbek, etc.)"
    )
    target_icao_level: int = Field(
        default=4, 
        ge=1, 
        le=6,
        description="Target ICAO level to achieve (1-6)"
    )
    test_date: Optional[date] = Field(
        None,
        description="Scheduled ICAO test date"
    )
    test_location: Optional[str] = Field(
        None,
        max_length=200,
        description="Location of scheduled test"
    )
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        """
        Validate password strength.
        Must contain at least one uppercase letter and one digit.
        """
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @field_validator('native_language')
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        """Validate native language is from supported list."""
        if v is None:
            return v
        supported = ['russian', 'uzbek', 'kazakh', 'chinese', 'turkish', 'other']
        if v.lower() not in supported:
            # Allow any value, but could restrict to supported languages
            pass
        return v


# =============================================================================
# Update Schema (PATCH /users/me)
# =============================================================================

class UserUpdate(BaseModel):
    """Schema for updating user profile. All fields optional."""
    
    display_name: Optional[str] = Field(
        None, 
        min_length=1, 
        max_length=100
    )
    native_language: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)
    
    # ICAO levels
    current_icao_level: Optional[int] = Field(None, ge=1, le=6)
    target_icao_level: Optional[int] = Field(None, ge=1, le=6)
    
    # Test info
    test_date: Optional[date] = None
    test_location: Optional[str] = Field(None, max_length=200)
    
    # Settings
    daily_goal_minutes: Optional[int] = Field(None, ge=5, le=120)
    reminder_enabled: Optional[bool] = None
    reminder_time: Optional[str] = Field(
        None, 
        pattern=r'^([01]\d|2[0-3]):([0-5]\d)$',
        description="Reminder time in HH:MM format"
    )
    preferred_difficulty: Optional[int] = Field(None, ge=1, le=3)

    model_config = ConfigDict(extra='forbid')


# =============================================================================
# Response Schema (GET /users/me)
# =============================================================================

class UserResponse(BaseModel):
    """Schema for user API responses."""
    
    id: str
    email: EmailStr
    display_name: str
    native_language: Optional[str] = None
    avatar_url: Optional[str] = None
    
    # ICAO levels
    current_icao_level: Optional[int] = None
    target_icao_level: int
    predicted_icao_level: Optional[float] = None
    
    # Test info
    test_date: Optional[date] = None
    test_location: Optional[str] = None
    days_until_test: Optional[int] = None
    
    # Subscription
    subscription_tier: str
    subscription_expires_at: Optional[datetime] = None
    
    # Settings
    daily_goal_minutes: int
    reminder_enabled: bool = True
    reminder_time: Optional[str] = None
    preferred_difficulty: int = 2
    
    # Stats
    total_xp: int = 0
    total_practice_minutes: int = 0
    
    # Account status
    is_active: bool = True
    is_verified: bool = False
    
    # Timestamps
    created_at: datetime
    last_login_at: Optional[datetime] = None
    last_practice_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Brief Response (for lists)
# =============================================================================

class UserBrief(BaseModel):
    """Brief user info for leaderboards or mentions."""
    
    id: str
    display_name: str
    avatar_url: Optional[str] = None
    predicted_icao_level: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Internal Schema (with password hash)
# =============================================================================

class UserInDB(UserResponse):
    """User schema with password hash for internal use only."""
    password_hash: str


# =============================================================================
# Password Change
# =============================================================================

class PasswordChange(BaseModel):
    """Schema for changing password."""
    
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('new_password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate new password strength."""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
