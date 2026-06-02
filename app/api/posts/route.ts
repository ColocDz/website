import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    const session = await auth.api.getSession({ headers: await headers() });

    const whereClause: any = { isArchived: false };
    if (userId) {
      whereClause.authorId = userId;
      // If requester is not the target user, only show published posts
      if (!session || session.user.id !== userId) {
        whereClause.status = 'published';
      }
    } else {
      whereClause.status = 'published'; // Only show published in public feed
    }
    
    if (type) whereClause.type = type;
    if (query) {
      whereClause.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, lastName: true, email: true, image: true, gender: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.faceVerified) {
      return NextResponse.json({ error: 'Face verification is required to publish posts' }, { status: 400 });
    }

    const isPublishing = data.status === 'published' || !data.status;
    if (isPublishing) {
      const postCount = await prisma.post.count({
        where: { authorId: session.user.id, isArchived: false, status: 'published' }
      });
      if (postCount >= 3 && !user.identityVerified) {
        return NextResponse.json({ error: 'You have already published 3 or more posts. Identity verification via National ID card is required to publish more.' }, { status: 400 });
      }
    }
    
    // Validate required fields (in a real app, use Zod)
    if (!data.title || !data.description || !data.price || !data.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (data.title.length > 30) {
      return NextResponse.json({ error: 'Title cannot exceed 30 characters' }, { status: 400 });
    }

    const priceNum = Number(data.price);
    if (isNaN(priceNum) || priceNum < 1000) {
      return NextResponse.json({ error: 'Price must be at least 1,000 DA' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'Apartment',
        postType: data.postType || 'offer',
        price: data.price ? data.price.toString() : null,
        location: data.location,
        wilaya: data.wilaya,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
        amenities: data.amenities ? (typeof data.amenities === 'string' ? data.amenities.split(',').map((s: string) => s.trim()) : data.amenities) : [],
        tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map((s: string) => s.trim()) : data.tags) : [],
        images: data.images || [],
        status: data.status || 'published',
        authorId: session.user.id
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
