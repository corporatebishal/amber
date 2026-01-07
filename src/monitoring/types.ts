import type { PriceDescriptor, CurrentInterval } from '../api/types.js';

export interface PriceAlert {
  price: number;
  spotPerKwh: number;
  descriptor: PriceDescriptor;
  renewables: number;
  timestamp: string;
  nemTime: string;
  endTime: string;
  threshold: number;
  estimate: boolean;
  interval: CurrentInterval;
}
