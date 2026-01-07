import cron from 'node-cron';
import { PriceMonitor } from '../monitoring/price-monitor.js';
import { Notifier } from '../notifications/notifier.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

export class PriceScheduler {
  private task: cron.ScheduledTask | null = null;
  private intervalTimer: NodeJS.Timeout | null = null;
  private monitor: PriceMonitor;
  private notifier: Notifier;
  private isRunning = false;

  constructor() {
    this.monitor = new PriceMonitor();
    this.notifier = new Notifier();
  }

  /**
   * Start the scheduled price monitoring
   */
  start(): void {
    const interval = config.monitoring.checkInterval;

    // Check if it's a second-based interval (e.g., "5s", "15s", "30s")
    if (interval.endsWith('s')) {
      const seconds = parseInt(interval.slice(0, -1));
      if (isNaN(seconds) || seconds < 1) {
        throw new Error(`Invalid interval: ${interval}`);
      }

      logger.info({
        interval: `${seconds} seconds`,
        threshold: config.monitoring.feedInThreshold,
      }, 'Starting price monitoring with second-based interval');

      this.intervalTimer = setInterval(async () => {
        await this.checkPrices();
      }, seconds * 1000);

      this.isRunning = true;
      logger.info(`Scheduler started successfully (every ${seconds}s)`);
    } else {
      // Use cron for minute-based intervals
      if (!cron.validate(interval)) {
        throw new Error(`Invalid cron expression: ${interval}`);
      }

      logger.info({
        interval: interval,
        timezone: config.monitoring.timezone,
        threshold: config.monitoring.feedInThreshold,
      }, 'Starting price monitoring scheduler');

      this.task = cron.schedule(
        interval,
        async () => {
          await this.checkPrices();
        },
        {
          scheduled: true,
          timezone: config.monitoring.timezone,
        }
      );

      this.isRunning = true;
      logger.info('Scheduler started successfully');
    }
  }

  /**
   * Run an immediate price check (without waiting for scheduled time)
   */
  async runImmediately(): Promise<void> {
    logger.info('Running immediate price check');
    await this.checkPrices();
  }

  /**
   * Check prices and send notifications if threshold exceeded
   */
  private async checkPrices(): Promise<void> {
    try {
      logger.debug('Running scheduled price check');

      const alert = await this.monitor.checkFeedInPrices();

      if (alert) {
        await this.notifier.notify(alert);
      } else {
        logger.debug('No price alerts triggered');
      }
    } catch (error) {
      logger.error({ error }, 'Error during scheduled price check');
      // Don't throw - we want the scheduler to continue running
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Check if scheduler is running
   */
  getStatus(): boolean {
    return this.isRunning;
  }
}
