import { amberClient } from '../api/client.js';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';
import type { CurrentInterval } from '../api/types.js';
import type { PriceAlert } from './types.js';

export class PriceMonitor {
  private lastAlertTime: Date | null = null;
  private readonly ALERT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

  /**
   * Check current feed-in prices and return an alert if threshold is exceeded
   */
  async checkFeedInPrices(): Promise<PriceAlert | null> {
    try {
      logger.debug('Checking feed-in prices');

      // Fetch current prices with next few intervals for context
      const prices = await amberClient.getCurrentPrices(undefined, {
        next: 6, // Get next 3 hours of forecasts
      });

      // Try feed-in first (for solar), fall back to general (for consumption)
      let targetPrices = prices.filter(p => p.channelType === 'feedIn');

      if (targetPrices.length === 0) {
        logger.info('No feed-in channel found, using general consumption channel');
        targetPrices = prices.filter(p => p.channelType === 'general');
      }

      if (targetPrices.length === 0) {
        logger.warn('No price channels found. Please check your Amber account configuration.');
        return null;
      }

      // Get the current interval (the first one that's CurrentInterval type)
      const currentInterval = targetPrices.find(
        p => p.type === 'CurrentInterval'
      ) as CurrentInterval | undefined;

      if (!currentInterval) {
        logger.debug('No current interval found in feed-in prices');
        return null;
      }

      logger.debug({
        price: currentInterval.perKwh,
        spotPrice: currentInterval.spotPerKwh,
        descriptor: currentInterval.descriptor,
        renewables: currentInterval.renewables,
        estimate: currentInterval.estimate,
        threshold: config.monitoring.feedInThreshold,
      }, 'Current feed-in price');

      // Check if price exceeds threshold
      if (currentInterval.perKwh >= config.monitoring.feedInThreshold) {
        // Check cooldown to avoid spam
        if (this.shouldSendAlert()) {
          this.lastAlertTime = new Date();

          const alert: PriceAlert = {
            price: currentInterval.perKwh,
            spotPerKwh: currentInterval.spotPerKwh,
            descriptor: currentInterval.descriptor,
            renewables: currentInterval.renewables,
            timestamp: currentInterval.startTime,
            nemTime: currentInterval.nemTime,
            endTime: currentInterval.endTime,
            threshold: config.monitoring.feedInThreshold,
            estimate: currentInterval.estimate,
            interval: currentInterval,
          };

          logger.info(
            {
              price: alert.price,
              threshold: alert.threshold,
              descriptor: alert.descriptor,
            },
            'High feed-in price detected!'
          );

          return alert;
        } else {
          logger.debug('Alert suppressed due to cooldown period');
        }
      }

      return null;
    } catch (error) {
      logger.error({ error }, 'Error checking feed-in prices');
      throw error;
    }
  }

  /**
   * Check if enough time has passed since last alert to send a new one
   */
  private shouldSendAlert(): boolean {
    if (!this.lastAlertTime) {
      return true;
    }

    const timeSinceLastAlert = Date.now() - this.lastAlertTime.getTime();
    return timeSinceLastAlert >= this.ALERT_COOLDOWN_MS;
  }

  /**
   * Get upcoming feed-in prices for the next few hours
   */
  async getUpcomingPrices(hours: number = 3): Promise<void> {
    try {
      const intervals = Math.ceil((hours * 60) / 30); // Convert hours to 30-min intervals

      const prices = await amberClient.getCurrentPrices(undefined, {
        next: intervals,
      });

      const feedInPrices = prices.filter(p => p.channelType === 'feedIn');

      logger.info({ count: feedInPrices.length }, 'Upcoming feed-in prices:');

      feedInPrices.forEach(interval => {
        const time = new Date(interval.nemTime).toLocaleString('en-AU', {
          timeZone: config.monitoring.timezone,
          hour: '2-digit',
          minute: '2-digit',
        });

        logger.info({
          time,
          price: interval.perKwh,
          descriptor: interval.descriptor,
          type: interval.type,
        }, `  ${time}: ${interval.perKwh}c/kWh (${interval.descriptor})`);
      });
    } catch (error) {
      logger.error({ error }, 'Error fetching upcoming prices');
      throw error;
    }
  }
}
