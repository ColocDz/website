import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { formatPost } from '@/lib/prisma-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('ping') === 'true') {
      return NextResponse.json({ pong: true });
    }
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const searchType = searchParams.get('searchType');
    const saved = searchParams.get('saved') === 'true';

    const session = await auth.api.getSession({ headers: await headers() });

    const whereClause: any = { isArchived: false };
    
    if (saved) {
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { savedPostIds: true }
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      const savedIds = parseJsonField(user.savedPostIds);
      whereClause.id = { in: savedIds };
      whereClause.status = 'published';
    } else if (userId) {
      whereClause.authorId = userId;
      if (!session || session.user.id !== userId) {
        whereClause.status = 'published';
      }
    } else {
      whereClause.status = 'published';
    }
    
    if (type) whereClause.type = type;
    if (searchType) whereClause.searchType = searchType;
    if (query) {
      whereClause.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const cursor = searchParams.get('cursor');

    const totalStart = performance.now();

    const queryArgs: any = {
      where: whereClause,
      take: limit + 1,
      include: {
        author: {
          select: { id: true, name: true, lastName: true, email: true, image: true, gender: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ]
    };

    if (cursor) {
      queryArgs.cursor = { id: cursor };
      queryArgs.skip = 1;
    }

    const dbStart = performance.now();
    const rawPosts = await prisma.post.findMany(queryArgs);
    const dbDurationMs = Math.round(performance.now() - dbStart);

    let hasMore = false;
    let nextCursor: string | null = null;

    if (rawPosts.length > limit) {
      hasMore = true;
      rawPosts.pop();
      nextCursor = rawPosts[rawPosts.length - 1]?.id || null;
    }

    const formattedPosts = rawPosts.map(formatPost);
    const totalDurationMs = Math.round(performance.now() - totalStart);

    const responsePayload = (searchParams.has('cursor') || searchParams.has('limit') || searchParams.has('paginated'))
      ? { posts: formattedPosts, nextCursor, hasMore }
      : formattedPosts;

    const response = NextResponse.json(responsePayload);
    response.headers.set('Server-Timing', `db;dur=${dbDurationMs}, total;dur=${totalDurationMs}`);
    response.headers.set('X-Response-Time-DB', `${dbDurationMs}ms`);
    response.headers.set('X-Response-Time-Total', `${totalDurationMs}ms`);
    return response;
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

    if (user.faceVerifiedUntil && user.faceVerifiedUntil < new Date()) {
      return NextResponse.json({ error: 'Your face verification has expired. Please verify again in Settings.' }, { status: 400 });
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
    
    const isRoommateAndPlace = data.searchType === 'roommate_and_place';

    if (!data.title || !data.description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (data.title.length > 30) {
      return NextResponse.json({ error: 'Title cannot exceed 30 characters' }, { status: 400 });
    }

    if (isRoommateAndPlace) {
      if (!data.maxBudget) {
        return NextResponse.json({ error: 'Max budget is required' }, { status: 400 });
      }
      if (!data.wilaya) {
        return NextResponse.json({ error: 'Preferred wilaya is required' }, { status: 400 });
      }
    } else {
      if (!data.price || !data.location) {
        return NextResponse.json({ error: 'Price and location are required' }, { status: 400 });
      }
      const priceNum = Number(data.price);
      if (isNaN(priceNum) || priceNum < 1000) {
        return NextResponse.json({ error: 'Price must be at least 1,000 DA' }, { status: 400 });
      }
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        description: data.description,
        type: isRoommateAndPlace ? 'Profile' : (data.type || 'Apartment'),
        postType: data.postType || 'offer',
        searchType: data.searchType || 'roommate',
        price: data.price ? data.price.toString() : null,
        maxBudget: data.maxBudget ? data.maxBudget.toString() : null,
        location: data.location || null,
        wilaya: data.wilaya,
        bedrooms: (data.bedrooms && !isNaN(parseInt(data.bedrooms))) ? parseInt(data.bedrooms) : null,
        amenities: data.amenities ? (typeof data.amenities === 'string' ? data.amenities.split(',').map((s: string) => s.trim()).filter(Boolean) : data.amenities) : [],
        necessities: data.necessities ? (typeof data.necessities === 'string' ? data.necessities.split(',').map((s: string) => s.trim()).filter(Boolean) : data.necessities) : [],
        tags: data.tags ? (typeof data.tags === 'string' ? data.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : data.tags) : [],
        images: data.images || [],
        status: data.status || 'published',
        authorId: session.user.id
      }
    });

    return NextResponse.json(formatPost(post), { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create post' }, { status: 500 });
  }
}
