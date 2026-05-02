import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');
    const query = searchParams.get('query');

    const whereClause: any = { isArchived: false };
    if (userId) {
      whereClause.authorId = userId; // Allow fetching user's own posts/drafts
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
          select: { name: true, image: true }
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
    // Get the current user session from cookies
    const sessionToken = request.cookies.get('better-auth.session_token')?.value || 
                         request.cookies.get('__Secure-better-auth.session_token')?.value;
                         
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Need to get session user
    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true }
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validate required fields (in a real app, use Zod)
    if (!data.title || !data.description || !data.price || !data.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'Apartment',
        postType: data.postType || 'offer',
        price: parseFloat(data.price),
        location: data.location,
        wilaya: data.wilaya,
        bedrooms: data.bedrooms ? parseInt(data.bedrooms) : null,
        bathrooms: data.bathrooms ? parseInt(data.bathrooms) : null,
        amenities: data.amenities ? data.amenities.split(',').map((s: string) => s.trim()) : [],
        tags: data.tags ? data.tags.split(',').map((s: string) => s.trim()) : [],
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
