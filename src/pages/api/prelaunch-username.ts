import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv:;
  const dbName = 'test';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required as a query parameter' });
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const waitlist = db.collection('waitlist'); // <-- Updated to use 'waitlist' collection
    const user = await waitlist.findOne({ email });
    if (user) {
      return res.status(200).json({ 
        found: true, 
        username: user.username, // <-- Return username instead of name
        email: user.email 
      });
    } else {
      return res.status(200).json({ found: false });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Database error', details: (err as Error).message });
  } finally {
    await client.close();
  }
} 
