import type { NotificationChannel } from './base.js';
import type { PriceAlert } from '../../monitoring/types.js';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';

export class ConsoleNotification implements NotificationChannel {
  name = 'console';

  async send(alert: PriceAlert): Promise<void> {
    const endTime = new Date(alert.endTime).toLocaleTimeString('en-AU', {
      timeZone: config.monitoring.timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    logger.info({
      type: 'FEED_IN_ALERT',
      price: alert.price,
      spotPrice: alert.spotPerKwh,
      descriptor: alert.descriptor,
      renewables: alert.renewables,
      threshold: alert.threshold,
      estimate: alert.estimate,
      validUntil: endTime,
    }, `🌟 HIGH FEED-IN PRICE ALERT 🌟\n` +
       `Price: ${alert.price}c/kWh (threshold: ${alert.threshold}c/kWh)\n` +
       `Spot Price: ${alert.spotPerKwh}c/kWh\n` +
       `Level: ${alert.descriptor}\n` +
       `Renewables: ${alert.renewables}%\n` +
       `Valid until: ${endTime}\n` +
       `${alert.estimate ? '⚠️  This is an estimate' : '✓ Confirmed price'}\n` +
       `💡 Great time to export solar power!`
    );
  }

  isEnabled(): boolean {
    return config.notifications.channels.includes('console');
  }
}
