import notifier from 'node-notifier';
import type { NotificationChannel } from './base.js';
import type { PriceAlert } from '../../monitoring/types.js';
import { config } from '../../config/config.js';
import { logger } from '../../utils/logger.js';

export class DesktopNotification implements NotificationChannel {
  name = 'desktop';

  async send(alert: PriceAlert): Promise<void> {
    const endTime = new Date(alert.endTime).toLocaleTimeString('en-AU', {
      timeZone: config.monitoring.timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    const priceLevel = this.getPriceLevelEmoji(alert.descriptor);

    return new Promise((resolve, reject) => {
      notifier.notify(
        {
          title: `${priceLevel} High Feed-In Price: ${alert.price}c/kWh`,
          message:
            `Great time to export solar power!\n` +
            `Spot: ${alert.spotPerKwh}c/kWh | Renewables: ${alert.renewables}%\n` +
            `Valid until: ${endTime}${alert.estimate ? ' (estimate)' : ''}`,
          sound: true,
          wait: false,
          timeout: 10,
          appName: 'Amber Notifications by Bishal',
          icon: undefined, // You can add a custom icon path here
        },
        (err, response) => {
          if (err) {
            logger.error({ err }, 'Desktop notification failed');
            reject(err);
          } else {
            logger.debug({ response }, 'Desktop notification sent');
            resolve();
          }
        }
      );
    });
  }

  isEnabled(): boolean {
    return config.notifications.channels.includes('desktop');
  }

  private getPriceLevelEmoji(descriptor: string): string {
    switch (descriptor) {
      case 'spike':
        return '🔥';
      case 'high':
        return '⚡';
      case 'neutral':
        return '💡';
      case 'low':
      case 'veryLow':
      case 'extremelyLow':
        return '💚';
      default:
        return '⭐';
    }
  }
}
