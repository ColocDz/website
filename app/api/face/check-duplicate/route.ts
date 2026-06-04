import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/face/check-duplicate
 * Body: { descriptor: number[] }   — the 128-value face descriptor
 *
 * Returns:
 *   { duplicate: false }
 *   { duplicate: true, matchUserId: string, distance: number }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = await rateLimit(`face-duplicate:${ip}`, 5, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many face verification attempts. Please try again in an hour.' },
        { status: 429 }
      );
    }

    const { descriptor } = await request.json();

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128 ||
        !descriptor.every(v => typeof v === 'number' && Number.isFinite(v))) {
      return NextResponse.json(
        { error: 'Invalid descriptor. Must be a 128-element finite number array.' },
        { status: 400 }
      );
    }

    // Fetch all stored descriptors (exclude the current user)
    const usersWithDescriptors = await prisma.user.findMany({
      where: {
        faceDescriptor: { isEmpty: false },
        id: { not: session.user.id },
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        faceDescriptor: true,
      },
    });

    // Compute Euclidean distance between two descriptors
    function euclideanDistance(a: number[], b: number[]): number {
      let sum = 0;
      for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    }

    const THRESHOLD = 0.5; // < 0.5 = same person (strict for anti-duplicate)

    let bestMatch: { userId: string; distance: number; name: string } | null = null;

    for (const user of usersWithDescriptors) {
      if (user.faceDescriptor.length !== 128) continue;

      const distance = euclideanDistance(descriptor, user.faceDescriptor);

      if (distance < THRESHOLD) {
        if (!bestMatch || distance < bestMatch.distance) {
          bestMatch = {
            userId: user.id,
            distance,
            name: `${user.name} ${user.lastName || ''}`.trim(),
          };
        }
      }
    }

    if (bestMatch) {
      return NextResponse.json({
        duplicate: true,
        matchUserId: bestMatch.userId,
        distance: bestMatch.distance,
        message: `This face matches an existing account (${bestMatch.name}). Duplicate profiles are not permitted.`,
      });
    }

    return NextResponse.json({ duplicate: false });
  } catch (error) {
    console.error('Error checking face duplicate:', error);
    return NextResponse.json(
      { error: 'Failed to check for duplicate faces' },
      { status: 500 }
    );
  }
}
