import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('better-auth.session_token')?.value || 
                         request.cookies.get('__Secure-better-auth.session_token')?.value;
                         
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(session.user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('better-auth.session_token')?.value || 
                         request.cookies.get('__Secure-better-auth.session_token')?.value;
                         
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
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
    
    if (data.phoneVerified !== undefined) {
      updateData.phoneVerified = data.phoneVerified;
    }

    // Only update name if it hasn't been changed before
    if (data.name && data.name !== user.name) {
      if (user.nameChanged) {
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
    const sessionToken = request.cookies.get('better-auth.session_token')?.value || 
                         request.cookies.get('__Secure-better-auth.session_token')?.value;
                         
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
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
