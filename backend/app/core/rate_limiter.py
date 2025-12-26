"""
Rate Limiting

Simple in-memory rate limiter for protecting sensitive endpoints.
For production, use Redis-based rate limiting.
"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import HTTPException, Request, status
import asyncio


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    
    For production, replace with Redis-based implementation.
    """
    
    def __init__(self):
        # Store: {key: [(timestamp, count), ...]}
        self._requests: Dict[str, List[float]] = defaultdict(list)
        self._lock = asyncio.Lock()
    
    async def is_rate_limited(
        self, 
        key: str, 
        max_requests: int, 
        window_seconds: int
    ) -> Tuple[bool, int]:
        """
        Check if a key is rate limited.
        
        Args:
            key: Identifier (e.g., IP address, user ID)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            
        Returns:
            Tuple of (is_limited, remaining_requests)
        """
        async with self._lock:
            now = time.time()
            window_start = now - window_seconds
            
            # Get requests for this key
            requests = self._requests[key]
            
            # Remove old requests outside the window
            requests = [ts for ts in requests if ts > window_start]
            self._requests[key] = requests
            
            # Check if over limit
            current_count = len(requests)
            remaining = max(0, max_requests - current_count)
            
            if current_count >= max_requests:
                return True, 0
            
            # Add current request
            self._requests[key].append(now)
            return False, remaining - 1
    
    async def get_retry_after(
        self, 
        key: str, 
        window_seconds: int
    ) -> int:
        """Get seconds until rate limit resets."""
        async with self._lock:
            requests = self._requests.get(key, [])
            if not requests:
                return 0
            
            oldest = min(requests)
            retry_after = int(oldest + window_seconds - time.time())
            return max(0, retry_after)
    
    def cleanup(self, max_age_seconds: int = 3600):
        """Remove old entries to prevent memory leaks."""
        now = time.time()
        cutoff = now - max_age_seconds
        
        keys_to_remove = []
        for key, requests in self._requests.items():
            # Remove old timestamps
            self._requests[key] = [ts for ts in requests if ts > cutoff]
            # Mark empty keys for removal
            if not self._requests[key]:
                keys_to_remove.append(key)
        
        for key in keys_to_remove:
            del self._requests[key]


# Global rate limiter instance
rate_limiter = RateLimiter()


# =============================================================================
# Rate Limit Configurations
# =============================================================================

class RateLimitConfig:
    """Rate limit configurations for different endpoints."""
    
    # Login: 5 attempts per minute per IP
    LOGIN_MAX_REQUESTS = 5
    LOGIN_WINDOW_SECONDS = 60
    
    # Registration: 3 per minute per IP
    REGISTER_MAX_REQUESTS = 3
    REGISTER_WINDOW_SECONDS = 60
    
    # Password reset: 3 per minute per email
    PASSWORD_RESET_MAX_REQUESTS = 3
    PASSWORD_RESET_WINDOW_SECONDS = 60
    
    # Token refresh: 10 per minute
    REFRESH_MAX_REQUESTS = 10
    REFRESH_WINDOW_SECONDS = 60


# =============================================================================
# Helper Functions
# =============================================================================

def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    # Check for forwarded header (behind proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # Take the first IP in the chain (original client)
        return forwarded.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    if request.client:
        return request.client.host
    
    return "unknown"


async def check_rate_limit(
    request: Request,
    prefix: str,
    max_requests: int,
    window_seconds: int
) -> None:
    """
    Check rate limit and raise HTTPException if exceeded.
    
    Args:
        request: FastAPI request object
        prefix: Prefix for rate limit key (e.g., "login", "register")
        max_requests: Maximum requests allowed
        window_seconds: Time window in seconds
    
    Raises:
        HTTPException: 429 Too Many Requests if rate limited
    """
    client_ip = get_client_ip(request)
    key = f"{prefix}:{client_ip}"
    
    is_limited, remaining = await rate_limiter.is_rate_limited(
        key, max_requests, window_seconds
    )
    
    if is_limited:
        retry_after = await rate_limiter.get_retry_after(key, window_seconds)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many requests. Please try again in {retry_after} seconds.",
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(max_requests),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time()) + retry_after)
            }
        )


async def check_login_rate_limit(request: Request) -> None:
    """Check login rate limit: 5 attempts per minute per IP."""
    await check_rate_limit(
        request,
        "login",
        RateLimitConfig.LOGIN_MAX_REQUESTS,
        RateLimitConfig.LOGIN_WINDOW_SECONDS
    )


async def check_register_rate_limit(request: Request) -> None:
    """Check registration rate limit: 3 per minute per IP."""
    await check_rate_limit(
        request,
        "register",
        RateLimitConfig.REGISTER_MAX_REQUESTS,
        RateLimitConfig.REGISTER_WINDOW_SECONDS
    )


async def check_password_reset_rate_limit(request: Request, email: str) -> None:
    """Check password reset rate limit: 3 per minute per email."""
    key = f"password_reset:{email.lower()}"
    
    is_limited, _ = await rate_limiter.is_rate_limited(
        key,
        RateLimitConfig.PASSWORD_RESET_MAX_REQUESTS,
        RateLimitConfig.PASSWORD_RESET_WINDOW_SECONDS
    )
    
    if is_limited:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please try again later."
        )

