import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from 'redis';

// Redis client singleton
let redisClient: any = null;
async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });
    await redisClient.connect();
  }
  return redisClient;
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

  try {
    const redis = await getRedisClient();

    // Get usage data from Redis
    const usageJson = await redis.get('usage-data');
    const usageData: any[] = usageJson ? JSON.parse(usageJson) : [];

    // Calculate totals
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayUsage = usageData
      .filter((entry: any) => new Date(entry.timestamp) >= todayStart)
      .reduce((sum: number, entry: any) => sum + (entry.usage || 0), 0);

    const monthUsage = usageData
      .filter((entry: any) => new Date(entry.timestamp) >= monthStart)
      .reduce((sum: number, entry: any) => sum + (entry.usage || 0), 0);

    return res.status(200).json({
      usage: usageData,
      current: usageData.length > 0 ? usageData[0].usage : 0,
      today: todayUsage,
      thisMonth: monthUsage,
    });
  } catch (error: any) {
    console.error('Error fetching usage data:', error);
    return res.status(500).json({
      error: 'Failed to fetch usage data',
      message: error.message,
    });
  }
}
