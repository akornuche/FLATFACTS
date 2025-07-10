import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebaseConfig';
import { doc, getDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, otp, password } = req.body;
  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'Email, OTP, and password are required' });
  }

  // Get OTP from Firestore
  const otpDoc = await getDoc(doc(db, 'otp', email));
  if (!otpDoc.exists()) {
    return res.status(400).json({ error: 'OTP not found or expired' });
  }
  const { otp: storedOtp, expiresAt } = otpDoc.data() as { otp: string; expiresAt: number };
  if (Date.now() > expiresAt) {
    await deleteDoc(doc(db, 'otp', email));
    return res.status(400).json({ error: 'OTP expired' });
  }
  if (otp !== storedOtp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // OTP is valid, delete it
  await deleteDoc(doc(db, 'otp', email));

  // Create Firebase Auth user (client SDK for demo; use Admin SDK in production)
  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      onboardingComplete: false,
      createdAt: serverTimestamp(),
    });

    return res.status(200).json({ success: true, uid: user.uid, email: user.email });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create user' });
  }
} 