import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/intake', '/workouts', '/settings']
const authRoute = '/auth'

/**
 * Middleware for route protection
 * Note: Firebase auth tokens are stored client-side, so we rely on
 * AuthGuard components for actual authentication checks.
 * This middleware handles basic routing logic.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = pathname.startsWith(authRoute)
  
  // For protected routes, let the AuthGuard component handle authentication
  // The middleware just allows the request through
  // If accessing auth route, allow it (AuthGuard will redirect if already logged in)
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

