'use client';

import { memo } from 'react';
import { ShoppingCart } from 'lucide-react';
import type { ProductWithPrice } from '@/lib/domain/products';
import { formatCurrency } from '@/data';

interface ProductCardProps {
  product: ProductWithPrice;
  onAddToCart: (product: ProductWithPrice) => void;
}

export const ProductCard = memo(function ProductCard({
  product,
  onAddToCart,
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

      {/* Botão Adicionar ao Carrinho */}
      <button
        onClick={() => onAddToCart(product)}
        className="flex items-center gap-2 px-5 py-3 bg-[#F59E0B] text-[#0B0F14] rounded-xl font-semibold text-sm hover:bg-[#D97706] active:scale-95 transition-all"
      >
        <ShoppingCart className="w-4 h-4" />
        <span>Adicionar</span>
      </button>
    </div>
  );
});
