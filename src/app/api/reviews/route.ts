import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isValidGooglePlaceId(id: string): boolean {
  // Google Place IDs are typically 27+ characters, start with "Ch", and are alphanumeric
  return /^Ch[A-Za-z0-9_-]{23,}$/.test(id);
}

// GET: Fetch all reviews
export async function GET() {
  const reviews = await prisma.review.findMany({
    include: { user: true, comments: true, votes: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(reviews);
}

// POST: Create a new review (authentication required)
export async function POST(req: NextRequest) {
  const data = await req.json();

  // Require userId (must be authenticated)
  if (!data.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Validate required fields
  if (!data.title || !data.content || !data.location || data.star === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Validate star rating
  if (![1, 2, 3].includes(data.star)) {
    return NextResponse.json({ error: 'Star rating must be 1, 2, or 3' }, { status: 400 });
  }

  // Validate tags (max 5)
  const tagsArray = data.tags ? data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
  if (tagsArray.length > 5) {
    return NextResponse.json({ error: 'No more than 5 tags allowed' }, { status: 400 });
  }

  // Validate Google Places ID
  if (!isValidGooglePlaceId(data.location)) {
    return NextResponse.json({ error: 'Invalid Google Places ID' }, { status: 400 });
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      userId: data.userId,
      isAnonymous: !!data.isAnonymous,
      title: data.title,
      content: data.content,
      tags: tagsArray.join(','),
      location: data.location,
      image: data.image,
      star: data.star,
    },
  });

  return NextResponse.json(review);
} 