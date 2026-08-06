import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';

// In-memory per-IP rate limiting: IP -> array of timestamps
const ipSendHistory = new Map<string, number[]>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  const history = (ipSendHistory.get(ip) || []).filter(t => now - t < ONE_HOUR);
  
  if (history.length >= 10) {
    return false; // Exceeded 10 sends/hour per IP
  }
  
  history.push(now);
  ipSendHistory.set(ip, history);
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone || session.user.phone || '';

    // Clean phone number: keep digits only
    const digitsOnly = rawPhone.toString().replace(/\D/g, '');
    let cleanedPhone = digitsOnly;

    // Standardize 9-digit Algerian phone number (remove leading 0 if 10 digits e.g. 0558137964 -> 558137964)
    if (cleanedPhone.length === 10 && cleanedPhone.startsWith('0')) {
      cleanedPhone = cleanedPhone.substring(1);
    } else if (cleanedPhone.length === 12 && cleanedPhone.startsWith('213')) {
      cleanedPhone = cleanedPhone.substring(3);
    }

    if (!/^(5|6|7)\d{8}$/.test(cleanedPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 9-digit Algerian phone number (e.g. 550123456 or 0550123456).' },
        { status: 400 }
      );
    }

    // 1. Check Per-IP Rate Limit
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';

    if (!checkIpRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Too many requests from your IP address. Please try again in an hour.' },
        { status: 429 }
      );
    }

    // 2. Check Uniqueness: Ensure phone number is not already verified on another user account
    const existingVerifiedUser = await prisma.user.findFirst({
      where: {
        phone: cleanedPhone,
        phoneVerified: true,
        NOT: { id: session.user.id }
      }
    });

    if (existingVerifiedUser) {
      return NextResponse.json(
        { error: 'This phone number is already verified on another ColocDZ account.' },
        { status: 400 }
      );
    }

    // 3. Fetch Current User Data for Per-Phone Rate Limits
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();

    // Check 60-second Cooldown
    if (currentUser.lastOtpSentAt) {
      const secondsSinceLastSend = (now.getTime() - new Date(currentUser.lastOtpSentAt).getTime()) / 1000;
      if (secondsSinceLastSend < 60) {
        const remaining = Math.ceil(60 - secondsSinceLastSend);
        return NextResponse.json(
          { error: `Please wait ${remaining} seconds before requesting another SMS code.` },
          { status: 429 }
        );
      }
    }

    // Check 24-hour Daily Cap (Max 5 per day)
    let dailyCount = currentUser.dailyOtpCount || 0;
    let resetAt = currentUser.dailyOtpResetAt ? new Date(currentUser.dailyOtpResetAt) : null;

    if (!resetAt || now.getTime() - resetAt.getTime() > 24 * 60 * 60 * 1000) {
      dailyCount = 0;
      resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    if (dailyCount >= 5) {
      return NextResponse.json(
        { error: 'Daily SMS limit reached (5 per 24 hours). Please try again tomorrow.' },
        { status: 429 }
      );
    }

    // 4. Generate 6-digit OTP & Hash
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes

    // Update User state in DB
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        phone: cleanedPhone,
        phoneOtpHash: otpHash,
        phoneOtpExpires: expiresAt,
        phoneOtpAttempts: 0,
        lastOtpSentAt: now,
        dailyOtpCount: dailyCount + 1,
        dailyOtpResetAt: resetAt
      }
    });

    // 5. Send SMS via Mobile Text Alerts API
    const formattedInternationalPhoneNoPlus = `213${cleanedPhone}`;
    const formattedInternationalPhoneWithPlus = `+213${cleanedPhone}`;
    const mtaApiKey = process.env.MOBILE_TEXT_ALERTS_API_KEY || '421cf632-67e8-537c-abcd-b4c0db54b4ed';

    let gatewaySuccess = false;
    let gatewayErrorMessage: string | null = null;

    try {
      console.log(`[Phone OTP] Dispatching SMS OTP to ${formattedInternationalPhoneWithPlus} via Mobile Text Alerts...`);
      
      const smsRes = await fetch('https://api.mobile-text-alerts.com/v3/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mtaApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscribers: [formattedInternationalPhoneWithPlus, formattedInternationalPhoneNoPlus],
          message: `Your ColocDZ verification code is: ${otpCode}. Valid for 10 minutes.`
        })
      });

      const smsData = await smsRes.json().catch(() => ({}));
      console.log(`[Phone OTP] Mobile Text Alerts HTTP Status ${smsRes.status}:`, JSON.stringify(smsData, null, 2));

      if (smsRes.ok) {
        gatewaySuccess = true;
      } else {
        gatewayErrorMessage = smsData.message || smsData.error || smsData.type || `Gateway returned HTTP ${smsRes.status}`;
        console.error(`[Phone OTP Gateway Error] HTTP ${smsRes.status}: ${gatewayErrorMessage}`);
      }
    } catch (smsErr: any) {
      gatewayErrorMessage = smsErr?.message || 'Network error connecting to SMS gateway';
      console.error('[Phone OTP Network Error] Failed to connect to SMS gateway:', smsErr);
    }

    return NextResponse.json({
      success: true,
      gatewaySent: gatewaySuccess,
      gatewayError: gatewayErrorMessage || undefined,
      message: gatewaySuccess
        ? `Verification code sent to +213 ${cleanedPhone.substring(0, 3)} ${cleanedPhone.substring(3, 6)} ${cleanedPhone.substring(6)}`
        : `OTP generated for +213 ${cleanedPhone.substring(0, 3)} ${cleanedPhone.substring(3, 6)} ${cleanedPhone.substring(6)} (Gateway Notice: ${gatewayErrorMessage})`,
      // For development/testing: surface debugCode if gateway SMS is blocked by provider trial/account state
      debugCode: (process.env.NODE_ENV === 'development' || !gatewaySuccess) ? otpCode : undefined
    });

  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS OTP' }, { status: 500 });
  }
}
