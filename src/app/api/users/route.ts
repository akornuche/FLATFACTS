import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { migrateWaitlistReviews } from '@/lib/waitlist';
import { sendOtpToUser } from '@/lib/otp';

// POST: Register a new user
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.email || !data.password || !data.confirmPassword) {
      return NextResponse.json({ error: 'Email, password, and confirm password are required' }, { status: 400 });
    }
    
    // Validate password confirmation
    if (data.password !== data.confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }
    
    // Validate password length
    if (data.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.email.split('@')[0], // Use email prefix as default name
        email: data.email,
        password: hashedPassword,
        image: null,
      },
    });

    // After creating the user, try to migrate their waitlist reviews
    await migrateWaitlistReviews(user);

    // After creating the user, try to send OTP
    const otpResult = await sendOtpToUser(user);
    if (!otpResult.success) {
      console.error("Failed to send OTP after registration:", otpResult.error);
      // Consider whether to return an error or just log it.
      // For now, we'll log it and continue, as OTP sending failure shouldn't block registration.
    }

    return NextResponse.json({ id: user.id, email: user.email, otpSent: otpResult.success });

  } catch (error) {
    console.error("User registration failed:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
