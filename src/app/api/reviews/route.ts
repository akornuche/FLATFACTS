import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function isValidGooglePlaceId(id: string): boolean {
  // Google Place IDs are typically 27+ characters, start with "Ch", and are alphanumeric
  return /^Ch[A-Za-z0-9_-]{23,}$/.test(id);
}

// GET: Fetch all reviews with sorting and filtering
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // --- Sorting Parameters ---
  const sortBy = searchParams.get('sortBy'); // 'recent' or 'rating'
  const order = searchParams.get('order');   // 'asc' or 'desc'

  let orderBy: any = { createdAt: 'desc' }; // Default sort by most recent

  if (sortBy === 'rating') {
    orderBy = { star: order === 'asc' ? 'asc' : 'desc' }; // Default to desc for top rated
  } else if (sortBy === 'recent') {
    orderBy = { createdAt: order === 'asc' ? 'asc' : 'desc' }; // Default to desc for most recent
  }

  // --- Filtering Parameters ---
  const tags = searchParams.get('tags');       // comma-separated string of tags
  const location = searchParams.get('location'); // string for location
  const starRating = searchParams.get('starRating'); // string, convert to number

  let where: any = {};

  if (tags) {
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tagsArray.length > 0) {
      // Use OR condition to find reviews that contain any of the specified tags
      where.OR = tagsArray.map(tag => ({
        tags: {
          contains: tag, // Case-sensitive contains
          mode: 'insensitive', // Make it case-insensitive
        },
      }));
    }
  }

  if (location) {
    where.location = location; // Exact match for location (Google Place ID)
  }

  if (starRating) {
    const ratingNum = parseInt(starRating, 10);
    if (!isNaN(ratingNum) && [1, 2, 3].includes(ratingNum)) {
      where.star = ratingNum;
    }
  }

  const reviews = await prisma.review.findMany({
    where,
    include: { user: true, comments: true, votes: true },
    orderBy,
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
