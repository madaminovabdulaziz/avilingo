"""
User API Routes

Endpoints:
- GET /users/me - Get current user profile
- PATCH /users/me - Update current user profile
- DELETE /users/me - Deactivate account
- POST /users/me/change-password - Change password
"""

from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.auth import ChangePasswordRequest
from app.api.dependencies import get_current_user
from app.core.security import verify_password, hash_password

router = APIRouter()


# =============================================================================
# Profile Endpoints
# =============================================================================

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Get the authenticated user's profile information."
)
async def get_current_user_profile(
    user: User = Depends(get_current_user)
):
    """
    Get current user's profile.
    
    Returns the authenticated user's complete profile.
    """
    return UserResponse.model_validate(user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="Update profile fields like display_name, target_icao_level, etc."
)
async def update_current_user_profile(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    
    Only provided fields will be updated.
    Email changes require verification (not implemented here).
    """
    # Get update data, excluding unset fields
    update_data = data.model_dump(exclude_unset=True)
    
    # Email changes should go through verification
    if "email" in update_data:
        # Check if email is already taken
        from sqlalchemy import select
        existing = db.execute(
            select(User).where(
                User.email == update_data["email"].lower(),
                User.id != user.id
            )
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        
        # For now, update directly (in production, require verification)
        update_data["email"] = update_data["email"].lower()
    
    # Apply updates
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


# =============================================================================
# Account Management
# =============================================================================

@router.delete(
    "/me",
    status_code=status.HTTP_200_OK,
    summary="Deactivate account",
    description="Deactivate the user's account. This is reversible."
)
async def deactivate_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate the current user's account.
    
    The account is not deleted, just marked as inactive.
    User can contact support to reactivate.
    """
    user.is_active = False
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Account deactivated successfully",
        "detail": "Contact support to reactivate your account"
    }


@router.post(
    "/me/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password",
    description="Change the user's password."
)
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Change the user's password.
    
    Requires the current password for verification.
    """
    # Verify current password
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    user.password_hash = hash_password(data.new_password)
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Password changed successfully"
    }


# =============================================================================
# Settings Endpoints
# =============================================================================

@router.get(
    "/me/settings",
    summary="Get user settings",
    description="Get the user's app settings and preferences."
)
async def get_user_settings(
    user: User = Depends(get_current_user)
):
    """
    Get user's settings and preferences.
    """
    return {
        "daily_goal_minutes": user.daily_goal_minutes,
        "reminder_enabled": user.reminder_enabled,
        "reminder_time": user.reminder_time,
        "preferred_difficulty": user.preferred_difficulty,
        "native_language": user.native_language,
        "target_icao_level": user.target_icao_level,
        "test_date": user.test_date.isoformat() if user.test_date else None,
    }


@router.patch(
    "/me/settings",
    summary="Update user settings",
    description="Update the user's app settings and preferences."
)
async def update_user_settings(
    data: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user's settings and preferences.
    """
    allowed_fields = {
        "daily_goal_minutes",
        "reminder_enabled", 
        "reminder_time",
        "preferred_difficulty",
        "native_language",
        "target_icao_level",
        "test_date",
    }
    
    for field, value in data.items():
        if field in allowed_fields and hasattr(user, field):
            setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Settings updated successfully",
        "settings": {
            "daily_goal_minutes": user.daily_goal_minutes,
            "reminder_enabled": user.reminder_enabled,
            "reminder_time": user.reminder_time,
            "preferred_difficulty": user.preferred_difficulty,
            "native_language": user.native_language,
            "target_icao_level": user.target_icao_level,
            "test_date": user.test_date.isoformat() if user.test_date else None,
        }
    }
