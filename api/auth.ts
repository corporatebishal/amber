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

// Simple session token generator
function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { username, password, action } = req.body;

    // Login
    if (action === 'login') {
      const adminUsername = process.env.ADMIN_USERNAME;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminUsername || !adminPassword) {
        return res.status(500).json({
          success: false,
          message: 'Admin credentials not configured',
        });
      }

      // Check credentials
      if (username === adminUsername && password === adminPassword) {
        const token = generateToken();

        try {
          const redis = await getRedisClient();
          // Store session token in Redis with 24 hour expiry
          await redis.setEx(`session:${token}`, 86400, JSON.stringify({ username }));
        } catch (error) {
          console.error('Redis error:', error);
        }

        return res.status(200).json({
          success: true,
          token,
          username,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Logout
    if (action === 'logout') {
      const { token } = req.body;

      try {
        const redis = await getRedisClient();
        await redis.del(`session:${token}`);
      } catch (error) {
        console.error('Redis error:', error);
      }

      return res.status(200).json({ success: true });
    }

    // Verify token
    if (action === 'verify') {
      const { token } = req.body;

      try {
        const redis = await getRedisClient();
        const sessionData = await redis.get(`session:${token}`);

        if (sessionData) {
          const session = JSON.parse(sessionData);
          return res.status(200).json({
            success: true,
            username: session.username,
          });
        }
      } catch (error) {
        console.error('Redis error:', error);
      }

      return res.status(401).json({ success: false });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
