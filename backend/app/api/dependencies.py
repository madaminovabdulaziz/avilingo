"""
API Dependencies

Common dependencies for API routes.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User, SubscriptionTier
from app.core.security import (
    get_current_user_id,
    get_optional_user_id,
)


# =============================================================================
# User Dependencies
# =============================================================================

async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user.
    
    Usage:
        @router.get("/profile")
        async def get_profile(user: User = Depends(get_current_user)):
            return user
    
    Raises:
        HTTPException: 401 if user not found or inactive
    """
    user = db.get(User, user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_optional_user(
    user_id: Optional[str] = Depends(get_optional_user_id),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optionally get the current user.
    
    Returns None if not authenticated (doesn't raise).
    
    Usage:
        @router.get("/content")
        async def get_content(user: Optional[User] = Depends(get_optional_user)):
            if user:
                # personalized content
            else:
                # anonymous content
    """
    if user_id is None:
        return None
    
    user = db.get(User, user_id)
    
    if user is None or not user.is_active:
        return None
    
    return user


async def get_verified_user(
    user: User = Depends(get_current_user)
) -> User:
    """
    Get current user, requiring email verification.
    
    Raises:
        HTTPException: 403 if email not verified
    """
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required"
        )
    
    return user


async def get_premium_user(
    user: User = Depends(get_current_user)
) -> User:
    """
    Get current user, requiring premium subscription.
    
    Raises:
        HTTPException: 403 if not premium
    """
    if user.subscription_tier == SubscriptionTier.FREE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required",
            headers={"X-Upgrade-Required": "true"}
        )
    
    return user


# =============================================================================
# Pagination Dependencies
# =============================================================================

def get_pagination_params(
    skip: int = 0,
    limit: int = 20
) -> dict:
    """
    Common pagination parameters.
    
    Usage:
        @router.get("/items")
        async def list_items(pagination: dict = Depends(get_pagination_params)):
            skip, limit = pagination["skip"], pagination["limit"]
    """
    # Ensure reasonable limits
    limit = min(limit, 100)  # Max 100 items per page
    skip = max(skip, 0)
    
    return {"skip": skip, "limit": limit}


class PaginationParams:
    """Pagination parameters class."""
    
    def __init__(
        self,
        page: int = 1,
        per_page: int = 20
    ):
        self.page = max(1, page)
        self.per_page = min(max(1, per_page), 100)
        self.skip = (self.page - 1) * self.per_page
        self.limit = self.per_page

