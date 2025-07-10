import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid, username, avatar } = req.body;
  if (!uid || !username || !avatar) {
    return res.status(400).json({ error: 'uid, username, and avatar are required' });
  }

  // Check if username is unique
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  // Update user profile
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    return res.status(404).json({ error: 'User not found' });
  }

  await updateDoc(userRef, {
    username,
    avatar,
    onboardingComplete: true,
  });

  return res.status(200).json({ success: true });
} 