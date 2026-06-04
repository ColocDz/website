import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 proxy (replaces middleware.ts).
 * Protects routes that require authentication by checking for
 * the Better Auth session cookie.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes that require login
  const protectedPaths = ['/profile', '/messages', '/adding-post', '/settings'];
  const isProtectedRoute = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Check for Better Auth session cookie
  const sessionToken =
    request.cookies.get('better-auth.session_token')?.value ||
    request.cookies.get('__secure-better-auth.session_token')?.value ||
    request.cookies.get('__Secure-better-auth.session_token')?.value;
  const isAuthenticated = !!sessionToken;

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup
  if ((pathname === '/login' || pathname === '/signup') && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (API handlers)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
