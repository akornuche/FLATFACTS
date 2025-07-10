import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // ✅ Check required SMTP environment variables
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    console.error('Missing SMTP environment variables');
    return res.status(500).json({ error: 'SMTP configuration missing' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    // Store OTP in Firestore
    await setDoc(doc(collection(db, 'otp'), email), {
      otp,
      expiresAt,
    });

    // ✅ Configure transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: false, // for TLS (Gmail requires this on port 587)
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // ✅ Verify transporter connection
    console.log('Verifying SMTP transporter...');
    await transporter.verify();
    console.log('SMTP transporter verified and ready to send.');

    // ✅ Send the email
    console.log(`Sending OTP email to: ${email}`);
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: 'Your FlatFacts OTP Code',
      text: `Your OTP code is: ${otp}`,
    });

    console.log(`OTP email successfully sent to ${email}`);
    return res.status(200).json({ success: true });

  } catch (err: any) {
    console.error('Failed to send OTP email.');
    console.error('Error message:', err.message);
    if (err.response) console.error('SMTP response:', err.response);
    if (err.code) console.error('SMTP error code:', err.code);
    return res.status(500).json({ error: 'Failed to send OTP email', details: err.message });
  }
}
