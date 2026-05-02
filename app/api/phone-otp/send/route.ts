import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// POST /api/phone-otp/send
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phoneNumber } = await request.json();
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phoneOtp: code,
        phoneOtpExpiry: expiry,
        phone: phoneNumber.replace('+213', ''),
      }
    });

    // DEV MODE: log to terminal
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n');
      console.log('╔══════════════════════════════════════╗');
      console.log('║       🔐  DEV MODE OTP CODE          ║');
      console.log(`║   Phone  : ${phoneNumber.padEnd(26)}║`);
      console.log(`║   Code   : ${code.padEnd(26)}║`);
      console.log('╚══════════════════════════════════════╝');
      console.log('\n');
      return NextResponse.json({ success: true, dev: true });
    }

    // PRODUCTION: send real SMS via Twilio
    const twilio = (await import('twilio')).default;
    const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await twilioClient.messages.create({
      body: `Your ColocDZ verification code is: ${code}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
