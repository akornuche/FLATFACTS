import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

const uri = 'mongodb+srv://southcircleandco:eD3t14Y3OtZpp5Ws@waitlist.kh2fkme.mongodb.net/test?retryWrites=true&w=majority&appName=Waitlist';
const dbName = 'test';

function toCSV(data: any[]): string {
  if (!data.length) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  return [headers.join(','), ...rows].join('\n');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const API_KEY = process.env.WAITLIST_EXPORT_API_KEY;
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    const waitlist = db.collection('waitlist');
    const documents = await waitlist.find({}).toArray();
    const cleanData = documents.map(doc => ({
      email: doc.email,
      username: doc.username,
      review: doc.review,
      location: doc.location,
      emailSent: doc.emailSent,
      adminNotified: doc.adminNotified,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
    const csv = toCSV(cleanData);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waitlist-export.csv"');
    res.status(200).send(csv);
    await client.close();
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Failed to fetch waitlist data' });
  }
} 