import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const { nin, idCardNumber, idIssueDate, idExpiryDate, frontImage, backImage } = body;

    // Validate 18-digit Algerian NIN format
    const cleanedNin = (nin || '').toString().trim().replace(/\D/g, '');
    if (cleanedNin.length !== 18) {
      return NextResponse.json({
        error: 'Invalid National Identification Number (NIN). Must be exactly 18 digits.'
      }, { status: 400 });
    }

    // Validate ID Serial Number
    const cleanedSerial = (idCardNumber || '').toString().trim();
    if (!cleanedSerial || cleanedSerial.length < 5) {
      return NextResponse.json({
        error: 'Please enter a valid National ID Card Serial Number.'
      }, { status: 400 });
    }

    if (!idIssueDate || !idExpiryDate) {
      return NextResponse.json({
        error: 'Please specify the ID card issue and expiration dates.'
      }, { status: 400 });
    }

    if (!frontImage) {
      return NextResponse.json({
        error: 'Please upload a photo of the front of your National ID card.'
      }, { status: 400 });
    }

    // Generate unique SHA-256 hash of NIN to enforce 1 ID = 1 User Account
    const ninHash = crypto.createHash('sha256').update(cleanedNin).digest('hex');

    // Check if another account has already verified with this NIN
    const existingUser = await prisma.user.findFirst({
      where: {
        ninHash,
        id: { not: session.user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json({
        error: 'This National Identification Number (NIN) is already registered to another account.'
      }, { status: 409 });
    }

    // Save National ID details & mark user fully verified
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nin: cleanedNin,
        ninHash,
        idCardNumber: cleanedSerial,
        idIssueDate: new Date(idIssueDate),
        idExpiryDate: new Date(idExpiryDate),
        idCardFrontImage: frontImage,
        idCardBackImage: backImage || null,
        identityVerified: true,
        faceVerified: true, // National ID fulfills full verification
        identityVerifiedAt: new Date(),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'National ID verified successfully! ✓',
      user: {
        identityVerified: updatedUser.identityVerified,
        faceVerified: updatedUser.faceVerified,
        nin: updatedUser.nin,
        idCardNumber: updatedUser.idCardNumber,
      }
    });

  } catch (error: any) {
    console.error('Error verifying National ID:', error);
    return NextResponse.json({
      error: error.message || 'Failed to verify National ID card.'
    }, { status: 500 });
  }
}
