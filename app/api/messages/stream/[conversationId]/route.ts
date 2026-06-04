import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { conversationId } = await params;

    // Verify user is part of the conversation
    const conv = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        participantIds: { has: session.user.id },
      },
    });

    if (!conv) {
      return new Response('Conversation not found', { status: 404 });
    }

    const responseStream = new TransformStream();
    const writer = responseStream.writable.getWriter();
    const encoder = new TextEncoder();

    let lastMessageId: string | null = null;

    // Retrieve initial message state
    const initial = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
    });
    if (initial) {
      lastMessageId = initial.id;
    }

    const intervalId = setInterval(async () => {
      try {
        const latestMessage = await prisma.message.findFirst({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
        });

        if (latestMessage && latestMessage.id !== lastMessageId) {
          lastMessageId = latestMessage.id;
          await writer.write(
            encoder.encode(`data: ${JSON.stringify(latestMessage)}\n\n`)
          );
        }
      } catch (err) {
        console.error('SSE polling error:', err);
      }
    }, 1000);

    request.signal.addEventListener('abort', () => {
      clearInterval(intervalId);
      writer.close().catch(() => {});
    });

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE route exception:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
