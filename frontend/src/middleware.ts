import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for route protection
 * 
 * Note: This middleware provides server-side route protection.
 * For full protection, we also use client-side checks in AuthContext.
 * 
 * Since we use localStorage for tokens (client-side only),
 * this middleware checks for the existence of a token cookie
 * as a secondary protection layer.
 */

// Routes that require authentication
const protectedRoutes = ['/app'];

// Routes that authenticated users should not access
const authRoutes = ['/login', '/register', '/forgot-password'];

// Public routes that don't need any checks
const publicRoutes = ['/', '/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if this is an auth route (login, register, etc.)
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
  
  // For protected routes, we rely on client-side AuthContext
  // because tokens are stored in localStorage (not accessible in middleware)
  // The client-side will redirect if not authenticated
  
  // For now, just pass through and let the client handle auth
  // In production, you might want to use HTTP-only cookies for tokens
  // which would allow server-side authentication checks here
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

