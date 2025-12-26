'use client';

/**
 * Authentication Context and Provider
 * 
 * Manages user authentication state across the application.
 * Handles login, register, logout, and automatic token refresh.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FullPageLoading } from '@/components/ui/query-states';
import type {
  AuthContextType,
  LoginRequest,
  RegisterRequest,
  UserDisplay,
} from '@/types/auth';
import {
  loginApi,
  registerApi,
  logoutApi,
  getCurrentUserApi,
  refreshTokenWithDedup,
  getAccessToken,
  isTokenExpired,
  clearTokens,
  toUserDisplay,
  setupAutoRefresh,
} from '@/lib/auth';

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider
// =============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<UserDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAuthenticated = useMemo(() => !!user, [user]);
  
  // Routes that don't require authentication
  const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname?.startsWith(route + '/'));
  
  // Routes that authenticated users should be redirected away from
  const authRoutes = ['/login', '/register', '/forgot-password'];
  const isAuthRoute = authRoutes.some(route => pathname === route);
  
  // =========================================================================
  // Initialize Auth State
  // =========================================================================
  
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const token = getAccessToken();
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      
      // Check if token is expired and try to refresh
      if (isTokenExpired()) {
        const refreshResult = await refreshTokenWithDedup();
        if (!refreshResult) {
          setUser(null);
          setIsLoading(false);
          return;
        }
      }
      
      // Fetch current user
      const userData = await getCurrentUserApi();
      setUser(toUserDisplay(userData));
    } catch (err) {
      console.error('Auth initialization error:', err);
      clearTokens();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // =========================================================================
  // Auto-refresh Token
  // =========================================================================
  
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const cleanup = setupAutoRefresh();
    return cleanup;
  }, [isAuthenticated]);
  
  // =========================================================================
  // Route Protection
  // =========================================================================
  
  useEffect(() => {
    if (isLoading) return;
    
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute) {
      router.replace('/app/dashboard');
      return;
    }
    
    // Redirect unauthenticated users to login (for protected routes)
    if (!isAuthenticated && !isPublicRoute) {
      // Store intended destination for redirect after login
      if (pathname && pathname !== '/login') {
        sessionStorage.setItem('auth_redirect', pathname);
      }
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isAuthRoute, isPublicRoute, pathname, router]);
  
  // =========================================================================
  // Auth Actions
  // =========================================================================
  
  const login = useCallback(async (data: LoginRequest) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await loginApi(data);
      setUser(toUserDisplay(response.user));
      
      // Redirect to stored destination or dashboard
      const redirect = sessionStorage.getItem('auth_redirect');
      sessionStorage.removeItem('auth_redirect');
      router.replace(redirect || '/app/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  
  const register = useCallback(async (data: RegisterRequest) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await registerApi(data);
      setUser(toUserDisplay(response.user));
      router.replace('/app/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  
  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
      router.replace('/login');
    }
  }, [router]);
  
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const result = await refreshTokenWithDedup();
      return !!result;
    } catch {
      return false;
    }
  }, []);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // =========================================================================
  // Context Value
  // =========================================================================
  
  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      error,
      login,
      register,
      logout,
      refreshToken,
      clearError,
    }),
    [user, isLoading, isAuthenticated, error, login, register, logout, refreshToken, clearError]
  );
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// =============================================================================
// Higher-Order Component (optional)
// =============================================================================

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P> {
  return function WithAuthComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return <FullPageLoading message="Authenticating..." />;
    }
    
    if (!isAuthenticated) {
      return null; // Router will redirect
    }
    
    return <WrappedComponent {...props} />;
  };
}

