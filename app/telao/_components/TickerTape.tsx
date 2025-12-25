'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProductWithPrice } from '@/data';
import { formatCurrency, formatPriceChange } from '@/data';

interface TickerTapeProps {
  products: ProductWithPrice[];
}

export function TickerTape({ products }: TickerTapeProps) {
  // Duplica para loop infinito visual
  const duplicatedProducts = [...products, ...products];

  return (
    <div className="w-full bg-[#0B0F14] border-y border-[#1F2937] overflow-hidden">
      <div className="animate-ticker flex">
        {duplicatedProducts.map((product, index) => {
          const isUp = product.priceChange > 0;
          const isDown = product.priceChange < 0;
          const trendColor = isUp
            ? 'text-[#16A34A]'
            : isDown
              ? 'text-[#DC2626]'
              : 'text-[#F59E0B]';

          const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

          return (
            <div
              key={`${product.id}-${index}`}
              className="flex items-center gap-3 px-6 py-3 border-r border-[#1F2937] whitespace-nowrap"
            >
              <span className="font-medium text-[#E5E7EB]">{product.name}</span>
              <span className="font-semibold text-[#E5E7EB] font-market-semibold">
                {formatCurrency(product.currentPriceCents)}
              </span>
              <span className={`flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="w-4 h-4" />
                <span className="text-sm font-medium font-market-medium">
                  {formatPriceChange(product.priceChange)}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
