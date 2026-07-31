import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'colocdz_session';

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  const session = await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });

  return session;
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value 
               || cookieStore.get('better-auth.session_token')?.value
               || cookieStore.get('__Secure-better-auth.session_token')?.value;
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
            image: true,
            gender: true,
            phone: true,
            wilaya: true,
            city: true,
            birthday: true,
            bio: true,
            isPrivate: true,
            identityVerified: true,
            faceVerified: true,
            faceVerifiedAt: true,
            faceVerifiedUntil: true,
            faceImage: true,
            phoneVerified: true,
            savedPostIds: true,
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      user: session.user,
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      }
    };
  } catch (e) {
    return null;
  }
}

export async function destroySession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value 
               || cookieStore.get('better-auth.session_token')?.value
               || cookieStore.get('__Secure-better-auth.session_token')?.value;
    if (token) {
      await prisma.session.deleteMany({ where: { token } });
    }
    cookieStore.delete(COOKIE_NAME);
    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('__Secure-better-auth.session_token');
  } catch (e) {}
}
