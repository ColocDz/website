import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const info: any = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      DATABASE_URL_PREFIX: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) : null,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    },
    system: {
      uptime: os.uptime(),
      loadavg: os.loadavg(),
      totalmem: os.totalmem(),
      freemem: os.freemem(),
    }
  };

  try {
    const { PrismaClient } = await import('@prisma/client');
    info.prismaClientImported = true;
    const prismaClient = new PrismaClient({ log: ['error'] });
    info.prismaClientInstantiated = true;
    await prismaClient.$connect();
    info.prismaConnected = true;
    const userCount = await prismaClient.user.count();
    info.userCount = userCount;
    await prismaClient.$disconnect();
  } catch (error: any) {
    info.prismaError = {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    };
  }

  return NextResponse.json(info);
}
