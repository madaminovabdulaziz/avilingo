/**
 * Authentication API Functions
 * 
 * Handles all auth-related API calls and token management.
 */

import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  TokenWithUser,
  TokenResponse,
  User,
  UserDisplay,
} from '@/types/auth';

// API base URL - defaults to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Token storage keys
const ACCESS_TOKEN_KEY = 'avilingo_access_token';
const REFRESH_TOKEN_KEY = 'avilingo_refresh_token';
const TOKEN_EXPIRY_KEY = 'avilingo_token_expiry';

// =============================================================================
// Token Storage
// =============================================================================

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTokenExpiry(): number | null {
  if (typeof window === 'undefined') return null;
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  return expiry ? parseInt(expiry, 10) : null;
}

export function setTokens(tokens: TokenResponse): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
  
  // Store expiry time (current time + expires_in seconds)
  const expiryTime = Date.now() + tokens.expires_in * 1000;
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return true;
  
  // Consider expired 60 seconds before actual expiry
  return Date.now() > expiry - 60000;
}

export function shouldRefreshToken(): boolean {
  const expiry = getTokenExpiry();
  if (!expiry) return false;
  
  // Refresh when less than 5 minutes remaining
  return Date.now() > expiry - 5 * 60 * 1000;
}

// =============================================================================
// API Helpers
// =============================================================================

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    let message = 'An error occurred';
    try {
      const error = await response.json();
      message = error.detail || error.message || message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(response.status, message);
  }
  
  // Handle empty responses
  const text = await response.text();
  if (!text) return {} as T;
  
  return JSON.parse(text) as T;
}

async function authenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  
  if (!token) {
    throw new ApiError(401, 'No access token');
  }
  
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
}

// =============================================================================
// Auth API Functions
// =============================================================================

/**
 * Login with email and password
 */
export async function loginApi(data: LoginRequest): Promise<TokenWithUser> {
  const response = await apiRequest<TokenWithUser>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  setTokens(response);
  return response;
}

/**
 * Register a new account
 * Returns a message indicating verification code was sent
 */
export async function registerApi(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiRequest<RegisterResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  // No tokens returned - user needs to verify email first
  return response;
}

/**
 * Verify email with 6-digit code
 * Returns tokens and user data on success
 */
export async function verifyEmailApi(data: VerifyEmailRequest): Promise<TokenWithUser> {
  const response = await apiRequest<TokenWithUser>('/api/v1/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  setTokens(response);
  return response;
}

/**
 * Resend verification code
 */
export async function resendCodeApi(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/api/v1/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshTokenApi(): Promise<TokenResponse | null> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }
  
  try {
    const response = await apiRequest<TokenResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    setTokens(response);
    return response;
  } catch (error) {
    // Clear tokens on refresh failure
    clearTokens();
    return null;
  }
}

/**
 * Logout - clear tokens and optionally notify server
 */
export async function logoutApi(): Promise<void> {
  const token = getAccessToken();
  
  // Try to notify server (non-blocking)
  if (token) {
    try {
      await authenticatedRequest('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Ignore errors - we're logging out anyway
    }
  }
  
  clearTokens();
}

/**
 * Request password reset
 */
export async function forgotPasswordApi(email: string): Promise<void> {
  await apiRequest('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email } as ForgotPasswordRequest),
  });
}

/**
 * Get current user profile
 */
export async function getCurrentUserApi(): Promise<User> {
  return authenticatedRequest<User>('/api/v1/auth/me');
}

/**
 * Verify token validity
 */
export async function verifyTokenApi(): Promise<{ valid: boolean; user_id: string }> {
  return authenticatedRequest('/api/v1/auth/verify-token', {
    method: 'POST',
  });
}

// =============================================================================
// User Helpers
// =============================================================================

/**
 * Convert full User to UserDisplay
 */
export function toUserDisplay(user: User): UserDisplay {
  return {
    id: user.id,
    email: user.email,
    full_name: user.display_name,
    avatar_url: user.avatar_url,
    target_icao_level: user.target_icao_level,
  };
}

// =============================================================================
// Token Refresh Logic
// =============================================================================

let refreshPromise: Promise<TokenResponse | null> | null = null;

/**
 * Refresh token with deduplication
 * Multiple calls while a refresh is in progress will share the same promise
 */
export async function refreshTokenWithDedup(): Promise<TokenResponse | null> {
  if (refreshPromise) {
    return refreshPromise;
  }
  
  refreshPromise = refreshTokenApi().finally(() => {
    refreshPromise = null;
  });
  
  return refreshPromise;
}

/**
 * Setup automatic token refresh
 * Call this on app initialization
 */
export function setupAutoRefresh(): () => void {
  let intervalId: NodeJS.Timeout | null = null;
  
  const checkAndRefresh = async () => {
    if (shouldRefreshToken() && getRefreshToken()) {
      await refreshTokenWithDedup();
    }
  };
  
  // Check every minute
  intervalId = setInterval(checkAndRefresh, 60 * 1000);
  
  // Initial check
  checkAndRefresh();
  
  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
}

