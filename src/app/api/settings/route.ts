import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/session';

export async function GET(req: NextRequest) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Determine if the user has a password set
    const hasPassword = user.password !== null;

    return NextResponse.json({
      email: user.email,
      hasPassword: hasPassword,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
