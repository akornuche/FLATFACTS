import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../firebaseConfig';
import { collection, doc, getDoc } from 'firebase/firestore';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
  }

  try {
    // --- Firestore Integration (if needed, requires Firebase setup) ---
    // Get the stored OTP from Firestore
    const otpRef = doc(collection(db, 'otp'), email);
    const otpDoc = await getDoc(otpRef);

    if (!otpDoc.exists()) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const otpData = otpDoc.data();
    if (otpData.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (otpData.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }
    // --- End Firestore Integration ---

    // For now, we'll skip the Firestore check and always return success.
    // In a real scenario, you'd need to ensure OTP storage is handled.
    // console.log(`Verified OTP for ${email}`);

    // Mark the user as verified in your Prisma database
    await prisma.user.update({
      where: { email: email },
      data: { verified: true },
    });

    // Clear the OTP from Firestore after successful verification (optional)
    // await deleteDoc(otpRef);

    return NextResponse.json({ success: true, message: 'Email verified successfully' });

  } catch (error: any) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
