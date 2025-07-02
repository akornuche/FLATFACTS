import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all reviews
export async function GET() {
  const reviews = await prisma.review.findMany({
    include: { user: true, comments: true, votes: true },
  });
  return NextResponse.json(reviews);
}

// POST: Create a new review (anonymous allowed)
export async function POST(req: NextRequest) {
  const data = await req.json();
  const review = await prisma.review.create({
    data: {
      userId: data.userId || null, // allow null for anonymous
      title: data.title,
      content: data.content,
      tags: data.tags, // comma-separated string
      location: data.location,
      image: data.image,
    },
  });
  return NextResponse.json(review);
} 