import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions'; // Using alias for cleaner path
import prisma from '@/lib/prisma';

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}

export async function getUserId() {
    const session = await getServerSession(authOptions);
    return (session?.user as any)?.id ?? null;
}
