'use client';

import { TrendingUp, TrendingDown, Trophy } from 'lucide-react';
import type { ProductWithPrice } from '@/data';
import { formatCurrency, formatPriceChange } from '@/data';

interface MarketRankingProps {
  products: ProductWithPrice[];
}

export function MarketRanking({ products }: MarketRankingProps) {
  // Top 3 maiores altas
  const topGainers = [...products]
    .filter((p) => p.priceChange > 0)
    .sort((a, b) => b.priceChange - a.priceChange)
    .slice(0, 3);

  // Top 3 maiores quedas
  const topLosers = [...products]
    .filter((p) => p.priceChange < 0)
    .sort((a, b) => a.priceChange - b.priceChange)
    .slice(0, 3);

  // Mais negociados (por preço atual como proxy de volume)
  const mostTraded = [...products]
    .sort((a, b) => b.currentPriceCents - a.currentPriceCents)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Altas */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#16A34A]" />
          <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wide">
            Maiores Altas
          </h3>
        </div>
        <ul className="space-y-3">
          {topGainers.length === 0 ? (
            <li className="text-sm text-[#9CA3AF]">Nenhuma alta no momento</li>
          ) : (
            topGainers.map((product, index) => (
              <li
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#16A34A]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#E5E7EB]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#E5E7EB] tabular-nums">
                    {formatCurrency(product.currentPriceCents)}
                  </p>
                  <p className="text-xs font-medium text-[#16A34A] tabular-nums">
                    {formatPriceChange(product.priceChange)}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Top Quedas */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-[#DC2626]" />
          <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wide">
            Maiores Quedas
          </h3>
        </div>
        <ul className="space-y-3">
          {topLosers.length === 0 ? (
            <li className="text-sm text-[#9CA3AF]">Nenhuma queda no momento</li>
          ) : (
            topLosers.map((product, index) => (
              <li
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-[#DC2626]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#E5E7EB]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#E5E7EB] tabular-nums">
                    {formatCurrency(product.currentPriceCents)}
                  </p>
                  <p className="text-xs font-medium text-[#DC2626] tabular-nums">
                    {formatPriceChange(product.priceChange)}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Mais Negociados */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-[#F59E0B]" />
          <h3 className="text-sm font-semibold text-[#E5E7EB] uppercase tracking-wide">
            Mais Negociados
          </h3>
        </div>
        <ul className="space-y-3">
          {mostTraded.map((product, index) => (
            <li
              key={product.id}
              className="flex items-center justify-between py-2 border-b border-[#1F2937] last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-[#F59E0B]">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-[#E5E7EB]">
                    {product.name}
                  </p>
                  <p className="text-xs text-[#9CA3AF]">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#E5E7EB] tabular-nums">
                  {formatCurrency(product.currentPriceCents)}
                </p>
                <p
                  className={`text-xs font-medium tabular-nums ${
                    product.priceChange > 0
                      ? 'text-[#16A34A]'
                      : product.priceChange < 0
                        ? 'text-[#DC2626]'
                        : 'text-[#F59E0B]'
                  }`}
                >
                  {formatPriceChange(product.priceChange)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
