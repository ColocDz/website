// Test the actual Better Auth sign-in flow server-side
import { auth } from './lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLogin() {
  console.log('=== Testing Better Auth Sign-In Flow ===\n');

  // Test 1: Check the database state
  const user = await prisma.user.findUnique({
    where: { email: 'ahmed@test.com' },
    include: { accounts: true },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('User found:', user.id);
  console.log('Accounts:', user.accounts.length);
  for (const a of user.accounts) {
    console.log(`  provider: ${a.providerId}, accountId: ${a.accountId}`);
    console.log(`  password starts with: ${a.password?.substring(0, 10)}...`);
  }

  // Test 2: Try to sign in using the Better Auth internal API
  try {
    const request = new Request('http://localhost:3000/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        email: 'ahmed@test.com',
        password: 'Test1234!',
      }),
    });

    const response = await auth.handler(request);
    const body = await response.text();
    console.log('\nSign-in response status:', response.status);
    console.log('Sign-in response body:', body.substring(0, 300));

    if (response.status === 200) {
      console.log('\n✅ Login WORKS!');
    } else {
      console.log('\n❌ Login FAILED');
    }
  } catch (e: any) {
    console.error('\n❌ Exception during sign-in:', e.message);
  }

  await prisma.$disconnect();
}

testLogin().catch(e => { console.error(e); process.exit(1); });
