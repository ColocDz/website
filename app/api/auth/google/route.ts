import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'colocdz.com';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  // Redirect legacy /api/auth/google directly to Better Auth's unified social provider endpoint
  return NextResponse.redirect(`${baseUrl}/api/auth/sign-in/social?provider=google&callbackURL=/`);
}
