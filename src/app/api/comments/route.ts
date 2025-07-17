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

// POST: Create a new comment (authentication required)
export async function POST(req: NextRequest) {
  const data = await req.json();

  // Require userId (must be authenticated)
  if (!data.userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Validate required fields
  if (!data.reviewId || !data.content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      reviewId: data.reviewId,
      userId: data.userId,
      isAnonymous: !!data.isAnonymous,
      content: data.content,
      parentId: data.parentId || null,
    },
  });
  return NextResponse.json(comment);
} 