import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AppSettings {
  feedInThreshold: number;
  timezone: string;
  notificationChannels: string[];
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const settings: AppSettings = {
    feedInThreshold: parseFloat(process.env.FEED_IN_THRESHOLD || '15.0'),
    timezone: process.env.TIMEZONE || 'Australia/Sydney',
    notificationChannels: ['console'], // Serverless = console only
  };

  return res.status(200).json(settings);
}
