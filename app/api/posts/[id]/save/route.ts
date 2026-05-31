import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unwrappedParams = await params;
    const { id: postId } = unwrappedParams;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Get current user's saved list
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { savedPostIds: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const savedPostIds = user.savedPostIds || [];
    const isSaved = savedPostIds.includes(postId);

    let updatedSavedPostIds;
    if (isSaved) {
      updatedSavedPostIds = savedPostIds.filter(id => id !== postId);
    } else {
      updatedSavedPostIds = [...savedPostIds, postId];
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { savedPostIds: updatedSavedPostIds }
    });

    return NextResponse.json({ saved: !isSaved });
  } catch (error) {
    console.error('Error toggling saved post:', error);
    return NextResponse.json({ error: 'Failed to toggle save state' }, { status: 500 });
  }
}
