/**
 * Authentication Types for AviLingo
 */

// User type matching backend UserResponse
export interface User {
  id: string;
  email: string;
  display_name: string;
  native_language: string | null;
  avatar_url: string | null;
  current_icao_level: number | null;
  target_icao_level: number;
  predicted_icao_level: number | null;
  test_date: string | null;
  test_location: string | null;
  days_until_test: number | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  daily_goal_minutes: number;
  reminder_enabled: boolean;
  reminder_time: string | null;
  preferred_difficulty: number;
  total_xp: number;
  total_practice_minutes: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at: string | null;
  last_practice_at: string | null;
}

// Alias for compatibility
export type FullUser = User;

// Simplified user for display purposes
export interface UserDisplay {
  id: string;
  email: string;
  full_name: string; // Maps to display_name
  avatar_url: string | null;
  target_icao_level: number;
}

// Token response from backend
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
}

// Token response with user data
export interface TokenWithUser extends TokenResponse {
  user: User;
}

// Login request
export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

// Register request (matches backend RegisterRequest)
export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
  native_language?: string;
  target_icao_level?: number;
  test_date?: string;
}

// Alias for frontend form usage
export interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
  nativeLanguage?: string;
  targetIcaoLevel?: number;
}

// Forgot password request
export interface ForgotPasswordRequest {
  email: string;
}

// Register response (email verification required)
export interface RegisterResponse {
  message: string;
  email: string;
}

// Verify email request
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// Resend code request
export interface ResendCodeRequest {
  email: string;
}

// Email not verified error detail
export interface EmailNotVerifiedError {
  message: string;
  code: 'EMAIL_NOT_VERIFIED';
  email: string;
}

// Auth context state
export interface AuthState {
  user: UserDisplay | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// Auth context type
export interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
}

