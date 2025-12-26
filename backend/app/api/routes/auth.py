"""
Authentication API Routes

Endpoints:
- POST /auth/register - Create new user account
- POST /auth/login - Authenticate and get tokens
- POST /auth/refresh - Refresh access token
- POST /auth/logout - Invalidate tokens
- POST /auth/forgot-password - Request password reset
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import logging

from app.db.session import get_db
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    TokenWithUser,
    RefreshRequest,
    RegisterRequest,
    ForgotPasswordRequest,
    LogoutRequest,
)
from app.schemas.user import UserResponse
from app.core.rate_limiter import (
    check_login_rate_limit,
    check_register_rate_limit,
    check_password_reset_rate_limit,
)
from app.core.security import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Register
# =============================================================================

@router.post(
    "/register", 
    response_model=TokenWithUser,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account and return authentication tokens."
)
async def register(
    request: Request,
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - Validates email format and password strength
    - Checks for existing email
    - Creates user with hashed password
    - Returns access and refresh tokens
    
    Rate limited: 3 requests per minute per IP
    """
    # Rate limiting
    await check_register_rate_limit(request)
    
    auth_service = AuthService(db)
    
    try:
        user, tokens = auth_service.register_user(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    logger.info(f"New user registered: {user.email}")
    
    # Return tokens with user data
    return TokenWithUser(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        expires_in=tokens.expires_in,
        refresh_expires_in=tokens.refresh_expires_in,
        user=UserResponse.model_validate(user)
    )


# =============================================================================
# Login
# =============================================================================

@router.post(
    "/login",
    response_model=TokenWithUser,
    summary="Login user",
    description="Authenticate with email and password to get tokens."
)
async def login(
    request: Request,
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return tokens.
    
    - Validates credentials
    - Updates last login timestamp
    - Returns access token (60 min) and refresh token (30 days)
    
    Rate limited: 5 attempts per minute per IP
    """
    # Rate limiting: 5 attempts per minute per IP
    await check_login_rate_limit(request)
    
    auth_service = AuthService(db)
    result = auth_service.login(data.email, data.password)
    
    if result is None:
        # Log failed attempt (without sensitive data)
        logger.warning(f"Failed login attempt for email: {data.email[:3]}***")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user, tokens = result
    logger.info(f"User logged in: {user.email}")
    
    return TokenWithUser(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        expires_in=tokens.expires_in,
        refresh_expires_in=tokens.refresh_expires_in,
        user=UserResponse.model_validate(user)
    )


# =============================================================================
# Refresh Token
# =============================================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for new tokens."
)
async def refresh_token(
    data: RefreshRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token.
    
    - Validates the refresh token
    - Checks user still exists and is active
    - Returns new access and refresh tokens
    
    Note: The old refresh token becomes invalid after use (rotation).
    """
    auth_service = AuthService(db)
    tokens = auth_service.refresh_tokens(data.refresh_token)
    
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return tokens


# =============================================================================
# Logout
# =============================================================================

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user",
    description="Invalidate the current session."
)
async def logout(
    data: LogoutRequest = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Logout user.
    
    For JWT tokens, logout is handled client-side by:
    1. Removing tokens from storage
    2. Optionally adding to a blacklist (not implemented here)
    
    In a production system with token blacklisting:
    - Store the token's JTI (JWT ID) in Redis
    - Check blacklist on every authenticated request
    
    For now, this is a no-op that confirms the logout.
    """
    # In production: add token to blacklist in Redis
    # await redis.setex(f"blacklist:{token_jti}", token_exp_seconds, "1")
    
    logger.info(f"User logged out: {user_id}")
    
    return {
        "message": "Successfully logged out",
        "detail": "Please remove tokens from client storage"
    }


# =============================================================================
# Forgot Password
# =============================================================================

@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    summary="Request password reset",
    description="Send password reset email to the specified address."
)
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request a password reset.
    
    - Always returns success to prevent email enumeration
    - Sends reset email if account exists (not implemented)
    
    Rate limited: 3 requests per minute per email
    
    Note: This is a placeholder. Full implementation requires:
    1. Generate secure reset token
    2. Store token with expiration
    3. Send email with reset link
    4. Handle /reset-password endpoint
    """
    # Rate limiting by email
    await check_password_reset_rate_limit(request, data.email)
    
    auth_service = AuthService(db)
    
    # Always succeeds to prevent email enumeration
    auth_service.request_password_reset(data.email)
    
    return {
        "message": "If an account exists with this email, a password reset link has been sent.",
        "detail": "Please check your email inbox and spam folder."
    }


# =============================================================================
# Additional Endpoints
# =============================================================================

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the authenticated user's profile."
)
async def get_current_user_profile(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get current authenticated user's profile.
    
    Requires valid access token.
    """
    from app.models.user import User
    
    user = db.get(User, user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.post(
    "/verify-token",
    summary="Verify token validity",
    description="Check if an access token is valid."
)
async def verify_token(
    user_id: str = Depends(get_current_user_id)
):
    """
    Verify that the current access token is valid.
    
    Returns user ID if valid.
    """
    return {
        "valid": True,
        "user_id": user_id
    }
