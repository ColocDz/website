import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (targetUserId) {
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          lastName: true,
          image: true,
          email: true,
          gender: true,
          bio: true,
          wilaya: true,
          city: true,
          isPrivate: true,
          faceVerified: true,
          identityVerified: true,
          phone: true,
        }
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const postCount = await prisma.post.count({
        where: { authorId: targetUserId, isArchived: false, status: 'published' }
      });

      const isSelf = session?.user?.id === targetUserId;
      if (user.isPrivate && !isSelf) {
        return NextResponse.json({
          ...user,
          email: null,
          phone: null,
          postCount
        });
      }

      return NextResponse.json({ ...user, postCount });
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const postCount = await prisma.post.count({
      where: { authorId: session.user.id, isArchived: false }
    });

    return NextResponse.json({ ...user, postCount });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const user = session.user;

    const updateData: any = {
      gender: data.gender,
      birthday: data.birthday ? new Date(data.birthday) : null,
      isPrivate: data.isPrivate,
      phone: data.phone,
      wilaya: data.wilaya,
      city: data.city,
      image: data.image
    };

    if (data.identityVerified !== undefined) {
      updateData.identityVerified = data.identityVerified;
    }
    
    if (data.faceVerified !== undefined) {
      updateData.faceVerified = data.faceVerified;
    }

    if (data.faceImage !== undefined && data.faceImage) {
      // Check if this face image is already registered under another user's profile
      const duplicateUser = await prisma.user.findFirst({
        where: {
          faceImage: data.faceImage,
          id: { not: user.id }
        }
      });

      if (duplicateUser) {
        return NextResponse.json({ 
          error: 'This face image is already registered to another user account. Duplicate profiles are not permitted.' 
        }, { status: 400 });
      }
      updateData.faceImage = data.faceImage;
    }

    // Only update name if it hasn't been changed before
    // Need to get user from db to check nameChanged
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (data.name && data.name !== dbUser.name) {
      if (dbUser.nameChanged) {
        return NextResponse.json({ error: 'You have already changed your name once.' }, { status: 403 });
      } else {
        updateData.name = data.name;
        updateData.lastName = data.lastName;
        updateData.nameChanged = true;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete user and their posts
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isArchived: true }
    });

    await prisma.post.updateMany({
      where: { authorId: session.user.id },
      data: { isArchived: true }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving user:', error);
    return NextResponse.json({ error: 'Failed to archive user' }, { status: 500 });
  }
}
