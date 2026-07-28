import { NextResponse } from 'next/server';
import os from 'os';

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

  const directUrl = "mongodb://colocdz:ugDtojEk84H1iWaM@ac-wulwfie-shard-00-00.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-01.7o4uabo.mongodb.net:27017,ac-wulwfie-shard-00-02.7o4uabo.mongodb.net:27017/colocdz?ssl=true&replicaSet=atlas-13c548-shard-0&authSource=admin&retryWrites=true&w=majority&serverSelectionTimeoutMS=4000&connectTimeoutMS=4000";
  const srvUrl = (process.env.DATABASE_URL || "") + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + "serverSelectionTimeoutMS=4000&connectTimeoutMS=4000";

  // Test 1: Test Direct Connection String
  try {
    const { PrismaClient } = await import('@prisma/client');
    const clientDirect = new PrismaClient({
      datasources: { db: { url: directUrl } },
      log: ['error']
    });
    info.testingDirect = true;
    await clientDirect.$connect();
    info.directConnected = true;
    info.directUserCount = await clientDirect.user.count();
    await clientDirect.$disconnect();
  } catch (error: any) {
    info.directError = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
  }

  // Test 2: Test SRV Connection String
  try {
    const { PrismaClient } = await import('@prisma/client');
    const clientSrv = new PrismaClient({
      datasources: { db: { url: srvUrl } },
      log: ['error']
    });
    info.testingSrv = true;
    await clientSrv.$connect();
    info.srvConnected = true;
    info.srvUserCount = await clientSrv.user.count();
    await clientSrv.$disconnect();
  } catch (error: any) {
    info.srvError = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
  }

  return NextResponse.json(info);
}
