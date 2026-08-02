import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all conversations
    const allConversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Filter conversations where the user is a participant
    const conversations = allConversations.filter(conv => {
      let pIds: string[] = [];
      if (typeof conv.participantIds === 'string') {
        try { pIds = JSON.parse(conv.participantIds); } catch (e) {}
      } else if (Array.isArray(conv.participantIds)) {
        pIds = conv.participantIds as any[];
      }
      return pIds.includes(userId);
    });

    // Collect all unique participant IDs (excluding current user)
    const otherUserIds = Array.from(
      new Set(
        conversations
          .map(conv => {
            let pIds: string[] = [];
            if (typeof conv.participantIds === 'string') {
              try { pIds = JSON.parse(conv.participantIds); } catch (e) {}
            } else if (Array.isArray(conv.participantIds)) {
              pIds = conv.participantIds as any[];
            }
            return pIds.find(id => id !== userId);
          })
          .filter((id): id is string => Boolean(id))
      )
    );

    // Fetch details of all other participants in a single batch query
    const otherUsers = otherUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: otherUserIds } },
          select: { id: true, name: true, lastName: true, email: true, image: true }
        })
      : [];

    const userMap = new Map(otherUsers.map(user => [user.id, user]));

    const enrichedConversations = conversations.map((conv) => {
      let pIds: string[] = [];
      if (typeof conv.participantIds === 'string') {
        try { pIds = JSON.parse(conv.participantIds); } catch (e) {}
      } else if (Array.isArray(conv.participantIds)) {
        pIds = conv.participantIds as any[];
      }

      let archivedList: string[] = [];
      if (typeof conv.archivedBy === 'string') {
        try { archivedList = JSON.parse(conv.archivedBy); } catch (e) {}
      } else if (Array.isArray(conv.archivedBy)) {
        archivedList = conv.archivedBy as any[];
      }

      const otherUserId = pIds.find(id => id !== userId);
      const otherUser = otherUserId ? userMap.get(otherUserId) || null : null;
      
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.updatedAt,
        archived: archivedList.includes(userId),
      };
    });

    return NextResponse.json(enrichedConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { receiverId, content, conversationId } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      if (!receiverId) {
        return NextResponse.json({ error: 'Receiver ID is required to start a new conversation' }, { status: 400 });
      }

      const allConvs = await prisma.conversation.findMany();
      const existingConversation = allConvs.find(conv => {
        let pIds: string[] = [];
        if (typeof conv.participantIds === 'string') {
          try { pIds = JSON.parse(conv.participantIds); } catch (e) {}
        } else if (Array.isArray(conv.participantIds)) {
          pIds = conv.participantIds as any[];
        }
        return pIds.includes(session.user.id) && pIds.includes(receiverId);
      });

      if (existingConversation) {
        activeConversationId = existingConversation.id;
      } else {
        const newConversation = await prisma.conversation.create({
          data: {
            participantIds: [session.user.id, receiverId]
          }
        });
        activeConversationId = newConversation.id;
      }
    } else {
      const conversation = await prisma.conversation.findUnique({ where: { id: activeConversationId }});
      let pIds: string[] = [];
      if (conversation) {
        if (typeof conversation.participantIds === 'string') {
          try { pIds = JSON.parse(conversation.participantIds); } catch (e) {}
        } else if (Array.isArray(conversation.participantIds)) {
          pIds = conversation.participantIds as any[];
        }
      }

      if (!conversation || !pIds.includes(session.user.id)) {
        return NextResponse.json({ error: 'Invalid conversation' }, { status: 403 });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        conversationId: activeConversationId
      }
    });

    await prisma.conversation.update({
      where: { id: activeConversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
