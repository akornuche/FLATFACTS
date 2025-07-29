import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../firebaseConfig';
import { collection, doc, getDoc } from 'firebase/firestore';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { email, otp } = await req.json();

  console.log(`[verify-otp] Received verification request for email: ${email}, OTP: ${otp}`);

  if (!email || !otp) {
    return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
  }

  try {
    // --- Firestore Integration (if needed, requires Firebase setup) ---
    // Get the stored OTP from Firestore
    const otpRef = doc(collection(db, 'otp'), email);
    const otpDoc = await getDoc(otpRef);

    console.log(`[verify-otp] OTP document exists: ${otpDoc.exists()}`);

    if (!otpDoc.exists()) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    const otpData = otpDoc.data();
    console.log(`[verify-otp] Stored OTP: ${otpData.otp}, Stored ExpiresAt: ${new Date(otpData.expiresAt).toISOString()}, Current Time: ${new Date(Date.now()).toISOString()}`);

    if (otpData.otp !== otp) {
      console.log(`[verify-otp] OTP mismatch: Received ${otp}, Stored ${otpData.otp}`);
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (otpData.expiresAt < Date.now()) {
      console.log(`[verify-otp] OTP expired: Stored ExpiresAt ${new Date(otpData.expiresAt).toISOString()}, Current Time ${new Date(Date.now()).toISOString()}`);
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }
    // --- End Firestore Integration ---

    // For now, we'll skip the Firestore check and always return success.
    // In a real scenario, you'd need to ensure OTP storage is handled.
    // console.log(`Verified OTP for ${email}`); // This log is now more detailed above

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      console.error(`[verify-otp] User with email ${email} not found in Prisma database.`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Mark the user as verified in your Prisma database
    await prisma.user.update({
      where: { email: email },
      data: { verified: true },
    });
    console.log(`[verify-otp] User ${email} marked as verified in Prisma.`);

    // Clear the OTP from Firestore after successful verification (optional)
    // await deleteDoc(otpRef);

    return NextResponse.json({ success: true, message: 'Email verified successfully' });

    return NextResponse.json({ success: true, message: 'Email verified successfully' });

  } catch (error: any) {
    console.error('Failed to verify OTP:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
