import { headers, cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Server-side helper to retrieve the active authenticated session & user profile.
 * Consolidates on Better Auth as single source of truth.
 */
export async function getSession() {
  try {
    const reqHeaders = await headers();
    const betterAuthSession = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (betterAuthSession && betterAuthSession.user) {
      // Fetch full User profile details from MongoDB
      const fullUser = await prisma.user.findUnique({
        where: { id: betterAuthSession.user.id },
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
          phoneVerified: true,
          phoneVerifiedAt: true,
          savedPostIds: true,
        }
      });

      if (fullUser) {
        return {
          user: fullUser,
          session: betterAuthSession.session,
        };
      }
    }

    // Fallback lookup via session token cookie if needed
    const cookieStore = await cookies();
    const token = cookieStore.get('better-auth.session_token')?.value
               || cookieStore.get('__Secure-better-auth.session_token')?.value
               || cookieStore.get('colocdz_session')?.value;

    if (!token) return null;

    const dbSession = await prisma.session.findUnique({
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
            phoneVerified: true,
            phoneVerifiedAt: true,
            savedPostIds: true,
          }
        }
      }
    });

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null;
    }

    return {
      user: dbSession.user,
      session: {
        id: dbSession.id,
        userId: dbSession.userId,
        expiresAt: dbSession.expiresAt.toISOString(),
      }
    };
  } catch (e) {
    console.error('[getSession] Exception:', e);
    return null;
  }
}

export async function destroySession() {
  try {
    const reqHeaders = await headers();
    await auth.api.signOut({ headers: reqHeaders });
    
    const cookieStore = await cookies();
    cookieStore.delete('better-auth.session_token');
    cookieStore.delete('__Secure-better-auth.session_token');
    cookieStore.delete('colocdz_session');
  } catch (e) {
    console.error('[destroySession] Exception:', e);
  }
}
