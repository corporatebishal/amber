import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const AMBER_BASE_URL = 'https://api.amber.com.au/v1';

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
    const apiKey = process.env.AMBER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Fetch sites first
    const sitesResponse = await axios.get(`${AMBER_BASE_URL}/sites`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const sites = sitesResponse.data;
    const activeSite = sites.find((s: any) => s.status === 'active');

    if (!activeSite) {
      return res.status(404).json({ error: 'No active sites found' });
    }

    // Calculate date range for last 24 hours
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

    // Fetch usage data from Amber API
    const usageResponse = await axios.get(
      `${AMBER_BASE_URL}/sites/${activeSite.id}/usage`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          resolution: 30, // 30-minute intervals
        },
      }
    );

    return res.status(200).json({
      usage: usageResponse.data,
    });
  } catch (error: any) {
    console.error('Error fetching usage data:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch usage data',
      message: error.message,
    });
  }
}
