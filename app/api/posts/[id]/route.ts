import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

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
                image: true
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

    return NextResponse.json(post);
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

    if (!data.title || !data.description || !data.price || !data.location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
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
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
