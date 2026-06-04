import { prisma } from '@/lib/prisma';

/**
 * MongoDB-backed sliding window rate limiter.
 * Safe for serverless environments.
 * 
 * @param key Unique key for rate limiting (e.g., "face-verify:192.168.1.1")
 * @param limit Max number of allowed attempts
 * @param durationMs Sliding window duration in milliseconds (default: 1 hour)
 */
export async function rateLimit(key: string, limit = 5, durationMs = 3600000) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - durationMs);

  // Clean up expired rate limit logs for this key to prevent collection bloat
  try {
    await prisma.rateLimit.deleteMany({
      where: {
        key,
        timestamp: {
          lt: windowStart,
        },
      },
    });
  } catch (err) {
    console.error('Error cleaning up rate limit records:', err);
  }

  // Count attempts in current sliding window
  const count = await prisma.rateLimit.count({
    where: {
      key,
      timestamp: {
        gte: windowStart,
      },
    },
  });

  if (count >= limit) {
    return { success: false };
  }

  // Record this attempt
  await prisma.rateLimit.create({
    data: {
      key,
      timestamp: now,
    },
  });

  return { success: true };
}
