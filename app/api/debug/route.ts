import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const srvUrl = (process.env.DATABASE_URL || "") + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + "serverSelectionTimeoutMS=4000&connectTimeoutMS=4000";

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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch debug info' }, { status: 500 });
  }
}

