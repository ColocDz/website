import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify the user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || !conversation.participantIds.includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isArchived = conversation.archivedBy?.includes(userId) ?? false;

    if (isArchived) {
      // Un-archive: remove userId from archivedBy
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          archivedBy: {
            set: (conversation.archivedBy || []).filter((id: string) => id !== userId),
          },
        },
      });
    } else {
      // Archive: add userId to archivedBy
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          archivedBy: {
            push: userId,
          },
        },
      });
    }

    return NextResponse.json({ archived: !isArchived });
  } catch (error) {
    console.error('Error toggling archive:', error);
    return NextResponse.json({ error: 'Failed to toggle archive' }, { status: 500 });
  }
}
