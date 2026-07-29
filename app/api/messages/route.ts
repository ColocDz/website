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

    // Fetch conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participantIds: { has: userId },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only need the latest message for the list
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Collect all unique participant IDs (excluding current user)
    const otherUserIds = Array.from(
      new Set(
        conversations
          .map(conv => conv.participantIds.find(id => id !== userId))
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
      const otherUserId = conv.participantIds.find(id => id !== userId);
      const otherUser = otherUserId ? userMap.get(otherUserId) || null : null;
      
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.updatedAt,
        archived: conv.archivedBy?.includes(userId) ?? false,
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

    // If no conversationId is provided, check if one exists or create a new one
    if (!activeConversationId) {
      if (!receiverId) {
        return NextResponse.json({ error: 'Receiver ID is required to start a new conversation' }, { status: 400 });
      }

      // Check if conversation already exists between these two users
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          participantIds: {
            hasEvery: [session.user.id, receiverId]
          }
        }
      });

      if (existingConversation) {
        activeConversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            participantIds: [session.user.id, receiverId]
          }
        });
        activeConversationId = newConversation.id;
      }
    } else {
      // Validate the user is part of the provided conversation
      const conversation = await prisma.conversation.findUnique({ where: { id: activeConversationId }});
      if (!conversation || !conversation.participantIds.includes(session.user.id)) {
        return NextResponse.json({ error: 'Invalid conversation' }, { status: 403 });
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        conversationId: activeConversationId
      }
    });

    // Update conversation's updatedAt
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
