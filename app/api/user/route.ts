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

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {
      gender: data.gender,
      birthday: data.birthday ? new Date(data.birthday) : undefined,
      isPrivate: data.isPrivate,
      phone: data.phone,
      wilaya: data.wilaya,
      city: data.city,
      image: data.image
    };

    // Filter undefined fields to avoid overwriting database fields with nulls
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    if (data.identityVerified !== undefined) {
      updateData.identityVerified = data.identityVerified;
    }
    
    if (data.faceVerified !== undefined) {
      updateData.faceVerified = data.faceVerified;
    }

    if (data.faceImage !== undefined && data.faceImage) {
      updateData.faceImage = data.faceImage;
    }

    // Store face descriptor and check for duplicates
    if (data.faceDescriptor && Array.isArray(data.faceDescriptor) && data.faceDescriptor.length === 128) {
      // Euclidean distance check against all stored descriptors
      const usersWithDescriptors = await prisma.user.findMany({
        where: {
          faceDescriptor: { isEmpty: false },
          id: { not: user.id },
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

      for (const existing of usersWithDescriptors) {
        if (existing.faceDescriptor.length !== 128) continue;
        const dist = euclideanDistance(data.faceDescriptor, existing.faceDescriptor);
        if (dist < 0.5) {
          return NextResponse.json({
            error: `This face matches an existing account (${existing.name} ${existing.lastName || ''}). Duplicate profiles are not permitted.`
          }, { status: 400 });
        }
      }

      updateData.faceDescriptor = data.faceDescriptor;
    }

    // Name and LastName update rules
    let nameWillChange = false;
    let lastNameWillChange = false;

    if (data.name && data.name !== dbUser.name) {
      nameWillChange = true;
    }

    if (data.lastName && dbUser.lastName && data.lastName !== dbUser.lastName) {
      lastNameWillChange = true;
    }

    if (nameWillChange || lastNameWillChange) {
      if (dbUser.nameChanged) {
        return NextResponse.json({ error: 'You have already changed your name once.' }, { status: 403 });
      }
      updateData.nameChanged = true;
    }

    if (data.name) {
      updateData.name = data.name;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
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
