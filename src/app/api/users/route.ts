import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// POST: Register a new user
export async function POST(req: NextRequest) {
  const data = await req.json();
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      image: data.image || null,
    },
  });
  return NextResponse.json({ id: user.id, name: user.name, email: user.email, image: user.image });
} 