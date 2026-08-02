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
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } }
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const archivedBy: string[] = Array.isArray(conversation.archivedBy) ? (conversation.archivedBy as string[]) : [];
    const isArchived = archivedBy.includes(userId);

    let updatedArchivedBy: string[];
    if (isArchived) {
      updatedArchivedBy = archivedBy.filter((id: string) => id !== userId);
    } else {
      updatedArchivedBy = [...archivedBy, userId];
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { archivedBy: updatedArchivedBy },
    });

    return NextResponse.json({ archived: !isArchived });
  } catch (error) {
    console.error('Error toggling archive:', error);
    return NextResponse.json({ error: 'Failed to toggle archive' }, { status: 500 });
  }
}
