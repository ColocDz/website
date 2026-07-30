import { prisma } from '@/lib/prisma';

/**
 * Clean up expired sessions and stale rate limit records from database.
 * Prevents unbounded table/collection bloat at 500k+ scale.
 */
export async function purgeExpiredRecords() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  try {
    // 1. Purge expired sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // 2. Purge rate limit logs older than 24 hours
    const deletedRateLimits = await prisma.rateLimit.deleteMany({
      where: {
        timestamp: {
          lt: oneDayAgo,
        },
      },
    });

    return {
      success: true,
      deletedSessions: deletedSessions.count,
      deletedRateLimits: deletedRateLimits.count,
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    console.error('[Database Cleanup] Error purging stale records:', error);
    return {
      success: false,
      error: error?.message || 'Cleanup failed',
    };
  }
}
