// Central export point for all mock data and types
export * from './products.mock';
export * from './priceState.mock';
export * from './pricingConfig.mock';
export * from './tradeEvents.mock';

// Helper functions for working with mock data
import { MOCK_PRODUCTS, type Product } from './products.mock';
import { MOCK_PRICE_STATE, type PriceState } from './priceState.mock';
import { MOCK_PRICING_CONFIG } from './pricingConfig.mock';

export function getProductById(id: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export function getProductBySku(sku: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.sku === sku);
}

export function getPriceStateByProductId(productId: string): PriceState | undefined {
  return MOCK_PRICE_STATE.find((ps) => ps.productId === productId);
}

export function getActiveProducts(): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.isActive);
}

export function getProductsByCategory(category: string): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.category === category && p.isActive);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(MOCK_PRODUCTS.map((p) => p.category)));
}

// Enriquece produto com preço atual
export interface ProductWithPrice extends Product {
  currentPriceCents: number;
  prevPriceCents: number;
  priceChange: number; // percentual: (current - prev) / prev
  tickSeq: number;
}

export function getProductsWithPrices(): ProductWithPrice[] {
  return MOCK_PRODUCTS.filter((p) => p.isActive).map((product) => {
    const priceState = getPriceStateByProductId(product.id);
    if (!priceState) {
      return {
        ...product,
        currentPriceCents: product.basePriceCents,
        prevPriceCents: product.basePriceCents,
        priceChange: 0,
        tickSeq: 0,
      };
    }

    const priceChange =
      priceState.prevPriceCents > 0
        ? (priceState.priceCents - priceState.prevPriceCents) / priceState.prevPriceCents
        : 0;

    return {
      ...product,
      currentPriceCents: priceState.priceCents,
      prevPriceCents: priceState.prevPriceCents,
      priceChange,
      tickSeq: priceState.tickSeq,
    };
  });
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatPriceChange(change: number): string {
  const sign = change > 0 ? '+' : '';
  return `${sign}${(change * 100).toFixed(2)}%`;
}

export { MOCK_PRICING_CONFIG as pricingConfig };