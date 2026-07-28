import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const info: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 25) : null,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    },
    system: {
      totalmem: os.totalmem(),
      freemem: os.freemem(),
    }
  };

  try {
    const { PrismaClient } = await import('@prisma/client');
    info.prismaClientImported = true;

    // Add connectTimeoutMS and serverSelectionTimeoutMS to DATABASE_URL if missing
    let dbUrl = process.env.DATABASE_URL || '';
    if (!dbUrl.includes('serverSelectionTimeoutMS')) {
      dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'serverSelectionTimeoutMS=4000&connectTimeoutMS=4000';
    }

    const prismaClient = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ['error']
    });
    info.prismaClientInstantiated = true;

    const connectPromise = prismaClient.$connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Prisma $connect timed out after 4 seconds')), 4000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    info.prismaConnected = true;

    const userCount = await prismaClient.user.count();
    info.userCount = userCount;
    await prismaClient.$disconnect();
  } catch (error: any) {
    info.prismaError = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
  }

  return NextResponse.json(info);
}
