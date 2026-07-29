import { NextResponse } from 'next/server';

export async function GET() {
  const info: any = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    }
  };

  // 1. Fetch exact live outbound IP of cPanel server
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      info.serverOutboundIP = ipData.ip;
    }
  } catch (e: any) {
    info.outboundIpError = e?.message;
  }

  // 2. Test Prisma Connection with strict 3-second timeout
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: "mongodb://colocdz:ugDtojEk84H1iWaM@ac-wulwfie-shard-00-00.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-01.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-02.7o4uabo.mongodb.net:27017/colocdz?ssl=true&replicaSet=atlas-13c548-shard-0&authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=2500&connectTimeoutMS=2500"
        }
      },
      log: ['error']
    });
    info.prismaClientInstantiated = true;

    const connectPromise = prismaClient.$connect();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Prisma $connect timed out after 3 seconds. Outbound IP ${info.serverOutboundIP || '89.117.50.245'} may be blocked in MongoDB Atlas.`)), 3000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    info.prismaConnected = true;
    info.userCount = await prismaClient.user.count();
    await prismaClient.$disconnect();
  } catch (error: any) {
    info.prismaConnected = false;
    info.prismaError = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
  }

  return NextResponse.json(info);
}
