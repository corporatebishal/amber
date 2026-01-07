export interface PriceData {
  current: {
    price: number;
    spotPerKwh: number;
    descriptor: string;
    renewables: number;
    estimate: boolean;
    spikeStatus: string;
    endTime: string;
    nemTime: string;
  } | null;
  forecast: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    type: string;
  }>;
  history: Array<{
    price: number;
    nemTime: string;
    descriptor: string;
    renewables: number;
    timestamp: string;
  }>;
}

export interface AppSettings {
  feedInThreshold: number;
  checkInterval: string;
  notificationChannels: string[];
}
