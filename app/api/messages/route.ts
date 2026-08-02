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
        participants: { some: { id: userId } }
      },
      include: {
        participants: {
          select: { id: true, name: true, lastName: true, email: true, image: true }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Only need the latest message for the list
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const enrichedConversations = conversations.map((conv) => {
      const otherUser = conv.participants.find(p => p.id !== userId) || null;
      const archivedBy = Array.isArray(conv.archivedBy) ? (conv.archivedBy as string[]) : [];
      
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages[0] || null,
        updatedAt: conv.updatedAt,
        archived: archivedBy.includes(userId),
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
          AND: [
            { participants: { some: { id: session.user.id } } },
            { participants: { some: { id: receiverId } } }
          ]
        }
      });

      if (existingConversation) {
        activeConversationId = existingConversation.id;
      } else {
        // Create new conversation
        const newConversation = await prisma.conversation.create({
          data: {
            participants: {
              connect: [{ id: session.user.id }, { id: receiverId }]
            }
          }
        });
        activeConversationId = newConversation.id;
      }
    } else {
      // Validate the user is part of the provided conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: activeConversationId,
          participants: { some: { id: session.user.id } }
        }
      });

      if (!conversation) {
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
