import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ─── Clean existing data ───
  console.log('🧹 Cleaning existing data...');
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.post.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.verification.deleteMany();
  console.log('✅ Database cleaned.');

  // ─── Create User 1: Ahmed Kari ───
  const hashedPassword1 = await bcrypt.hash('Test1234!', 10);

  const user1 = await prisma.user.create({
    data: {
      name: 'Ahmed',
      lastName: 'Kari',
      email: 'ahmed@test.com',
      emailVerified: true,
      phone: '+213555000001',
      gender: 'male',
      bio: 'Engineering student looking for a quiet roommate in downtown Algiers.',
      wilaya: '16 - Alger',
      city: 'Bab El Oued',
      faceVerified: true,
      faceImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AhmedFace',
      identityVerified: true,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    },
  });

  await prisma.account.create({
    data: {
      userId: user1.id,
      accountId: user1.id,
      providerId: 'credential',
      password: hashedPassword1,
    },
  });

  console.log(`✅ User created: Ahmed Kari (ahmed@test.com / Test1234!)`);

  // ─── Create User 2: Fatima Azizi ───
  const hashedPassword2 = await bcrypt.hash('Test1234!', 10);

  const user2 = await prisma.user.create({
    data: {
      name: 'Fatima',
      lastName: 'Azizi',
      email: 'fatima@test.com',
      emailVerified: true,
      phone: '+213555000002',
      gender: 'female',
      bio: 'Medical student looking for a clean, well-organized colocation near the hospital.',
      wilaya: '31 - Oran',
      city: 'Centre Ville',
      faceVerified: true,
      faceImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=FatimaFace',
      identityVerified: true,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
    },
  });

  await prisma.account.create({
    data: {
      userId: user2.id,
      accountId: user2.id,
      providerId: 'credential',
      password: hashedPassword2,
    },
  });

  console.log(`✅ User created: Fatima Azizi (fatima@test.com / Test1234!)`);

  // ─── Create Post 1: Ahmed's Apartment Offer ───
  const post1 = await prisma.post.create({
    data: {
      title: 'Spacious room in downtown Algiers with natural light',
      type: 'Apartment',
      postType: 'offer',
      description:
        'Modern apartment near public transit with utilities included in rent. The room is fully furnished with a desk, wardrobe, and single bed. Shared kitchen and bathroom are kept clean. Internet (fiber) is included. Ideal for a student or young professional.\n\nThe building has an elevator and 24/7 security. Supermarket and café are on the ground floor. Bus stop is a 2-minute walk.',
      price: '25000',
      location: 'Bab El Oued, Algiers',
      wilaya: '16 - Alger',
      bedrooms: 2,
      bathrooms: 1,
      amenities: ['WiFi', 'Furnished', 'Elevator', 'Security', 'Near Transit'],
      tags: ['Modern', 'Downtown', 'Furnished', 'Student-Friendly'],
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      ],
      status: 'published',
      authorId: user1.id,
    },
  });

  console.log(`✅ Post created: "${post1.title}"`);

  // ─── Create Post 2: Fatima's Room Request ───
  const post2 = await prisma.post.create({
    data: {
      title: 'Looking for a quiet room near CHU Oran',
      type: 'Room',
      postType: 'request',
      description:
        'Medical student looking for a clean, quiet room near CHU Oran hospital. I prefer a female-only colocation. I am organized, respectful, and usually study at the library until evening.\n\nBudget is flexible for the right place. I need reliable internet and a calm environment. Move-in date is flexible from next month.',
      price: '18000',
      location: 'Centre Ville, Oran',
      wilaya: '31 - Oran',
      bedrooms: 1,
      bathrooms: 1,
      amenities: ['WiFi', 'Quiet', 'Female-Only', 'Near Hospital'],
      tags: ['Quiet', 'Student', 'Female-Only', 'Near Hospital'],
      images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
      ],
      status: 'published',
      authorId: user2.id,
    },
  });

  console.log(`✅ Post created: "${post2.title}"`);

  // ─── Summary ───
  console.log('\n══════════════════════════════════════════');
  console.log('  🎉  SEED COMPLETE');
  console.log('══════════════════════════════════════════');
  console.log('  Users:');
  console.log('    1. Ahmed Kari    → ahmed@test.com  / Test1234!');
  console.log('    2. Fatima Azizi  → fatima@test.com / Test1234!');
  console.log('  Posts:');
  console.log(`    1. "${post1.title.substring(0, 45)}..." by Ahmed`);
  console.log(`    2. "${post2.title.substring(0, 45)}..." by Fatima`);
  console.log('  Both accounts are face & identity verified.');
  console.log('══════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
