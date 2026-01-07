// TypeScript types derived from Amber Electric OpenAPI specification

export type ChannelType = 'general' | 'controlledLoad' | 'feedIn';

export type SpikeStatus = 'none' | 'potential' | 'spike';

export type PriceDescriptor =
  | 'negative'
  | 'extremelyLow'
  | 'veryLow'
  | 'low'
  | 'neutral'
  | 'high'
  | 'spike';

export type RenewableDescriptor = 'best' | 'great' | 'ok' | 'notGreat' | 'worst';

export type SiteStatus = 'pending' | 'active' | 'closed';

export interface Channel {
  identifier: string;
  type: ChannelType;
  tariff: string;
}

export interface Site {
  id: string;
  nmi: string;
  channels: Channel[];
  network: string;
  status: SiteStatus;
  activeFrom?: string;
  closedOn?: string;
  intervalLength: 5 | 30;
}

export interface Range {
  min: number;
  max: number;
}

export interface AdvancedPrice {
  low: number;
  predicted: number;
  high: number;
}

export interface TariffInformation {
  period?: 'offPeak' | 'shoulder' | 'solarSponge' | 'peak';
  season?: 'default' | 'summer' | 'autumn' | 'winter' | 'spring' | 'nonSummer' | 'holiday' | 'weekend' | 'weekendHoliday' | 'weekday';
  block?: 1 | 2;
  demandWindow?: boolean;
}

export interface BaseInterval {
  type: string;
  duration: 5 | 15 | 30;
  spotPerKwh: number;
  perKwh: number;
  date: string;
  nemTime: string;
  startTime: string;
  endTime: string;
  renewables: number;
  channelType: ChannelType;
  tariffInformation?: TariffInformation | null;
  spikeStatus: SpikeStatus;
  descriptor: PriceDescriptor;
}

export interface ActualInterval extends BaseInterval {
  type: 'ActualInterval';
}

export interface ForecastInterval extends BaseInterval {
  type: 'ForecastInterval';
  range?: Range | null;
  advancedPrice?: AdvancedPrice | null;
}

export interface CurrentInterval extends BaseInterval {
  type: 'CurrentInterval';
  range?: Range | null;
  estimate: boolean;
  advancedPrice?: AdvancedPrice | null;
}

export type Interval = ActualInterval | CurrentInterval | ForecastInterval;

export interface Usage extends BaseInterval {
  type: 'Usage';
  channelIdentifier: string;
  kwh: number;
  quality: 'estimated' | 'billable';
  cost: number;
}

export interface BaseRenewable {
  type: string;
  duration: 5 | 15 | 30;
  date: string;
  nemTime: string;
  startTime: string;
  endTime: string;
  renewables: number;
  descriptor: RenewableDescriptor;
}

export interface ActualRenewable extends BaseRenewable {
  type: 'ActualRenewable';
}

export interface ForecastRenewable extends BaseRenewable {
  type: 'ForecastRenewable';
}

export interface CurrentRenewable extends BaseRenewable {
  type: 'CurrentRenewable';
}

export type Renewable = ActualRenewable | CurrentRenewable | ForecastRenewable;
