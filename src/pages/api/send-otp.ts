import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';

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

  // ✅ Check required Gmail API environment variables
  const {
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN,
    OAUTH_SENDER_EMAIL,
  } = process.env;

  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !OAUTH_REFRESH_TOKEN || !OAUTH_SENDER_EMAIL) {
    console.error('Missing Gmail OAuth environment variables');
    return res.status(500).json({ error: 'Gmail API configuration missing' });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
    // Store OTP in Firestore
    await setDoc(doc(collection(db, 'otp'), email), {
      otp,
      expiresAt,
    });

    // ✅ Configure OAuth2 client
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      OAUTH_CLIENT_ID,
      OAUTH_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Redirect URL
    );

    oauth2Client.setCredentials({
      refresh_token: OAUTH_REFRESH_TOKEN,
    });
    
    const accessToken = await oauth2Client.getAccessToken();

    // ✅ Configure transporter with Gmail and OAuth2
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: OAUTH_SENDER_EMAIL,
        clientId: OAUTH_CLIENT_ID,
        clientSecret: OAUTH_CLIENT_SECRET,
        refreshToken: OAUTH_REFRESH_TOKEN,
        accessToken: accessToken.token as string,
      },
    });

    // ✅ Send the email
    console.log(`Sending OTP email to: ${email}`);
    await transporter.sendMail({
      from: OAUTH_SENDER_EMAIL,
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
