import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const info: any = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL_SET: !!process.env.DATABASE_URL,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    }
  };

  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, email: true, name: true }
    });
    const postCount = await prisma.post.count();
    
    info.dbConnected = true;
    info.userCount = userCount;
    info.postCount = postCount;
    info.users = users;
  } catch (error: any) {
    info.dbConnected = false;
    info.dbError = {
      name: error?.name,
      message: error?.message,
      code: error?.code,
    };
  }

  return NextResponse.json(info);
}
