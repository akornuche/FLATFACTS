import type { NextApiRequest, NextApiResponse } from 'next';
import { sendOtpToUser } from '@/lib/otp'; // Import the reusable function
import prisma from '@/lib/prisma'; // Import prisma
import { hash } from 'bcrypt'; // Import bcrypt

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body; // Get password from body

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      // This is a new user registration
      if (!password) {
        return res.status(400).json({ error: 'Password is required for new registrations' });
      }
      const hashedPassword = await hash(password, 10);
      user = await prisma.user.create({
        data: {
          email: email,
          name: email.split('@')[0], // Default name from email
          password: hashedPassword, // Save the hashed password
        },
      });
    }
    // If user exists, we just proceed to send OTP to them.
    // Their password is not modified by this endpoint.

    const result = await sendOtpToUser(user); // Pass the actual Prisma user object

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(500).json({ error: 'Failed to send OTP', details: result.error });
    }
  } catch (error: any) {
    console.error('Error in send-otp API:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
