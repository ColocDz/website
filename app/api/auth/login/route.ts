import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 400 });
    }

    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: 'credential' }
    });

    if (!account || !account.password) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 400 });
    }

    await createSession(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error?.message || 'Login failed' }, { status: 500 });
  }
}
