import type { NotificationChannel } from './channels/base.js';
import { ConsoleNotification } from './channels/console.js';
import { DesktopNotification } from './channels/desktop.js';
import type { PriceAlert } from '../monitoring/types.js';
import { logger } from '../utils/logger.js';

export class Notifier {
  private channels: NotificationChannel[];

  constructor() {
    this.channels = [
      new ConsoleNotification(),
      new DesktopNotification(),
    ];
  }

  /**
   * Send notification through all enabled channels
   */
  async notify(alert: PriceAlert): Promise<void> {
    const enabledChannels = this.channels.filter(c => c.isEnabled());

    if (enabledChannels.length === 0) {
      logger.warn('No notification channels enabled');
      return;
    }

    logger.debug(
      { channels: enabledChannels.map(c => c.name) },
      'Sending notifications'
    );

    const results = await Promise.allSettled(
      enabledChannels.map(channel =>
        channel.send(alert).catch(err => {
          logger.error(
            { channel: channel.name, err },
            `Notification failed for channel: ${channel.name}`
          );
          throw err;
        })
      )
    );

    // Log summary of notification results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    if (failed > 0) {
      logger.warn(
        { successful, failed, total: results.length },
        'Some notifications failed'
      );
    } else {
      logger.debug(
        { successful, total: results.length },
        'All notifications sent successfully'
      );
    }
  }
}
