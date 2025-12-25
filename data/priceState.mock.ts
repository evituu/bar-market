export interface PriceState {
  productId: string;
  priceCents: number;
  prevPriceCents: number;
  tickSeq: number;
  updatedAt: Date;
}

export const MOCK_PRICE_STATE: PriceState[] = [
  {
    productId: 'prod-1',
    priceCents: 1950,
    prevPriceCents: 1800,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-2',
    priceCents: 2580,
    prevPriceCents: 2650,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-3',
    priceCents: 3420,
    prevPriceCents: 3200,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-4',
    priceCents: 2780,
    prevPriceCents: 2800,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-5',
    priceCents: 2100,
    prevPriceCents: 1950,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-6',
    priceCents: 3050,
    prevPriceCents: 3100,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-7',
    priceCents: 3200,
    prevPriceCents: 3100,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-8',
    priceCents: 2280,
    prevPriceCents: 2350,
    tickSeq: 142,
    updatedAt: new Date(),
  },
];

export interface PriceHistory {
  id: number;
  productId: string;
  tickSeq: number;
  priceCents: number;
  createdAt: Date;
}

// Histórico simulado das últimas 20 variações (para gráficos)
export const MOCK_PRICE_HISTORY: PriceHistory[] = [
  { id: 1, productId: 'prod-1', tickSeq: 122, priceCents: 1800, createdAt: new Date(Date.now() - 60000) },
  { id: 2, productId: 'prod-1', tickSeq: 132, priceCents: 1850, createdAt: new Date(Date.now() - 30000) },
  { id: 3, productId: 'prod-1', tickSeq: 142, priceCents: 1950, createdAt: new Date() },
];