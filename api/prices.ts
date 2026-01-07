import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { createClient } from 'redis';

const AMBER_BASE_URL = 'https://api.amber.com.au/v1';

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

    // Get both feedIn and general prices
    const feedInPrices = prices.filter((p: any) => p.channelType === 'feedIn');
    const generalPrices = prices.filter((p: any) => p.channelType === 'general');

    console.log('Feed-in prices count:', feedInPrices.length);
    console.log('General prices count:', generalPrices.length);

    // Use feedIn as default, but send both
    const feedInCurrent = feedInPrices.find((p: any) => p.type === 'CurrentInterval');
    const feedInForecast = feedInPrices.filter((p: any) => p.type === 'ForecastInterval');

    const generalCurrent = generalPrices.find((p: any) => p.type === 'CurrentInterval');
    const generalForecast = generalPrices.filter((p: any) => p.type === 'ForecastInterval');

    // Use feedIn for history (default)
    const currentInterval = feedInCurrent || generalCurrent;
    const forecastIntervals = feedInForecast.length > 0 ? feedInForecast : generalForecast;

    console.log('Current interval:', currentInterval ? 'found' : 'not found');
    console.log('Forecast intervals:', forecastIntervals.length);

    // Store current price in Redis for history
    let history: any[] = [];
    if (currentInterval) {
      const historyEntry = {
        price: currentInterval.perKwh,
        nemTime: currentInterval.nemTime,
        descriptor: currentInterval.descriptor,
        renewables: currentInterval.renewables,
        timestamp: new Date().toISOString(),
      };

      try {
        const redis = await getRedisClient();

        // Get existing history from Redis
        const historyJson = await redis.get('price-history');
        const existingHistory: any[] = historyJson ? JSON.parse(historyJson) : [];

        // If history is empty, use current price as the only history point
        if (existingHistory.length === 0) {
          existingHistory.push(historyEntry);
          console.log('Initialized price history with current interval');
        } else {
          // Add new entry (avoid duplicates by checking nemTime)
          if (existingHistory[0].nemTime !== historyEntry.nemTime) {
            existingHistory.unshift(historyEntry);
          }
        }

        // Keep max 288 records (24 hours at 5min intervals)
        history = existingHistory.slice(0, 288);

        // Store back to Redis with 24 hour expiry
        await redis.setEx('price-history', 86400, JSON.stringify(history));
      } catch (redisError) {
        console.error('Redis error:', redisError);
        // Continue even if Redis fails
      }
    }

    const priceData: any = {
      current: currentInterval ? {
        price: currentInterval.perKwh,
        spotPerKwh: currentInterval.spotPerKwh,
        descriptor: currentInterval.descriptor,
        renewables: currentInterval.renewables,
        estimate: currentInterval.estimate || false,
        spikeStatus: currentInterval.spikeStatus,
        endTime: currentInterval.endTime,
        nemTime: currentInterval.nemTime,
        channelType: currentInterval.channelType,
      } : null,
      forecast: forecastIntervals.map((interval: any) => ({
        price: interval.perKwh,
        nemTime: interval.nemTime,
        descriptor: interval.descriptor,
        renewables: interval.renewables,
        type: interval.type,
        channelType: interval.channelType,
      })),
      history: history,
      // Include both channel types for toggling
      feedIn: {
        current: feedInCurrent ? {
          price: feedInCurrent.perKwh,
          spotPerKwh: feedInCurrent.spotPerKwh,
          descriptor: feedInCurrent.descriptor,
          renewables: feedInCurrent.renewables,
          estimate: feedInCurrent.estimate || false,
          spikeStatus: feedInCurrent.spikeStatus,
          endTime: feedInCurrent.endTime,
          nemTime: feedInCurrent.nemTime,
        } : null,
        forecast: feedInForecast.map((interval: any) => ({
          price: interval.perKwh,
          nemTime: interval.nemTime,
          descriptor: interval.descriptor,
          renewables: interval.renewables,
          type: interval.type,
        })),
      },
      general: {
        current: generalCurrent ? {
          price: generalCurrent.perKwh,
          spotPerKwh: generalCurrent.spotPerKwh,
          descriptor: generalCurrent.descriptor,
          renewables: generalCurrent.renewables,
          estimate: generalCurrent.estimate || false,
          spikeStatus: generalCurrent.spikeStatus,
          endTime: generalCurrent.endTime,
          nemTime: generalCurrent.nemTime,
        } : null,
        forecast: generalForecast.map((interval: any) => ({
          price: interval.perKwh,
          nemTime: interval.nemTime,
          descriptor: interval.descriptor,
          renewables: interval.renewables,
          type: interval.type,
        })),
      },
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
