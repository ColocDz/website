import { NextResponse } from 'next/server';

export async function GET() {
  const info: any = {
    timestamp: new Date().toISOString(),
    status: "ok",
    nodeVersion: process.version,
    platform: process.platform,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    }
  };

  try {
    const { PrismaClient } = await import('@prisma/client');
    info.prismaModuleLoaded = true;
  } catch (error: any) {
    info.prismaModuleError = error?.message;
  }

  return NextResponse.json(info);
}
