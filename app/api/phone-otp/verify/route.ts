import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// POST /api/phone-otp/verify
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code) {
      return NextResponse.json({ error: 'OTP code is required' }, { status: 400 });
    }

    const freshUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!freshUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!freshUser.phoneOtp || !freshUser.phoneOtpExpiry) {
      return NextResponse.json({ error: 'No OTP was requested. Please request a new code.' }, { status: 400 });
    }

    if (new Date() > freshUser.phoneOtpExpiry) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { phoneOtp: null, phoneOtpExpiry: null }
      });
      return NextResponse.json({ error: 'OTP has expired. Please request a new code.' }, { status: 400 });
    }

    if (freshUser.phoneOtp !== code.trim()) {
      return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
    }

    // Mark phone as verified, clear OTP
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneVerified: true,
        phoneOtp: null,
        phoneOtpExpiry: null,
      }
    });

    return NextResponse.json({ success: true, message: 'Phone number verified successfully!' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 });
  }
}
