'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProductWithPrice } from '@/data';
import { formatCurrency, formatPriceChange } from '@/data';

interface PriceTickerProps {
  product: ProductWithPrice;
}

export function PriceTicker({ product }: PriceTickerProps) {
  const isUp = product.priceChange > 0;
  const isDown = product.priceChange < 0;
  const isNeutral = product.priceChange === 0;

  const trendColor = isUp
    ? 'text-[#16A34A]'
    : isDown
      ? 'text-[#DC2626]'
      : 'text-[#F59E0B]';

  const trendBg = isUp
    ? 'bg-[#16A34A]/10'
    : isDown
      ? 'bg-[#DC2626]/10'
      : 'bg-[#F59E0B]/10';

  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  return (
    <article
      className={`
        relative overflow-hidden rounded-lg bg-[#111827] border border-[#1F2937] p-6
        transition-all duration-300
        ${isUp ? 'hover:border-[#16A34A]/50' : isDown ? 'hover:border-[#DC2626]/50' : 'hover:border-[#F59E0B]/50'}
      `}
    >
      {/* Header: Nome e Categoria */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#E5E7EB] leading-tight">
            {product.name}
          </h3>
          <span className="text-xs text-[#9CA3AF] uppercase tracking-wide">
            {product.category}
          </span>
        </div>
        <div className={`p-2 rounded-lg ${trendBg}`}>
          <TrendIcon className={`w-5 h-5 ${trendColor}`} />
        </div>
      </div>

      {/* Preço Principal */}
      <div className="mb-3">
        <span className="text-3xl font-bold text-[#E5E7EB] tabular-nums">
          {formatCurrency(product.currentPriceCents)}
        </span>
      </div>

      {/* Variação */}
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium tabular-nums ${trendColor}`}>
          {formatPriceChange(product.priceChange)}
        </span>
        <span className="text-xs text-[#9CA3AF]">
          anterior: {formatCurrency(product.prevPriceCents)}
        </span>
      </div>

      {/* Barra de range (floor → cap) */}
      <div className="mt-4 pt-4 border-t border-[#1F2937]">
        <div className="flex justify-between text-xs text-[#9CA3AF] mb-1">
          <span>{formatCurrency(product.priceFloorCents)}</span>
          <span>{formatCurrency(product.priceCapCents)}</span>
        </div>
        <div className="h-1.5 bg-[#1F2937] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isUp ? 'bg-[#16A34A]' : isDown ? 'bg-[#DC2626]' : 'bg-[#F59E0B]'
            }`}
            style={{
              width: `${
                ((product.currentPriceCents - product.priceFloorCents) /
                  (product.priceCapCents - product.priceFloorCents)) *
                100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Indicador visual de tendência */}
      {!isNeutral && (
        <div
          className={`
            absolute top-0 right-0 w-1 h-full
            ${isUp ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}
          `}
        />
      )}
    </article>
  );
}
