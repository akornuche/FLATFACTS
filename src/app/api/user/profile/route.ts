import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  // In production, get userId from session/auth middleware
  const { userId, username, avatar } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!username && !avatar) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  // Update user profile
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(username && { name: username }),
      ...(avatar && { image: avatar }),
    },
  });

  // Propagate changes to all reviews
  await prisma.review.updateMany({
    where: { userId },
    data: {
      ...(username && { userName: username }),
      ...(avatar && { userAvatar: avatar }),
    },
  });

  // Propagate to comments as well
  await prisma.comment.updateMany({
    where: { userId },
    data: {
      ...(username && { userName: username }),
      ...(avatar && { userAvatar: avatar }),
    },
  });

  return NextResponse.json({ success: true, user });
} 