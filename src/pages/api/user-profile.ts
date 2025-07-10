import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.query;
  if (!uid || typeof uid !== 'string') {
    return res.status(400).json({ error: 'uid is required as a query parameter' });
  }

  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userDoc.data();
  // Optionally, remove sensitive fields if any
  return res.status(200).json({ user });
} 