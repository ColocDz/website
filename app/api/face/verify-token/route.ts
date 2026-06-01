import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';

// In-memory store for verification tokens (in production, use Redis)
// Map<token, { userId, status, descriptor?, faceImage?, expiresAt }>
const verificationTokens = new Map<string, {
  userId: string;
  status: 'pending' | 'verified' | 'failed';
  descriptor?: number[];
  faceImage?: string;
  expiresAt: number;
}>();

// Cleanup expired tokens periodically
function cleanupExpired() {
  const now = Date.now();
  for (const [token, data] of verificationTokens) {
    if (data.expiresAt < now) {
      verificationTokens.delete(token);
    }
  }
}

/**
 * POST /api/face/verify-token — Generate a new verification token (desktop initiates)
 * GET  /api/face/verify-token?token=xxx — Check token status (desktop polls)
 * PUT  /api/face/verify-token — Complete verification from mobile
 */

// Generate a new token
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    cleanupExpired();

    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    verificationTokens.set(token, {
      userId: session.user.id,
      status: 'pending',
      expiresAt,
    });

    return NextResponse.json({ token, expiresAt });
  } catch (error) {
    console.error('Error creating verify token:', error);
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
  }
}

// Poll token status (desktop)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    cleanupExpired();

    const data = verificationTokens.get(token);
    if (!data) {
      return NextResponse.json({ error: 'Token expired or not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: data.status,
      faceImage: data.status === 'verified' ? data.faceImage : undefined,
      descriptor: data.status === 'verified' ? data.descriptor : undefined,
    });
  } catch (error) {
    console.error('Error checking verify token:', error);
    return NextResponse.json({ error: 'Failed to check token' }, { status: 500 });
  }
}

// Complete verification from mobile
export async function PUT(request: NextRequest) {
  try {
    const { token, descriptor, faceImage } = await request.json();

    if (!token || !descriptor || !faceImage) {
      return NextResponse.json({ error: 'Token, descriptor, and faceImage required' }, { status: 400 });
    }

    cleanupExpired();

    const data = verificationTokens.get(token);
    if (!data) {
      return NextResponse.json({ error: 'Token expired or not found' }, { status: 404 });
    }

    if (data.status !== 'pending') {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 });
    }

    // Check for duplicate face
    const usersWithDescriptors = await prisma.user.findMany({
      where: {
        faceDescriptor: { isEmpty: false },
        id: { not: data.userId },
        isArchived: false,
      },
      select: { id: true, name: true, lastName: true, faceDescriptor: true },
    });

    function euclideanDistance(a: number[], b: number[]): number {
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    }

    for (const user of usersWithDescriptors) {
      if (user.faceDescriptor.length !== 128) continue;
      const dist = euclideanDistance(descriptor, user.faceDescriptor);
      if (dist < 0.5) {
        data.status = 'failed';
        verificationTokens.set(token, data);
        return NextResponse.json({
          error: `This face matches an existing account (${user.name} ${user.lastName || ''}). Duplicate profiles are not permitted.`,
          duplicate: true,
        }, { status: 400 });
      }
    }

    // Mark token as verified
    data.status = 'verified';
    data.descriptor = descriptor;
    data.faceImage = faceImage;
    verificationTokens.set(token, data);

    // Update user in database
    await prisma.user.update({
      where: { id: data.userId },
      data: {
        faceVerified: true,
        faceImage,
        faceDescriptor: descriptor,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing verification:', error);
    return NextResponse.json({ error: 'Failed to complete verification' }, { status: 500 });
  }
}
