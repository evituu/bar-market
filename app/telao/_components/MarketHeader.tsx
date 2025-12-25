'use client';

import { Activity, Clock } from 'lucide-react';
import type { ProductWithPrice } from '@/data';

interface MarketHeaderProps {
  products: ProductWithPrice[];
  tickSeq: number;
}

export function MarketHeader({ products, tickSeq }: MarketHeaderProps) {
  const upCount = products.filter((p) => p.priceChange > 0).length;
  const downCount = products.filter((p) => p.priceChange < 0).length;
  const neutralCount = products.filter((p) => p.priceChange === 0).length;

  const now = new Date();
  const timeString = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="bg-[#0B0F14] border-b border-[#1F2937] px-4 py-2 shrink-0">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#00E676]" />
          <h1 className="text-lg font-semibold text-[#E5E7EB] tracking-tight uppercase font-market">
            Bar Market
          </h1>
          <span className="text-xs font-medium text-[#00E676] uppercase tracking-widest font-market">
            Market Open
          </span>
        </div>

        {/* Indicadores inline */}
        <div className="flex items-center gap-6">
          {/* Altas / Quedas / Estável */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-[#9CA3AF]">↑</span>
              <span className="font-semibold text-[#00E676] font-market-semibold">{upCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#9CA3AF]">↓</span>
              <span className="font-semibold text-[#FF1744] font-market-semibold">{downCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[#9CA3AF]">–</span>
              <span className="font-semibold text-[#F59E0B] font-market-semibold">{neutralCount}</span>
            </div>
          </div>

          {/* Separador */}
          <div className="w-px h-4 bg-[#1F2937]" />

          {/* Tick + Hora */}
          <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-market-medium">{timeString}</span>
            </div>
            <span className="font-market-medium">TICK #{tickSeq}</span>
            <span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}
