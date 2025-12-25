'use client';

import { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ProductWithPrice } from '@/data';
import { formatCurrency } from '@/data';

interface ProductCardProps {
  product: ProductWithPrice;
  onBuy: (product: ProductWithPrice) => void;
  isLoading?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  onBuy,
  isLoading = false,
}: ProductCardProps) {
  const isUp = product.priceChange > 0;
  const isDown = product.priceChange < 0;

  const arrow = isUp ? '↑' : isDown ? '↓' : '=';
  const changeColor = isUp
    ? 'text-[#00E676]'
    : isDown
      ? 'text-[#FF1744]'
      : 'text-[#F59E0B]';

  const changeBg = isUp
    ? 'bg-[#00E676]/10'
    : isDown
      ? 'bg-[#FF1744]/10'
      : 'bg-[#F59E0B]/10';

  // Delta em reais
  const deltaCents = Math.abs(product.currentPriceCents - product.prevPriceCents);
  const deltaFormatted = (deltaCents / 100).toFixed(2);

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 flex items-center justify-between gap-3">
      {/* Info do produto */}
      <div className="flex-1 min-w-0">
        {/* Ticker + Nome */}
        <div className="flex items-baseline gap-2">
          <span className={`text-xs font-bold font-market-semibold ${changeColor} tracking-wider`}>
            {product.ticker}
          </span>
          <h3 className="text-base font-medium text-[#E5E7EB] truncate">
            {product.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {/* Preço */}
          <span className="text-lg font-semibold font-market-semibold text-[#E5E7EB]">
            {formatCurrency(product.currentPriceCents)}
          </span>

          {/* Variação */}
          <span
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded ${changeBg} ${changeColor} text-xs font-market-medium`}
          >
            {arrow}
            {deltaCents > 0 && <span>R$ {deltaFormatted}</span>}
          </span>
        </div>
      </div>

      {/* Botão Comprar */}
      <button
        onClick={() => onBuy(product)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all
          ${
            isLoading
              ? 'bg-[#374151] text-[#9CA3AF] cursor-not-allowed'
              : 'bg-[#F59E0B] text-[#0B0F14] hover:bg-[#D97706] active:scale-95'
          }
        `}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-[#9CA3AF] border-t-transparent rounded-full animate-spin" />
        ) : (
          <ShoppingCart className="w-4 h-4" />
        )}
        <span>{isLoading ? 'Travando...' : 'Comprar'}</span>
      </button>
    </div>
  );
});
