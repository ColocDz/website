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
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(1500) });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      info.serverOutboundIP = ipData.ip;
    }
  } catch (e: any) {
    info.outboundIpError = e?.message;
  }

  // 2. Test importing Prisma Client
  try {
    const { PrismaClient } = await import('@prisma/client');
    info.prismaModuleLoaded = true;
    
    const dbUrl = "mongodb://colocdz:ugDtojEk84H1iWaM@ac-wulwfie-shard-00-00.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-01.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-02.7o4uabo.mongodb.net:27017/colocdz?ssl=true&replicaSet=atlas-13c548-shard-0&authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=2000&connectTimeoutMS=2000&socketTimeoutMS=2000";

    const prismaClient = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ['error']
    });
    info.prismaClientInstantiated = true;

    // Test simple count with 2.5s signal timeout
    const countPromise = prismaClient.user.count();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timed out (2.5s). Please check MongoDB Atlas IP Access List for 89.117.50.245 or 0.0.0.0/0.')), 2500)
    );

    info.userCount = await Promise.race([countPromise, timeoutPromise]);
    info.prismaConnected = true;
    await prismaClient.$disconnect();
  } catch (error: any) {
    info.prismaConnected = false;
    info.prismaError = {
      name: error?.name,
      message: error?.message,
    };
  }

  return NextResponse.json(info);
}
