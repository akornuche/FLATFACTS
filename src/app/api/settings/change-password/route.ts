import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getUserId } from '@/lib/session';

export async function POST(req: NextRequest) {
  const userId = await getUserId();

  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { currentPassword, newPassword, confirmNewPassword } = await req.json();

  // --- Basic Validation ---
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return NextResponse.json({ error: 'All password fields are required' }, { status: 400 });
  }
  if (newPassword !== confirmNewPassword) {
    return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });
  }
  if (newPassword.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
  }

  try {
    // --- Fetch User ---
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // --- Check if user can change password ---
    if (!user.password) {
      return NextResponse.json({ error: 'This user cannot change their password as they registered via an OAuth provider.' }, { status: 403 });
    }

    // --- Verify Current Password ---
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid current password' }, { status: 400 });
    }

    // --- Hash and Update New Password ---
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
