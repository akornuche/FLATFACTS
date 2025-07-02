import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Upvote or downvote a review or comment
export async function POST(req: NextRequest) {
  const data = await req.json();
  let where: any = {};
  if (data.reviewId) {
    where = { userId_reviewId: { userId: data.userId, reviewId: data.reviewId } };
  } else if (data.commentId) {
    where = { userId_commentId: { userId: data.userId, commentId: data.commentId } };
  } else {
    throw new Error('Either reviewId or commentId must be provided');
  }

  const vote = await prisma.vote.upsert({
    where,
    update: { value: data.value },
    create: {
      userId: data.userId,
      reviewId: data.reviewId || null,
      commentId: data.commentId || null,
      value: data.value,
    },
  });
  return NextResponse.json(vote);
} 