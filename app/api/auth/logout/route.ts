import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST() {
  await destroySession();
  const response = NextResponse.json({ success: true });
  response.cookies.set('better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('__Secure-better-auth.session_token', '', { path: '/', maxAge: 0, expires: new Date(0) });
  response.cookies.set('colocdz_session', '', { path: '/', maxAge: 0, expires: new Date(0) });
  return response;
}
