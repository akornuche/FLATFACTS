import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserId } from '@/lib/session';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q'); // Search keyword
  const tag = searchParams.get('tag');
  const rating = searchParams.get('rating'); // Expects a number as a string
  const dateFrom = searchParams.get('dateFrom'); // Expects ISO date string
  const dateTo = searchParams.get('dateTo'); // Expects ISO date string
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const where: Prisma.ReviewWhereInput = {
    userId: userId,
    deletedAt: null, // --- IMPORTANT: Exclude soft-deleted reviews ---
  };

  // Keyword search
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }

  // Filters
  if (tag) {
    where.tags = { contains: tag, mode: 'insensitive' };
  }
  if (rating) {
    const ratingNum = parseInt(rating, 10);
    if (!isNaN(ratingNum)) {
      where.star = ratingNum;
    }
  }
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo);
    }
  }

  try {
    const reviews = await prisma.review.findMany({
      where,
      select: {
        id: true,
        title: true,
        content: true, // We can truncate this on the frontend
        star: true,
        tags: true,
        createdAt: true,
        // Select other summarized fields as needed
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalReviews = await prisma.review.count({ where });

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total: totalReviews,
        totalPages: Math.ceil(totalReviews / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
