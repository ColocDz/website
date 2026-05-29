import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // get the latest user from db
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
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

    if (data.faceImage !== undefined) {
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
