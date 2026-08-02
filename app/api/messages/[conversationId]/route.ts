import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const unwrappedParams = await params;
    const { conversationId } = unwrappedParams;
    
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    let pIds: string[] = [];
    if (conversation) {
      if (typeof conversation.participantIds === 'string') {
        try { pIds = JSON.parse(conversation.participantIds); } catch (e) {}
      } else if (Array.isArray(conversation.participantIds)) {
        pIds = conversation.participantIds as any[];
      }
    }

    if (!conversation || !pIds.includes(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
