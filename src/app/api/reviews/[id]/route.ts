import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/authOptions';

const prisma = new PrismaClient();

// PATCH: Update a review by ID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'You must login to update a review.' }, { status: 401 });
  }
  const data = await req.json();
  const review = await prisma.review.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(review);
}

// DELETE: Delete a review by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'You must login to delete a review.' }, { status: 401 });
  }
  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }
  const user = session.user as { id?: string; isAdmin?: boolean };
  if (review.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.review.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
} 