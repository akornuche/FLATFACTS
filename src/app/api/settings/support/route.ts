import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/session';

export async function POST(req: NextRequest) {
  // Get the user ID if the user is logged in. This is optional.
  const userId = await getUserId();

  const { name, email, message } = await req.json();

  // --- Validation ---
  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
  }

  try {
    await prisma.supportMessage.create({
      data: {
        userId: userId, // Can be null
        name: name,
        email: email,
        message: message,
      },
    });

    return NextResponse.json({ success: true, message: 'Support message received. We will get back to you shortly.' });

  } catch (error) {
    console.error('Error saving support message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
