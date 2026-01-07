import type { PriceAlert } from '../../monitoring/types.js';

/**
 * Base interface for all notification channels
 */
export interface NotificationChannel {
  name: string;
  send(alert: PriceAlert): Promise<void>;
  isEnabled(): boolean;
}
