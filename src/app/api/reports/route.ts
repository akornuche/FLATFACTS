import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { reviewId, reporterUserId, reason, otherReason } = data;

  // 1. Validate required fields
  if (!reviewId || !reporterUserId || !reason) {
    return NextResponse.json({ error: 'Missing required fields: reviewId, reporterUserId, and reason' }, { status: 400 });
  }

  // 2. Validate reporterUserId (must be authenticated)
  // Assuming reporterUserId comes from an authenticated session.
  // In a real app, you'd verify this against the session/token.
  // For now, we'll just check if it's present.
  // TODO: Integrate with NextAuth.js session to get authenticated user ID
  // const session = await getServerSession(authOptions);
  // if (!session || session.user.id !== reporterUserId) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // Validate reason
  const validReasons = [
    'False Info',
    'Offensive or Abusive',
    'Spam',
    'Duplicate Review',
    'Misleading Content',
    'Other',
  ];
  if (!validReasons.includes(reason)) {
    return NextResponse.json({ error: 'Invalid report reason' }, { status: 400 });
  }

  if (reason === 'Other' && !otherReason) {
    return NextResponse.json({ error: 'Other reason requires text input' }, { status: 400 });
  }

  try {
    // 3. Check if user has already reported this review
    const existingReport = await prisma.report.findUnique({
      where: {
        reviewId_reporterUserId: {
          reviewId: reviewId,
          reporterUserId: reporterUserId,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json({ error: 'You have already reported this review.' }, { status: 409 });
    }

    // 4. Save the report to the database
    const report = await prisma.report.create({
      data: {
        reviewId: reviewId,
        reporterUserId: reporterUserId,
        reason: reason,
        otherReason: reason === 'Other' ? otherReason : null,
      },
    });

    // 5. Return success message
    return NextResponse.json({ success: true, message: 'Review reported successfully.', reportId: report.id }, { status: 201 });

  } catch (error: any) {
    console.error('Error reporting review:', error);
    // Handle Prisma unique constraint error (P2002) if findUnique check is removed
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already reported this review.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to report review', details: error.message }, { status: 500 });
  }
}
