"""
Authentication API Routes

Endpoints:
- POST /auth/register - Create new user account (sends verification email)
- POST /auth/verify-email - Verify email with 6-digit code
- POST /auth/resend-code - Resend verification code
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
from app.services.email_service import send_verification_email
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    TokenWithUser,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    VerifyEmailRequest,
    ResendCodeRequest,
    ForgotPasswordRequest,
    LogoutRequest,
)
from app.schemas.user import UserResponse
from app.core.rate_limiter import (
    check_login_rate_limit,
    check_register_rate_limit,
    check_password_reset_rate_limit,
    check_verify_email_rate_limit,
    check_resend_code_rate_limit,
)
from app.core.security import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Register
# =============================================================================

@router.post(
    "/register", 
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register new user",
    description="Create a new user account and send verification email."
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
    - Creates user with hashed password (unverified)
    - Sends 6-digit verification code to email
    - Returns confirmation message (no tokens until verified)
    
    Rate limited: 3 requests per minute per IP
    """
    # Rate limiting
    await check_register_rate_limit(request)
    
    auth_service = AuthService(db)
    
    try:
        user = auth_service.register_user(data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Send verification email
    await send_verification_email(user.email, user.verification_code)
    
    logger.info(f"New user registered (pending verification): {user.email}")
    
    return RegisterResponse(
        message="Verification code sent to your email",
        email=user.email
    )


# =============================================================================
# Email Verification
# =============================================================================

@router.post(
    "/verify-email",
    response_model=TokenWithUser,
    summary="Verify email address",
    description="Verify email with 6-digit code and receive authentication tokens."
)
async def verify_email(
    data: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    """
    Verify user's email with 6-digit code.
    
    - Validates the verification code
    - Marks email as verified
    - Returns access and refresh tokens
    
    Rate limited: 5 attempts per email per 15 minutes
    """
    # Rate limiting
    await check_verify_email_rate_limit(data.email)
    
    auth_service = AuthService(db)
    user, error = auth_service.verify_email(data.email, data.code)
    
    if not user:
        # Determine appropriate status code
        if error == "Verification code expired":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        elif error == "Email already verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        elif "Invalid verification code" in error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        elif "Too many failed attempts" in error:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        else:
            # User not found - use generic message for security
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification request"
            )
    
    # Generate tokens for verified user
    tokens = auth_service._create_tokens(user.id)
    
    logger.info(f"Email verified: {user.email}")
    
    return TokenWithUser(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        expires_in=tokens.expires_in,
        refresh_expires_in=tokens.refresh_expires_in,
        user=UserResponse.model_validate(user)
    )


# =============================================================================
# Resend Verification Code
# =============================================================================

@router.post(
    "/resend-code",
    status_code=status.HTTP_200_OK,
    summary="Resend verification code",
    description="Request a new verification code to be sent to email."
)
async def resend_code(
    data: ResendCodeRequest,
    db: Session = Depends(get_db)
):
    """
    Resend verification code to user's email.
    
    - Checks user exists and is not already verified
    - Generates new 6-digit code
    - Sends new verification email
    
    Rate limited: 3 requests per email per hour
    """
    # Rate limiting
    await check_resend_code_rate_limit(data.email)
    
    auth_service = AuthService(db)
    user, error = auth_service.resend_verification_code(data.email)
    
    if not user:
        if error == "Email already verified":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error
            )
        else:
            # User not found - use generic message for security
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid request"
            )
    
    # Send new verification email
    await send_verification_email(user.email, user.verification_code)
    
    logger.info(f"Verification code resent to: {user.email[:3]}***")
    
    return {
        "message": "New verification code sent",
        "email": user.email
    }


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
    - Checks if email is verified (returns 403 if not)
    - Updates last login timestamp
    - Returns access token (60 min) and refresh token (30 days)
    
    Rate limited: 5 attempts per minute per IP
    """
    # Rate limiting: 5 attempts per minute per IP
    await check_login_rate_limit(request)
    
    auth_service = AuthService(db)
    user, tokens, error_code = auth_service.login(data.email, data.password)
    
    if error_code == "INVALID_CREDENTIALS":
        # Log failed attempt (without sensitive data)
        logger.warning(f"Failed login attempt for email: {data.email[:3]}***")
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if error_code == "EMAIL_NOT_VERIFIED":
        logger.warning(f"Login attempt by unverified user: {data.email[:3]}***")
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "Email not verified",
                "code": "EMAIL_NOT_VERIFIED",
                "email": data.email
            }
        )
    
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
