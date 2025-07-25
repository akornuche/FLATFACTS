import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { getCurrentUser } from '@/lib/session';

// PATCH: Update a review by ID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'You must login to update a review.' }, { status: 401 });
  }
  // Add ownership check for PATCH as well
  const reviewToUpdate = await prisma.review.findUnique({ where: { id: params.id } });
  if (!reviewToUpdate || reviewToUpdate.userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const data = await req.json();
  const review = await prisma.review.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(review);
}

// DELETE: Soft delete a review by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'You must login to delete a review.' }, { status: 401 });
  }

  const review = await prisma.review.findUnique({ where: { id: params.id } });
  if (!review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  // Check if the user owns the review or is an admin
  if (review.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Perform a soft delete
  await prisma.review.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true, message: 'Review has been deleted.' });
}
