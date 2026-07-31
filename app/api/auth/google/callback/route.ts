import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'colocdz.com';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  // Forward legacy callback to home page as Better Auth handles standard callback at /api/auth/callback/google
  return NextResponse.redirect(`${baseUrl}/`);
}
