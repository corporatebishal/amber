import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import pinoHttp from 'pino-http';
import { amberClient } from '../api/client.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import type { PriceData, AppSettings } from './types.js';
import { fileStorage } from '../storage/file-storage.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebServer {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private wss: WebSocketServer;
  private port: number;
  private priceHistory: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    timestamp: string;
  }> = [];
  private usageHistory: Array<{
    kwh: number;
    cost: number;
    nemTime: string;
    channelType: string;
    quality: string;
    timestamp: string;
  }> = [];
  private readonly MAX_HISTORY = 288; // 24 hours of 5-min intervals

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(pinoHttp({ logger }));

    // Serve static files from web/dist
    const webDistPath = path.join(__dirname, '..', '..', 'web', 'dist');
    if (fs.existsSync(webDistPath)) {
      this.app.use(express.static(webDistPath));
    }
  }

  private setupRoutes(): void {
    // API Routes
    this.app.get('/api/health', (_req: Request, res: Response) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    this.app.get('/api/prices/current', async (_req: Request, res: Response) => {
      try {
        const prices = await amberClient.getCurrentPrices(undefined, {
          next: 48, // Next 24 hours
          previous: 0,
        });

        // Try feed-in first (for solar), fall back to general (for consumption)
        let targetPrices = prices.filter(p => p.channelType === 'feedIn');

        if (targetPrices.length === 0) {
          logger.info('No feed-in channel found, using general consumption channel');
          targetPrices = prices.filter(p => p.channelType === 'general');
        }

        const currentInterval = targetPrices.find(p => p.type === 'CurrentInterval');
        const forecastIntervals = targetPrices.filter(p => p.type === 'ForecastInterval');

        const priceData: PriceData = {
          current: currentInterval ? {
            price: currentInterval.perKwh,
            spotPerKwh: currentInterval.spotPerKwh,
            descriptor: currentInterval.descriptor,
            renewables: currentInterval.renewables,
            estimate: (currentInterval as any).estimate || false,
            spikeStatus: currentInterval.spikeStatus,
            endTime: currentInterval.endTime,
            nemTime: currentInterval.nemTime,
          } : null,
          forecast: forecastIntervals.map(interval => ({
            price: interval.perKwh,
            nemTime: interval.nemTime,
            descriptor: interval.descriptor,
            renewables: interval.renewables,
            type: interval.type,
          })),
          history: this.priceHistory,
        };

        // Include rate limit info in response
        const rateLimit = amberClient.lastRateLimit;
        res.json({
          ...priceData,
          rateLimit: {
            limit: rateLimit.limit ? parseInt(rateLimit.limit) : null,
            remaining: rateLimit.remaining ? parseInt(rateLimit.remaining) : null,
            reset: rateLimit.reset ? parseInt(rateLimit.reset) : null,
          }
        });
      } catch (error: any) {
        logger.error({ error }, 'Failed to fetch current prices');
        // Include rate limit in error response too
        const rateLimit = amberClient.lastRateLimit;
        res.status(error.response?.status || 500).json({
          error: 'Failed to fetch prices',
          message: error.message,
          rateLimit: {
            limit: rateLimit.limit ? parseInt(rateLimit.limit) : null,
            remaining: rateLimit.remaining ? parseInt(rateLimit.remaining) : null,
            reset: rateLimit.reset ? parseInt(rateLimit.reset) : null,
          }
        });
      }
    });

    this.app.get('/api/usage/current', async (_req: Request, res: Response) => {
      try {
        // Calculate date range for last 24 hours
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

        const usage = await amberClient.getUsage(undefined, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          resolution: 30,
        });

        res.json({
          usage,
          history: this.usageHistory,
        });
      } catch (error) {
        logger.error({ error }, 'Failed to fetch usage data');
        res.status(500).json({ error: 'Failed to fetch usage data' });
      }
    });

    // Auth endpoint
    this.app.post('/api/auth', async (req: Request, res: Response): Promise<void> => {
      const { username, password, action } = req.body;

      if (action === 'login') {
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
          res.status(500).json({
            success: false,
            message: 'Admin credentials not configured',
          });
          return;
        }

        if (username === adminUsername && password === adminPassword) {
          const sessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

          // For localhost, we'll store sessions in memory (simple implementation)
          // On Vercel, Redis is used instead
          res.status(200).json({
            success: true,
            token: sessionToken,
            username,
          });
          return;
        } else {
          res.status(401).json({
            success: false,
            message: 'Invalid credentials',
          });
          return;
        }
      }

      if (action === 'logout') {
        res.status(200).json({ success: true });
        return;
      }

      if (action === 'verify') {
        // For localhost, we'll just accept any token as valid (simple implementation)
        // On Vercel, Redis is used to validate tokens
        res.status(200).json({ success: true, username: 'admin' });
        return;
      }

      res.status(400).json({ error: 'Invalid action' });
    });

    this.app.get('/api/settings', (_req: Request, res: Response) => {
      const settings: AppSettings = {
        feedInThreshold: config.monitoring.feedInThreshold,
        checkInterval: config.monitoring.checkInterval,
        notificationChannels: config.notifications.channels,
      };
      res.json(settings);
    });

    this.app.post('/api/settings', (req: Request, res: Response) => {
      try {
        const { feedInThreshold, checkInterval, notificationChannels } = req.body;

        // Update .env file
        const envPath = path.join(process.cwd(), '.env');
        let envContent = fs.readFileSync(envPath, 'utf-8');

        if (feedInThreshold !== undefined) {
          envContent = envContent.replace(
            /FEED_IN_THRESHOLD=.*/,
            `FEED_IN_THRESHOLD=${feedInThreshold}`
          );
          (config.monitoring as any).feedInThreshold = parseFloat(feedInThreshold);
        }

        if (checkInterval !== undefined) {
          envContent = envContent.replace(
            /CHECK_INTERVAL=.*/,
            `CHECK_INTERVAL=${checkInterval}`
          );
          (config.monitoring as any).checkInterval = checkInterval;
        }

        if (notificationChannels !== undefined) {
          const channels = Array.isArray(notificationChannels)
            ? notificationChannels.join(',')
            : notificationChannels;
          envContent = envContent.replace(
            /NOTIFICATION_CHANNELS=.*/,
            `NOTIFICATION_CHANNELS=${channels}`
          );
          (config.notifications as any).channels = Array.isArray(notificationChannels)
            ? notificationChannels
            : notificationChannels.split(',');
        }

        fs.writeFileSync(envPath, envContent);

        logger.info({ feedInThreshold, checkInterval, notificationChannels }, 'Settings updated');
        res.json({ success: true, message: 'Settings updated. Restart required for some changes.' });
      } catch (error) {
        logger.error({ error }, 'Failed to update settings');
        res.status(500).json({ error: 'Failed to update settings' });
      }
    });

    // Serve index.html for all other routes (SPA)
    this.app.get('*', (_req: Request, res: Response) => {
      const webDistPath = path.join(__dirname, '..', '..', 'web', 'dist', 'index.html');
      if (fs.existsSync(webDistPath)) {
        res.sendFile(webDistPath);
      } else {
        res.status(404).json({ error: 'Web UI not built. Run: npm run build:web' });
      }
    });
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');

      ws.on('error', (error) => {
        logger.error({ error }, 'WebSocket error');
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
      });

      // Send initial data
      this.sendPriceUpdate(ws);
    });
  }

  private async sendPriceUpdate(ws?: WebSocket): Promise<void> {
    try {
      logger.debug('Fetching prices from Amber API...');
      const prices = await amberClient.getCurrentPrices(undefined, {
        next: 48,
        previous: 0,
      });

      logger.debug({ priceCount: prices.length }, 'Received prices from API');

      // Try feed-in first (for solar), fall back to general (for consumption)
      let targetPrices = prices.filter(p => p.channelType === 'feedIn');

      if (targetPrices.length === 0) {
        logger.info('No feed-in channel found, using general consumption channel');
        targetPrices = prices.filter(p => p.channelType === 'general');
      }

      logger.debug({ targetCount: targetPrices.length, channelType: targetPrices[0]?.channelType }, 'Filtered prices');

      const currentInterval = targetPrices.find(p => p.type === 'CurrentInterval');
      logger.debug({ hasCurrentInterval: !!currentInterval }, 'Found current interval');

      if (currentInterval) {
        // Add to history
        const newRecord = {
          price: currentInterval.perKwh,
          nemTime: currentInterval.nemTime,
          descriptor: currentInterval.descriptor,
          renewables: currentInterval.renewables,
          timestamp: new Date().toISOString(),
          channelType: currentInterval.channelType,
        };

        this.priceHistory.unshift(newRecord);

        // Keep only last 24 hours
        if (this.priceHistory.length > this.MAX_HISTORY) {
          this.priceHistory = this.priceHistory.slice(0, this.MAX_HISTORY);
        }

        // Save to file storage (async, don't wait)
        fileStorage.saveHistory(this.priceHistory).catch(err =>
          logger.error({ err }, 'Failed to save price history')
        );
      }

      const forecastIntervals = targetPrices.filter(p => p.type === 'ForecastInterval');

      const priceData: PriceData = {
        current: currentInterval ? {
          price: currentInterval.perKwh,
          spotPerKwh: currentInterval.spotPerKwh,
          descriptor: currentInterval.descriptor,
          renewables: currentInterval.renewables,
          estimate: (currentInterval as any).estimate || false,
          spikeStatus: currentInterval.spikeStatus,
          endTime: currentInterval.endTime,
          nemTime: currentInterval.nemTime,
        } : null,
        forecast: forecastIntervals.map(interval => ({
          price: interval.perKwh,
          nemTime: interval.nemTime,
          descriptor: interval.descriptor,
          renewables: interval.renewables,
          type: interval.type,
        })),
        history: this.priceHistory,
      };

      // Include rate limit info
      const rateLimit = amberClient.lastRateLimit;
      const message = JSON.stringify({
        type: 'price-update',
        data: {
          ...priceData,
          rateLimit: {
            limit: rateLimit.limit ? parseInt(rateLimit.limit) : null,
            remaining: rateLimit.remaining ? parseInt(rateLimit.remaining) : null,
            reset: rateLimit.reset ? parseInt(rateLimit.reset) : null,
          }
        }
      });

      if (ws) {
        ws.send(message);
      } else {
        // Broadcast to all connected clients
        this.wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message);
          }
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to send price update');
    }
  }

  async start(): Promise<void> {
    // Initialize file storage
    await fileStorage.init();

    // Load existing price history
    const savedHistory = await fileStorage.loadHistory();
    this.priceHistory = savedHistory;
    logger.info({ count: savedHistory.length }, 'Loaded price history from storage');

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        logger.info({ port: this.port }, `Web server started on http://localhost:${this.port}`);
        resolve();
      });

      // Start periodic price updates every minute
      setInterval(() => {
        this.sendPriceUpdate();
      }, 60 * 1000); // Every minute

      // Start periodic usage updates every 5 minutes
      setInterval(() => {
        this.updateUsageData();
      }, 5 * 60 * 1000); // Every 5 minutes

      // Send initial updates
      setTimeout(() => this.sendPriceUpdate(), 1000);
      setTimeout(() => this.updateUsageData(), 2000);
    });
  }

  private async updateUsageData(): Promise<void> {
    try {
      logger.debug('Fetching usage data from Amber API...');

      // Get usage for last 24 hours
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

      const usage = await amberClient.getUsage(undefined, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        resolution: 30,
      });

      logger.debug({ usageCount: usage.length }, 'Received usage data from API');

      // Store recent usage data
      if (usage && usage.length > 0) {
        this.usageHistory = usage.map((item: any) => ({
          kwh: item.kwh || 0,
          cost: item.cost || 0,
          nemTime: item.nemTime,
          channelType: item.channelType,
          quality: item.quality || 'estimated',
          timestamp: new Date().toISOString(),
        })).slice(0, this.MAX_HISTORY);

        logger.info({ count: this.usageHistory.length }, 'Updated usage history');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to update usage data');
    }
  }

  stop(): void {
    this.server.close();
    this.wss.close();
    logger.info('Web server stopped');
  }
}
