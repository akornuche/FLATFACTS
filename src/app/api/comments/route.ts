import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch all comments
export async function GET() {
  const comments = await prisma.comment.findMany({
    include: { user: true, review: true, votes: true, replies: true },
  });
  return NextResponse.json(comments);
}

// POST: Create a new comment (anonymous allowed)
export async function POST(req: NextRequest) {
  const data = await req.json();
  const comment = await prisma.comment.create({
    data: {
      reviewId: data.reviewId,
      userId: data.userId || null, // allow null for anonymous
      content: data.content,
      parentId: data.parentId || null,
    },
  });
  return NextResponse.json(comment);
} 