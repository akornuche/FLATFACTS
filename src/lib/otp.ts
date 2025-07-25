import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { User } from '@prisma/client'; // Import User type
import { db } from '../../firebaseConfig'; // Assuming firebaseConfig is accessible
import { collection, doc, setDoc } from 'firebase/firestore';

const prisma = new PrismaClient();

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

export async function sendOtpToUser(user: User) {
  const { email } = user;
  if (!email) {
    console.error('Cannot send OTP: User email is missing.');
    return { success: false, error: 'User email is missing.' };
  }

  // ✅ Check required Gmail API environment variables
  const {
    OAUTH_CLIENT_ID,
    OAUTH_CLIENT_SECRET,
    OAUTH_REFRESH_TOKEN,
    OAUTH_SENDER_EMAIL,
  } = process.env;

  if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !OAUTH_REFRESH_TOKEN || !OAUTH_SENDER_EMAIL) {
    console.error('Missing Gmail OAuth environment variables for sending OTP.');
    return { success: false, error: 'Gmail API configuration missing.' };
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  try {
   
    // --- Firestore Integration (if needed, requires Firebase setup) ---
    await setDoc(doc(collection(db, 'otp'), email), {
      otp,
      expiresAt,
    });
    
    console.log(`Generated OTP for ${email}: ${otp}`);

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
    return { success: true, message: 'OTP sent successfully.' };

  } catch (err: any) {
    console.error(`Failed to send OTP email to ${email}.`);
    console.error('Error message:', err.message);
    if (err.response) console.error('SMTP response:', err.response);
    if (err.code) console.error('SMTP error code:', err.code);
    return { success: false, error: `Failed to send OTP: ${err.message}` };
  }
}
