"""
Authentication Pydantic Schemas

Validation schemas for authentication endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
import re


# =============================================================================
# Login
# =============================================================================

class LoginRequest(BaseModel):
    """Schema for login request."""
    
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(
        ..., 
        min_length=1,
        description="User's password"
    )
    remember_me: bool = Field(
        default=False,
        description="If true, use longer token expiration"
    )


# =============================================================================
# Token Response
# =============================================================================

class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    refresh_expires_in: int = Field(..., description="Refresh token expiration in seconds")


# =============================================================================
# Token with User
# =============================================================================

class TokenWithUser(TokenResponse):
    """Token response that includes user data."""
    
    user: "UserResponse"  # Forward reference
    
    # Import at runtime to avoid circular import
    model_config = ConfigDict(from_attributes=True)


# Import for forward reference
from app.schemas.user import UserResponse
TokenWithUser.model_rebuild()


# =============================================================================
# Refresh Token
# =============================================================================

class RefreshRequest(BaseModel):
    """Schema for token refresh request."""
    
    refresh_token: str = Field(..., description="Valid refresh token")


# =============================================================================
# Registration
# =============================================================================

class RegisterRequest(BaseModel):
    """Schema for user registration."""
    
    email: EmailStr = Field(..., description="Email address")
    password: str = Field(
        ..., 
        min_length=8, 
        max_length=100,
        description="Password (min 8 chars, uppercase, lowercase, digit)"
    )
    display_name: str = Field(
        ..., 
        min_length=1, 
        max_length=100,
        description="Display name"
    )
    native_language: Optional[str] = Field(
        None,
        max_length=50,
        description="Native language"
    )
    target_icao_level: int = Field(
        default=4,
        ge=1,
        le=6,
        description="Target ICAO level (1-6)"
    )
    test_date: Optional[str] = Field(
        None,
        pattern=r'^\d{4}-\d{2}-\d{2}$',
        description="Test date in YYYY-MM-DD format"
    )
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate password strength."""
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @field_validator('display_name')
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        """Validate display name."""
        v = v.strip()
        if not v:
            raise ValueError('Display name cannot be empty')
        return v


# =============================================================================
# Password Reset
# =============================================================================

class ForgotPasswordRequest(BaseModel):
    """Schema for password reset request."""
    
    email: EmailStr = Field(..., description="Email address to send reset link")


class ResetPasswordRequest(BaseModel):
    """Schema for password reset with token."""
    
    token: str = Field(..., min_length=1, description="Password reset token")
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=100,
        description="New password"
    )
    
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


# =============================================================================
# Email Verification
# =============================================================================

class VerifyEmailRequest(BaseModel):
    """Schema for email verification."""
    
    token: str = Field(..., min_length=1, description="Email verification token")


class ResendVerificationRequest(BaseModel):
    """Schema for resending verification email."""
    
    email: EmailStr = Field(..., description="Email address to resend verification")


# =============================================================================
# Logout
# =============================================================================

class LogoutRequest(BaseModel):
    """Schema for logout request."""
    
    refresh_token: Optional[str] = Field(
        None,
        description="Refresh token to invalidate (optional)"
    )


# =============================================================================
# Change Password
# =============================================================================

class ChangePasswordRequest(BaseModel):
    """Schema for changing password."""
    
    current_password: str = Field(
        ..., 
        min_length=1,
        description="Current password for verification"
    )
    new_password: str = Field(
        ..., 
        min_length=8, 
        max_length=100,
        description="New password"
    )
    
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


# =============================================================================
# Token Validation Response
# =============================================================================

class TokenValidationResponse(BaseModel):
    """Schema for token validation response."""
    
    valid: bool
    user_id: Optional[str] = None
    expires_at: Optional[datetime] = None
    token_type: Optional[str] = None
