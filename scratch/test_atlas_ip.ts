import { prisma } from '../lib/prisma';

async function testPrismaLocal() {
  console.log('Testing Prisma connection from local machine...');
  try {
    const count = await prisma.user.count();
    console.log('✓ Successfully connected to MongoDB Atlas! User count:', count);
  } catch (err: any) {
    console.error('❌ Connection error:', err?.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaLocal();
