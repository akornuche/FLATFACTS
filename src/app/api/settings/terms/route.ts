import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    // Construct the path to the file in the public directory
    const filePath = path.join(process.cwd(), 'public', 'terms.pdf');

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Create the response
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="terms.pdf"', // 'inline' suggests opening in browser
      },
    });

    return response;

  } catch (error) {
    console.error('Error serving PDF file:', error);
    // Check if the error is because the file doesn't exist
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
