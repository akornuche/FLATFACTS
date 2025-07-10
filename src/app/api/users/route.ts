import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// POST: Register a new user
export async function POST(req: NextRequest) {
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
  return NextResponse.json({ id: user.id, email: user.email });
} 