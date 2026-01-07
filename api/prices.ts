import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const AMBER_BASE_URL = 'https://api.amber.com.au/v1';

interface PriceData {
  current: any;
  forecast: any[];
  history: any[];
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

    // Fetch current prices
    const pricesResponse = await axios.get(
      `${AMBER_BASE_URL}/sites/${activeSite.id}/prices/current`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          next: 48, // Next 24 hours
        },
      }
    );

    const prices = pricesResponse.data;
    console.log('All prices:', JSON.stringify(prices, null, 2));

    const feedInPrices = prices.filter((p: any) => p.channelType === 'feedIn');
    console.log('Feed-in prices count:', feedInPrices.length);

    const currentInterval = feedInPrices.find((p: any) => p.type === 'CurrentInterval');
    const forecastIntervals = feedInPrices.filter((p: any) => p.type === 'ForecastInterval');

    console.log('Current interval:', currentInterval ? 'found' : 'not found');
    console.log('Forecast intervals:', forecastIntervals.length);

    const priceData: PriceData = {
      current: currentInterval ? {
        price: currentInterval.perKwh,
        spotPerKwh: currentInterval.spotPerKwh,
        descriptor: currentInterval.descriptor,
        renewables: currentInterval.renewables,
        estimate: currentInterval.estimate || false,
        spikeStatus: currentInterval.spikeStatus,
        endTime: currentInterval.endTime,
        nemTime: currentInterval.nemTime,
      } : null,
      forecast: forecastIntervals.map((interval: any) => ({
        price: interval.perKwh,
        nemTime: interval.nemTime,
        descriptor: interval.descriptor,
        renewables: interval.renewables,
        type: interval.type,
      })),
      history: [], // Note: History not available in serverless, would need a database
    };

    return res.status(200).json(priceData);
  } catch (error: any) {
    console.error('Error fetching prices:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch prices',
      message: error.message
    });
  }
}
