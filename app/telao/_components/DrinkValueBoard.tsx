'use client';

import { useMemo } from 'react';
import type { ProductWithPrice } from '@/data';
import { formatCurrency } from '@/data';
import { PriceFlash } from './PriceFlash';

interface DrinkValueBoardProps {
  products: ProductWithPrice[];
  maxRowsPerColumn?: number;
}

// Número máximo de itens por coluna (calibrado para 1080p)
const DEFAULT_MAX_ROWS = 8;

export function DrinkValueBoard({
  products,
  maxRowsPerColumn = DEFAULT_MAX_ROWS,
}: DrinkValueBoardProps) {
  // Agrupa produtos por categoria
  const productsByCategory = useMemo(() => {
    const grouped = new Map<string, ProductWithPrice[]>();

    products.forEach((product) => {
      const existing = grouped.get(product.category) || [];
      existing.push(product);
      grouped.set(product.category, existing);
    });

    // Ordena cada categoria por relevância (maior variação absoluta primeiro)
    grouped.forEach((items, category) => {
      items.sort((a, b) => Math.abs(b.priceChange) - Math.abs(a.priceChange));
      // Limita ao máximo de linhas
      grouped.set(category, items.slice(0, maxRowsPerColumn));
    });

    return grouped;
  }, [products, maxRowsPerColumn]);

  const categories = Array.from(productsByCategory.keys());

  return (
    <div className="flex-1 px-4 py-4 overflow-hidden">
      <div
        className="h-full grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))`,
        }}
      >
        {categories.map((category) => (
          <CategoryColumn
            key={category}
            category={category}
            products={productsByCategory.get(category) || []}
          />
        ))}
      </div>
    </div>
  );
}

interface CategoryColumnProps {
  category: string;
  products: ProductWithPrice[];
}

function CategoryColumn({ category, products }: CategoryColumnProps) {
  return (
    <div className="flex flex-col bg-[#111827] rounded-lg border border-[#1F2937] overflow-hidden">
      {/* Título da Categoria */}
      <div className="px-3 py-2 bg-[#1F2937] border-b border-[#374151]">
        <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-widest text-center font-market">
          {category}
        </h3>
      </div>

      {/* Lista de Produtos */}
      <div className="flex-1 flex flex-col">
        {products.map((product, index) => (
          <ProductRow
            key={product.id}
            product={product}
            isLast={index === products.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface ProductRowProps {
  product: ProductWithPrice;
  isLast: boolean;
}

function ProductRow({ product, isLast }: ProductRowProps) {
  const isUp = product.priceChange > 0;
  const isDown = product.priceChange < 0;
  const isNeutral = product.priceChange === 0;

  // Cores vibrantes para alta/baixa/neutra
  const priceColor = isUp
    ? 'text-[#00E676]'
    : isDown
      ? 'text-[#FF1744]'
      : 'text-[#E5E7EB]';

  const arrow = isUp ? '↑' : isDown ? '↓' : '=';
  const arrowColor = isUp
    ? 'text-[#00E676]'
    : isDown
      ? 'text-[#FF1744]'
      : 'text-[#F59E0B]';

  // Delta formatado (em reais, curto)
  const delta = Math.abs(product.currentPriceCents - product.prevPriceCents);
  const deltaFormatted = (delta / 100).toFixed(2);

  return (
    <div
      className={`
        flex items-center justify-between px-3 py-2.5
        ${!isLast ? 'border-b border-[#1F2937]' : ''}
        transition-colors duration-300
        hover:bg-[#1F2937]/50
      `}
    >
      {/* Ticker + Nome do Produto */}
      <div className="flex flex-col gap-0.5 flex-1 pr-3 min-w-0">
        {/* Ticker em destaque */}
        <span className={`text-base font-bold font-market-semibold ${priceColor} tracking-wide`}>
          {product.ticker}
        </span>
        {/* Nome secundário */}
        <span className="text-xs font-medium text-[#9CA3AF] truncate">
          {product.name}
        </span>
      </div>

      {/* Preço + Variação com Flash */}
      <PriceFlash
        currentValue={product.currentPriceCents}
        previousValue={product.prevPriceCents}
        duration={350}
      >
        <div className="flex items-center gap-2.5 shrink-0 px-2 py-1 -mx-2 -my-1 rounded">
          {/* Preço com Pulse */}
          <span
            className={`text-lg font-semibold font-market-semibold ${priceColor} pulse-price`}
          >
            {formatCurrency(product.currentPriceCents)}
          </span>

          {/* Seta + Delta */}
          <span
            className={`flex items-center gap-0.5 font-market-medium ${arrowColor} min-w-[60px] justify-end`}
          >
            <span className="text-xl leading-none">{arrow}</span>
            {delta > 0 && (
              <span className="text-xs">{deltaFormatted}</span>
            )}
          </span>
        </div>
      </PriceFlash>
    </div>
  );
}
