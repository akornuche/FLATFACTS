import type { NextApiRequest, NextApiResponse } from 'next';
import { sendOtpToUser } from '@/lib/otp'; // Import the reusable function

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = {
    id: 'N/A',
    email: email,
    name: email.split('@')[0],
    password: null,
    image: null,
    isAdmin: false,
    verified: false,
    createdAt: new Date(),
  };

  const result = await sendOtpToUser(user);

  if (result.success) {
    return res.status(200).json({ success: true, message: result.message });
  } else {
    return res.status(500).json({ error: 'Failed to send OTP', details: result.error });
  }
}
