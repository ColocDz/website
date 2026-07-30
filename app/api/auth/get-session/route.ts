import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionData = await getSession();
    return NextResponse.json(sessionData || null);
  } catch (e: any) {
    return NextResponse.json(null);
  }
}
