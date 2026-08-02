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

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    let pIds: string[] = [];
    if (conversation) {
      if (typeof conversation.participantIds === 'string') {
        try { pIds = JSON.parse(conversation.participantIds); } catch (e) {}
      } else if (Array.isArray(conversation.participantIds)) {
        pIds = conversation.participantIds as any[];
      }
    }

    if (!conversation || !pIds.includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let archivedList: string[] = [];
    if (typeof conversation.archivedBy === 'string') {
      try { archivedList = JSON.parse(conversation.archivedBy); } catch (e) {}
    } else if (Array.isArray(conversation.archivedBy)) {
      archivedList = conversation.archivedBy as any[];
    }

    const isArchived = archivedList.includes(userId);

    let updatedArchivedBy: string[];
    if (isArchived) {
      updatedArchivedBy = archivedList.filter(id => id !== userId);
    } else {
      updatedArchivedBy = [...archivedList, userId];
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        archivedBy: updatedArchivedBy,
      },
    });

    return NextResponse.json({ archived: !isArchived });
  } catch (error) {
    console.error('Error toggling archive:', error);
    return NextResponse.json({ error: 'Failed to toggle archive' }, { status: 500 });
  }
}
