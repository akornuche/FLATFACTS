import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth'; // Import getServerSession
import { authOptions } from '@/app/api/auth/authOptions'; // Import authOptions

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions); // Get session
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const userId = session.user.id; // Use userId from session
  const { username, avatar } = await req.json();

  if (!username && !avatar) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  try {
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
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    if (error.code === 'P2025') {
      // Record not found error from Prisma
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
