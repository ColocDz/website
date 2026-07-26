import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Sliding window rate limiter map (IP -> { count, startTime })
const rateLimitMap = new Map<string, { count: number; startTime: number }>();
const WINDOW_MS = 10 * 1000; // 10 seconds window
const MAX_REQUESTS = 30;     // Max 30 requests per 10s window per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.startTime > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return false;
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    return true;
  }
  return false;
}

// Cleanup stale entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (now - record.startTime > WINDOW_MS) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

/**
 * Next.js 16 proxy.
 * Includes sliding-window rate limiting & Better Auth protected routes.
 */
export function proxy(request: NextRequest) {
  // Extract client IP address
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Application rate limit check
  if (isRateLimited(ip)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a few seconds before retrying.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '10',
        },
      }
    );
  }

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
