import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { code } = body;

    if (!code || typeof code !== 'string' || code.trim().length !== 6) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit verification code.' }, { status: 400 });
    }

    const cleanCode = code.trim();

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Check max failed attempt lockout (Max 5 attempts)
    if (user.phoneOtpAttempts >= 5) {
      // Invalidate OTP
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          phoneOtpHash: null,
          phoneOtpExpires: null,
          phoneOtpAttempts: 0
        }
      });
      return NextResponse.json(
        { error: 'Too many incorrect attempts (5/5). Your verification code has been invalidated. Please request a fresh SMS code.' },
        { status: 400 }
      );
    }

    // 2. Check Expiry or missing OTP
    const now = new Date();
    if (!user.phoneOtpHash || !user.phoneOtpExpires || now > new Date(user.phoneOtpExpires)) {
      return NextResponse.json(
        { error: 'Verification code has expired or is invalid. Please request a new SMS code.' },
        { status: 400 }
      );
    }

    // 3. Compare SHA-256 Hash
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    if (inputHash !== user.phoneOtpHash) {
      const newAttempts = (user.phoneOtpAttempts || 0) + 1;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phoneOtpAttempts: newAttempts }
      });

      const remainingAttempts = 5 - newAttempts;
      if (remainingAttempts <= 0) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            phoneOtpHash: null,
            phoneOtpExpires: null,
            phoneOtpAttempts: 0
          }
        });
        return NextResponse.json(
          { error: 'Too many incorrect attempts. Your code has been invalidated. Please request a fresh SMS code.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Incorrect verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.` },
        { status: 400 }
      );
    }

    // 4. Success! Mark Phone as Verified
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: now,
        phoneOtpHash: null,
        phoneOtpExpires: null,
        phoneOtpAttempts: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully! ✓'
    });

  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify code' }, { status: 500 });
  }
}
