import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const authRes = await auth.api.signInEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
      }
    });

    return NextResponse.json(authRes);
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Incorrect email or password.' }, { status: 400 });
  }
}
