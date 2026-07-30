import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth-server';

export async function POST() {
  await destroySession();
  const response = NextResponse.json({ success: true });
  response.cookies.set('colocdz_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
