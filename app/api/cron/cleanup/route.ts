import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredRecords } from '@/lib/cleanup';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;

    // Verify cron authorization secret if set
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const result = await purgeExpiredRecords();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to execute cron cleanup' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
