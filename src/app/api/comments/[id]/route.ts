import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/authOptions';

const prisma = new PrismaClient();

// PATCH: Update a comment by ID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'You must login to update a comment.' }, { status: 401 });
  }
  const data = await req.json();
  const comment = await prisma.comment.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(comment);
}

// DELETE: Delete a comment by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'You must login to delete a comment.' }, { status: 401 });
  }
  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  const user = session.user as { id?: string; isAdmin?: boolean };
  if (comment.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
} 