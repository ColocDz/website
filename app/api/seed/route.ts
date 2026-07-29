import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Clean old data completely
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    const hashedPassword = await bcrypt.hash('Password123!', 10);

    // 2. Create Fatima
    const fatima = await prisma.user.create({
      data: {
        name: 'Fatima Zohra',
        email: 'fatima@test.com',
        emailVerified: true,
        gender: 'female',
        wilaya: 'Algiers',
        city: 'Bab Ezzouar',
        phone: '+213555123456',
        bio: 'Etudiante en master informatique à USTHB. Recherche colocataire calme et propre.',
        identityVerified: true,
      }
    });

    await prisma.account.create({
      data: {
        userId: fatima.id,
        accountId: fatima.id,
        providerId: 'credential',
        password: hashedPassword,
      }
    });

    // 3. Create Ahmed
    const ahmed = await prisma.user.create({
      data: {
        name: 'Ahmed Benali',
        email: 'ahmed@test.com',
        emailVerified: true,
        gender: 'male',
        wilaya: 'Algiers',
        city: 'Hydra',
        phone: '+213555987654',
        bio: 'Ingénieur en développement web. Recherche appartement ou chambre sur Alger.',
        identityVerified: true,
      }
    });

    await prisma.account.create({
      data: {
        userId: ahmed.id,
        accountId: ahmed.id,
        providerId: 'credential',
        password: hashedPassword,
      }
    });

    // 4. Create Karim
    const karim = await prisma.user.create({
      data: {
        name: 'Karim Mansouri',
        email: 'karim@test.com',
        emailVerified: true,
        gender: 'male',
        wilaya: 'Oran',
        city: 'Akid Lotfi',
        phone: '+213555333444',
        bio: 'Etudiant en médecine.',
        identityVerified: true,
      }
    });

    await prisma.account.create({
      data: {
        userId: karim.id,
        accountId: karim.id,
        providerId: 'credential',
        password: hashedPassword,
      }
    });

    // 5. Create Sample Listings
    await prisma.post.create({
      data: {
        title: 'Appartement F3 meublé proche USTHB',
        type: 'Apartment',
        postType: 'offer',
        searchType: 'roommate',
        price: '25000',
        wilaya: 'Algiers',
        location: 'Bab Ezzouar',
        description: 'Appartement F3 entièrement équipé et meublé. Cuisine équipée, Wi-Fi haut débit, climatisation. Idéal pour étudiante ou jeune travailleuse.',
        images: [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'
        ],
        amenities: ['wifi', 'ac', 'furnished', 'parking'],
        author: { connect: { id: fatima.id } },
      }
    });

    await prisma.post.create({
      data: {
        title: 'Studio moderne sécurisé à Hydra',
        type: 'Studio',
        postType: 'offer',
        searchType: 'roommate',
        price: '35000',
        wilaya: 'Algiers',
        location: 'Hydra',
        description: 'Superbe studio meublé avec terrasse et vue dégagée. Quartier calme et très sécurisé.',
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
        ],
        amenities: ['wifi', 'ac', 'elevator', 'furnished'],
        author: { connect: { id: ahmed.id } },
      }
    });

    await prisma.post.create({
      data: {
        title: 'Recherche colocataire pour appartement à Kouba',
        type: 'Shared Space',
        postType: 'request',
        searchType: 'roommate_and_place',
        price: '20000',
        wilaya: 'Algiers',
        location: 'Kouba',
        description: 'Cherche un jeune colocataire sérieux pour partager les frais de loyer d\'un F3 à Kouba.',
        images: [
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
        ],
        amenities: ['wifi', 'furnished'],
        author: { connect: { id: karim.id } },
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Database cleared and fresh test data seeded successfully!',
      seeded: {
        usersCount: 3,
        postsCount: 3,
        testAccounts: [
          { email: 'fatima@test.com', password: 'Password123!' },
          { email: 'ahmed@test.com', password: 'Password123!' },
          { email: 'karim@test.com', password: 'Password123!' },
        ]
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed to seed database'
    }, { status: 500 });
  }
}
