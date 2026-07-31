import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const authRes = await auth.api.signUpEmail({
      body: {
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
      }
    });

    return NextResponse.json(authRes);
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error?.message || 'Sign up failed' }, { status: 400 });
  }
}
