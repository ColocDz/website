import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export async function GET() {
  const sessionData = await getSession();
  return NextResponse.json(sessionData || null);
}
