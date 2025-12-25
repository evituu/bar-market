'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ProductWithPrice } from '@/data';
import { formatCurrency, formatPriceChange } from '@/data';

interface RankingPanelProps {
  title: string;
  products: ProductWithPrice[];
  type: 'gainers' | 'losers';
  maxItems?: number;
}

export function RankingPanel({
  title,
  products,
  type,
  maxItems = 5,
}: RankingPanelProps) {
  const color = type === 'gainers' ? '#00E676' : '#FF1744';
  const Icon = type === 'gainers' ? TrendingUp : TrendingDown;

  const sorted = [...products]
    .sort((a, b) =>
      type === 'gainers'
        ? b.priceChange - a.priceChange
        : a.priceChange - b.priceChange
    )
    .slice(0, maxItems);

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 border-b border-[#1F2937] flex items-center gap-2"
        style={{ borderLeftColor: color, borderLeftWidth: '3px' }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
        <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wide">
          {title}
        </h3>
      </div>

      {/* Lista */}
      <div className="divide-y divide-[#1F2937]">
        {sorted.map((product, index) => {
          const isUp = product.priceChange > 0;
          const isDown = product.priceChange < 0;
          const arrow = isUp ? '↑' : isDown ? '↓' : '=';
          const changeColor = isUp
            ? 'text-[#00E676]'
            : isDown
              ? 'text-[#FF1744]'
              : 'text-[#F59E0B]';

          return (
            <div
              key={product.id}
              className="px-4 py-3 flex items-center justify-between hover:bg-[#1F2937]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#9CA3AF] w-5">
                  #{index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#E5E7EB]">
                    {product.name}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">{product.category}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold font-market-semibold text-[#E5E7EB]">
                  {formatCurrency(product.currentPriceCents)}
                </p>
                <p className={`text-xs font-market-medium ${changeColor}`}>
                  {arrow} {formatPriceChange(product.priceChange)}
                </p>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-[#9CA3AF]">
            Nenhum produto encontrado
          </div>
        )}
      </div>
    </div>
  );
}
