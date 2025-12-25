export interface PricingConfig {
  id: number;
  tickSeconds: number;
  decay: number;
  sensitivityK: number;
  baseline: number;
  updatedAt: Date;
}

export const MOCK_PRICING_CONFIG: PricingConfig = {
  id: 1,
  tickSeconds: 3,
  decay: 0.95,
  sensitivityK: 0.02,
  baseline: 0.0,
  updatedAt: new Date(),
};

export type MarketEventType = 'CRASH' | 'PROMO' | 'FREEZE';

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  startsAt: Date;
  endsAt: Date;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export const MOCK_MARKET_EVENTS: MarketEvent[] = [
  {
    id: 'event-1',
    type: 'PROMO',
    startsAt: new Date('2025-12-25T20:00:00'),
    endsAt: new Date('2025-12-25T22:00:00'),
    payload: { discount: 0.15, categories: ['Chopes', 'Cervejas'] },
    createdAt: new Date(),
  },
];