import dotenv from 'dotenv';
import { configSchema, type AppConfig } from './types.js';

// Load environment variables
dotenv.config();

function loadConfig(): AppConfig {
  const rawConfig = {
    amber: {
      apiKey: process.env.AMBER_API_KEY || '',
      siteId: process.env.AMBER_SITE_ID,
      baseUrl: process.env.AMBER_BASE_URL || 'https://api.amber.com.au/v1',
    },
    monitoring: {
      feedInThreshold: parseFloat(process.env.FEED_IN_THRESHOLD || '15.0'),
      checkInterval: process.env.CHECK_INTERVAL || '*/5 * * * *',
      timezone: process.env.TIMEZONE || 'Australia/Sydney',
    },
    notifications: {
      channels: (process.env.NOTIFICATION_CHANNELS || 'console,desktop')
        .split(',')
        .map(c => c.trim())
        .filter(Boolean),
    },
    logging: {
      level: (process.env.LOG_LEVEL || 'info') as 'info',
      pretty: process.env.LOG_PRETTY === 'true',
    },
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    console.error('Configuration validation failed:');
    console.error(error);
    process.exit(1);
  }
}

export const config = loadConfig();
