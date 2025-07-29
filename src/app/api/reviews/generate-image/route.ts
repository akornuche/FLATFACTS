import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import sharp, { Blend } from 'sharp';
import path from 'path';
import fs from 'fs/promises'; // For reading local files like logo

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reviewId = searchParams.get('reviewId');

  if (!reviewId) {
    return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { user: true }, // Include user to get username/avatar
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const username = review.isAnonymous ? 'Anonymous' : review.user?.name || 'Unknown User';
    // review.location is a Google Place ID. To display a human-readable name,
    // you would need to store the name in the Review model or make an API call
    // to Google Places API to resolve the ID to a name. For this example,
    // we'll use the ID or a placeholder.
    const locationDisplay = review.location; // Placeholder for actual location name
    const snippet = review.content.substring(0, 100) + (review.content.length > 100 ? '...' : '');
    const tags = review.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(', ');
    const starRating = '⭐'.repeat(review.star);

    // Define image dimensions
    const width = 800;
    const height = 400;
    const backgroundColor = '#FFFFFF'; // White background

    // Create a blank canvas
    let image = sharp({
      create: {
        width: width,
        height: height,
        channels: 4,
        background: backgroundColor,
      },
    });

    // Load Flatfacts logo (assuming it's in public/flatfacts-logo.svg)
    // You might need to adjust the path based on your actual logo location
    const logoPath = path.join(process.cwd(), 'public', 'flatfacts-logo.svg'); // Assuming SVG logo
    let logoBuffer;
    try {
      logoBuffer = await fs.readFile(logoPath);
    } catch (logoError) {
      console.warn('Flatfacts logo not found at', logoPath, '. Skipping logo overlay.');
      // Optionally, handle error or use a fallback image
    }

    // Prepare text overlays using SVG for better control over text rendering with Sharp
    // Note: For custom fonts, you might need to specify a font file path for Sharp.
    // Fonts need to be available in the environment where Sharp runs.
    // For Vercel/Next.js, you might need to bundle them or use system fonts.

    const composites = [];

    // Username
    const usernameSvg = `<svg width="${width}" height="50">
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="24" fill="#333">${username}</text>
    </svg>`;
    composites.push({ input: Buffer.from(usernameSvg), top: 20, left: 0 });

    // Star Rating
    const ratingSvg = `<svg width="${width}" height="50">
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="20" fill="#FFD700">${starRating}</text>
    </svg>`;
    composites.push({ input: Buffer.from(ratingSvg), top: 60, left: 0 });

    // Review Snippet
    const snippetSvg = `<svg width="${width}" height="150">
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="18" fill="#555">${snippet}</text>
    </svg>`;
    composites.push({ input: Buffer.from(snippetSvg), top: 100, left: 0 });

    // Tags
    const tagsSvg = `<svg width="${width}" height="50">
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="16" fill="#777">${tags}</text>
    </svg>`;
    composites.push({ input: Buffer.from(tagsSvg), top: 250, left: 0 });

    // Location (using placeholder for now)
    const locationSvg = `<svg width="${width}" height="50">
      <text x="20" y="30" font-family="Arial, sans-serif" font-size="16" fill="#777">${locationDisplay}</text>
    </svg>`;
    composites.push({ input: Buffer.from(locationSvg), top: 280, left: 0 });


    // Flatfacts Logo
    if (logoBuffer) {
      // Adjust position and blend mode as needed
      composites.push({ input: logoBuffer, top: height - 60, left: width - 150, blend: 'overlay' as Blend });
    }

    const outputBuffer = await image.composite(composites).png().toBuffer();

    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="review-${reviewId}.png"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating review image:', error);
    return NextResponse.json({ error: 'Failed to generate image', details: error.message }, { status: 500 });
  }
}
