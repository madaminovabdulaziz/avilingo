"""
Authentication Service

Business logic for user authentication, registration, and token management.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.user import User, SubscriptionTier
from app.models.progress import Streak
from app.schemas.auth import RegisterRequest, TokenResponse
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.config import settings
from app.services.email_service import generate_verification_code, send_verification_email

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =========================================================================
    # User Lookup
    # =========================================================================
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email address (case-insensitive)."""
        stmt = select(User).where(User.email == email.lower())
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.db.get(User, user_id)
    
    # =========================================================================
    # Registration
    # =========================================================================
    
    def register_user(self, data: RegisterRequest) -> User:
        """
        Register a new user with email verification required.
        
        Args:
            data: Registration request data
            
        Returns:
            User object (unverified)
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email already exists
        existing = self.get_user_by_email(data.email)
        if existing:
            raise ValueError("Email already registered")
        
        # Generate verification code
        verification_code = generate_verification_code()
        code_expires_at = datetime.utcnow() + timedelta(
            minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES
        )
        
        # Create user
        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            display_name=data.display_name.strip(),
            native_language=data.native_language,
            target_icao_level=data.target_icao_level,
            subscription_tier=SubscriptionTier.FREE,
            is_active=True,
            is_verified=False,
            verification_code=verification_code,
            verification_code_expires_at=code_expires_at,
            verification_attempts=0,
        )
        
        # Parse test date if provided
        if data.test_date:
            from datetime import date
            try:
                year, month, day = data.test_date.split("-")
                user.test_date = date(int(year), int(month), int(day))
            except (ValueError, AttributeError):
                pass  # Invalid date format, skip
        
        self.db.add(user)
        self.db.flush()  # Get the user ID
        
        # Create initial streak record
        streak = Streak(user_id=user.id)
        self.db.add(streak)
        
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"New user registered (pending verification): {user.email}")
        
        return user
    
    # =========================================================================
    # Email Verification
    # =========================================================================
    
    def verify_email(
        self, 
        email: str, 
        code: str
    ) -> Tuple[Optional[User], str]:
        """
        Verify user's email with the provided code.
        
        Args:
            email: User's email address
            code: 6-digit verification code
            
        Returns:
            Tuple of (User if successful else None, error_message if failed)
        """
        user = self.get_user_by_email(email)
        
        if not user:
            logger.warning(f"Verification attempt for non-existent email: {email[:3]}***")
            return None, "User not found"
        
        if user.is_verified:
            logger.info(f"User already verified: {email[:3]}***")
            return None, "Email already verified"
        
        # Check if code has expired
        if not user.verification_code_expires_at:
            logger.warning(f"No verification code set for user: {email[:3]}***")
            return None, "No verification code found. Please request a new code."
        
        if datetime.utcnow() > user.verification_code_expires_at:
            logger.warning(f"Expired verification code for: {email[:3]}***")
            return None, "Verification code expired"
        
        # Check if too many failed attempts (5 max)
        if user.verification_attempts >= 5:
            # Clear the code after 5 failed attempts - user must request new code
            user.verification_code = None
            user.verification_code_expires_at = None
            user.verification_attempts = 0
            self.db.commit()
            logger.warning(f"Too many failed attempts, code cleared for: {email[:3]}***")
            return None, "Too many failed attempts. Please request a new code."
        
        # Verify the code
        if user.verification_code != code:
            user.verification_attempts += 1
            self.db.commit()
            remaining = 5 - user.verification_attempts
            logger.warning(
                f"Invalid verification code for {email[:3]}***, "
                f"attempts: {user.verification_attempts}/5"
            )
            return None, f"Invalid verification code. {remaining} attempts remaining."
        
        # Success! Mark as verified and clear code
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires_at = None
        user.verification_attempts = 0
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"Email verified successfully: {email[:3]}***")
        
        return user, ""
    
    def resend_verification_code(self, email: str) -> Tuple[Optional[User], str]:
        """
        Generate and set a new verification code for the user.
        
        Args:
            email: User's email address
            
        Returns:
            Tuple of (User if successful else None, error_message if failed)
        """
        user = self.get_user_by_email(email)
        
        if not user:
            logger.warning(f"Resend code attempt for non-existent email: {email[:3]}***")
            return None, "User not found"
        
        if user.is_verified:
            logger.info(f"Resend code for already verified user: {email[:3]}***")
            return None, "Email already verified"
        
        # Generate new code
        verification_code = generate_verification_code()
        code_expires_at = datetime.utcnow() + timedelta(
            minutes=settings.VERIFICATION_CODE_EXPIRE_MINUTES
        )
        
        user.verification_code = verification_code
        user.verification_code_expires_at = code_expires_at
        user.verification_attempts = 0  # Reset attempts on new code
        user.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(user)
        
        logger.info(f"New verification code generated for: {email[:3]}***")
        
        return user, ""
    
    # =========================================================================
    # Login
    # =========================================================================
    
    def authenticate_user(
        self, 
        email: str, 
        password: str
    ) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Returns:
            User if credentials valid, None otherwise
        """
        user = self.get_user_by_email(email)
        
        if not user:
            # Use constant-time comparison to prevent timing attacks
            hash_password("dummy_password_for_timing")
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        return user
    
    def login(
        self, 
        email: str, 
        password: str
    ) -> Tuple[Optional[User], Optional[TokenResponse], str]:
        """
        Login user and return tokens.
        
        Args:
            email: User's email
            password: User's password
            
        Returns:
            Tuple of (user, tokens, error_code)
            - If successful: (user, tokens, "")
            - If invalid credentials: (None, None, "INVALID_CREDENTIALS")
            - If email not verified: (user, None, "EMAIL_NOT_VERIFIED")
        """
        user = self.authenticate_user(email, password)
        
        if not user:
            return None, None, "INVALID_CREDENTIALS"
        
        # Check if email is verified
        if not user.is_verified:
            logger.warning(f"Login attempt by unverified user: {email[:3]}***")
            return user, None, "EMAIL_NOT_VERIFIED"
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        self.db.commit()
        
        # Generate tokens
        tokens = self._create_tokens(user.id)
        
        return user, tokens, ""
    
    # =========================================================================
    # Token Operations
    # =========================================================================
    
    def _create_tokens(self, user_id: str) -> TokenResponse:
        """Create access and refresh tokens for a user."""
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            refresh_expires_in=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
    
    def refresh_tokens(self, refresh_token: str) -> Optional[TokenResponse]:
        """
        Refresh access token using a valid refresh token.
        
        Args:
            refresh_token: The refresh token
            
        Returns:
            New TokenResponse if valid, None otherwise
        """
        payload = decode_token(refresh_token)
        
        if not payload:
            return None
        
        # Verify it's a refresh token
        if payload.get("type") != "refresh":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        # Verify user still exists and is active
        user = self.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None
        
        # Create new tokens
        return self._create_tokens(user_id)
    
    def validate_access_token(self, token: str) -> Optional[User]:
        """
        Validate an access token and return the user.
        
        Args:
            token: The access token
            
        Returns:
            User if valid, None otherwise
        """
        payload = decode_token(token)
        
        if not payload:
            return None
        
        if payload.get("type") != "access":
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        user = self.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None
        
        return user
    
    # =========================================================================
    # Password Reset (Placeholder)
    # =========================================================================
    
    def request_password_reset(self, email: str) -> bool:
        """
        Request a password reset.
        
        In a real implementation, this would:
        1. Generate a reset token
        2. Store it with expiration
        3. Send an email with reset link
        
        Returns:
            True (always, to prevent email enumeration)
        """
        user = self.get_user_by_email(email)
        
        if user:
            # TODO: Generate reset token and send email
            # For now, just log that a request was made
            pass
        
        # Always return True to prevent email enumeration
        return True
    
    def reset_password(self, token: str, new_password: str) -> bool:
        """
        Reset password using a reset token.
        
        Returns:
            True if successful, False otherwise
        """
        # TODO: Implement token validation and password reset
        # For now, just return False as not implemented
        return False
    
    # =========================================================================
    # Account Management
    # =========================================================================
    
    def change_password(
        self, 
        user: User, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """
        Change user's password.
        
        Args:
            user: The user
            current_password: Current password for verification
            new_password: New password
            
        Returns:
            True if successful, False if current password is wrong
        """
        if not verify_password(current_password, user.password_hash):
            return False
        
        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    def deactivate_account(self, user: User) -> None:
        """Deactivate a user account."""
        user.is_active = False
        user.updated_at = datetime.utcnow()
        self.db.commit()

