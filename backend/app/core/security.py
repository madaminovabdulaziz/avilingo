"""
Security Utilities

- Password hashing with bcrypt
- JWT token creation and verification
- Authentication dependencies
"""

from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings

# =============================================================================
# Password Hashing (bcrypt)
# =============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


# =============================================================================
# JWT Tokens (HS256)
# =============================================================================

def create_access_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None,
    additional_claims: Optional[dict] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: Usually the user ID
        expires_delta: Optional custom expiration time (default: 60 minutes)
        additional_claims: Optional additional JWT claims
    
    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    }
    
    if additional_claims:
        to_encode.update(additional_claims)
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM  # HS256
    )
    return encoded_jwt


def create_refresh_token(
    subject: str | Any,
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Refresh tokens have longer expiration (default: 30 days) and are used 
    to get new access tokens.
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode = {
        "sub": str(subject),
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token.
    
    Returns:
        Token payload if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def get_token_expiry(token: str) -> Optional[datetime]:
    """Get the expiration datetime of a token."""
    payload = decode_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"])
    return None


# =============================================================================
# Authentication Dependencies
# =============================================================================

# Bearer token scheme
security_scheme = HTTPBearer(auto_error=True)
optional_security_scheme = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> str:
    """
    Dependency to get the current authenticated user ID from JWT token.
    
    Usage:
        @router.get("/me")
        async def get_me(user_id: str = Depends(get_current_user_id)):
            ...
    
    Raises:
        HTTPException: 401 if token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Please use an access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    return user_id


async def get_optional_user_id(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security_scheme)
) -> Optional[str]:
    """
    Dependency to optionally get user ID.
    
    Returns None if not authenticated instead of raising an exception.
    Useful for endpoints that work for both authenticated and anonymous users.
    """
    if credentials is None:
        return None
    
    payload = decode_token(credentials.credentials)
    if payload is None or payload.get("type") != "access":
        return None
    
    return payload.get("sub")


# =============================================================================
# Full User Dependencies (with database)
# =============================================================================

def get_current_user(db_session_getter):
    """
    Factory for creating a dependency that returns the full User object.
    
    Usage:
        from app.db.session import get_db
        
        @router.get("/me")
        async def get_me(
            user: User = Depends(get_current_user(get_db))
        ):
            ...
    """
    from app.models.user import User
    
    async def _get_current_user(
        user_id: str = Depends(get_current_user_id),
        db: Session = Depends(db_session_getter)
    ) -> "User":
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
    
    return _get_current_user


def get_current_active_user(db_session_getter):
    """
    Factory for dependency that returns an active user.
    
    Same as get_current_user but explicitly named for clarity.
    """
    return get_current_user(db_session_getter)


def get_current_verified_user(db_session_getter):
    """
    Factory for dependency that requires a verified user.
    
    Raises 403 if user is not verified.
    """
    from app.models.user import User
    
    async def _get_current_verified_user(
        user_id: str = Depends(get_current_user_id),
        db: Session = Depends(db_session_getter)
    ) -> "User":
        user = db.get(User, user_id)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated",
            )
        
        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email verification required",
            )
        
        return user
    
    return _get_current_verified_user


def get_current_premium_user(db_session_getter):
    """
    Factory for dependency that requires a premium user.
    
    Raises 403 if user is not on premium tier.
    """
    from app.models.user import User, SubscriptionTier
    
    async def _get_current_premium_user(
        user_id: str = Depends(get_current_user_id),
        db: Session = Depends(db_session_getter)
    ) -> "User":
        user = db.get(User, user_id)
        
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated",
            )
        
        if user.subscription_tier == SubscriptionTier.FREE:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Premium subscription required",
            )
        
        return user
    
    return _get_current_premium_user
