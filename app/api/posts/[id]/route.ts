import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { formatPost, stringifyJsonField } from '@/lib/prisma-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unwrappedParams = await params;
    const post = await prisma.post.findUnique({
      where: { id: unwrappedParams.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            lastName: true,
            image: true,
            email: true,
            phone: true,
            gender: true,
            birthday: true,
            bio: true,
            wilaya: true,
            city: true,
            identityVerified: true,
            faceVerified: true
          }
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                lastName: true,
                image: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json(formatPost(post));
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const unwrappedParams = await params;
    const { id } = unwrappedParams;
    const session = await auth.api.getSession({ headers: await headers() });
                         
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();

    if (!data.title || !data.description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    if (data.title.length > 30) {
      return NextResponse.json({ error: 'Title cannot exceed 30 characters' }, { status: 400 });
    }

    const isRoommateAndPlace = data.searchType === 'roommate_and_place';

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

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: isRoommateAndPlace ? 'Profile' : (data.type || 'Apartment'),
        postType: data.postType || 'offer',
        searchType: data.searchType || post.searchType || 'roommate',
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
      }
    });

    return NextResponse.json(formatPost(updatedPost));
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: error?.message || 'Failed to update post' }, { status: 500 });
  }
}
