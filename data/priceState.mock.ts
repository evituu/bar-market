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
  // Chopes (prod-9 to prod-15)
  {
    productId: 'prod-9',
    priceCents: 1880,
    prevPriceCents: 1750,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-10',
    priceCents: 2020,
    prevPriceCents: 2020,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-11',
    priceCents: 1920,
    prevPriceCents: 2000,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-12',
    priceCents: 2150,
    prevPriceCents: 2080,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-13',
    priceCents: 1750,
    prevPriceCents: 1750,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-14',
    priceCents: 2250,
    prevPriceCents: 2180,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-15',
    priceCents: 1950,
    prevPriceCents: 2050,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  // Cervejas (prod-16 to prod-22)
  {
    productId: 'prod-16',
    priceCents: 2650,
    prevPriceCents: 2500,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-17',
    priceCents: 2750,
    prevPriceCents: 2750,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-18',
    priceCents: 2400,
    prevPriceCents: 2550,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-19',
    priceCents: 2880,
    prevPriceCents: 2750,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-20',
    priceCents: 2650,
    prevPriceCents: 2650,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-21',
    priceCents: 2520,
    prevPriceCents: 2650,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-22',
    priceCents: 2950,
    prevPriceCents: 2850,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  // Drinks (prod-23 to prod-28)
  {
    productId: 'prod-23',
    priceCents: 3250,
    prevPriceCents: 3100,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-24',
    priceCents: 3450,
    prevPriceCents: 3450,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-25',
    priceCents: 3180,
    prevPriceCents: 3350,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-26',
    priceCents: 3680,
    prevPriceCents: 3550,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-27',
    priceCents: 3300,
    prevPriceCents: 3300,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-28',
    priceCents: 3520,
    prevPriceCents: 3400,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  // Shots (prod-29 to prod-35)
  {
    productId: 'prod-29',
    priceCents: 1850,
    prevPriceCents: 1750,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-30',
    priceCents: 2200,
    prevPriceCents: 2200,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-31',
    priceCents: 1950,
    prevPriceCents: 2100,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-32',
    priceCents: 2350,
    prevPriceCents: 2250,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-33',
    priceCents: 2100,
    prevPriceCents: 2100,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-34',
    priceCents: 1980,
    prevPriceCents: 2080,
    tickSeq: 142,
    updatedAt: new Date(),
  },
  {
    productId: 'prod-35',
    priceCents: 2420,
    prevPriceCents: 2320,
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