'use client';

import { Activity, Clock, Zap } from 'lucide-react';
import type { ProductWithPrice } from '@/data';
import { pricingConfig } from '@/data';

interface MarketHeaderProps {
  products: ProductWithPrice[];
  tickSeq: number;
}

export function MarketHeader({ products, tickSeq }: MarketHeaderProps) {
  const upCount = products.filter((p) => p.priceChange > 0).length;
  const downCount = products.filter((p) => p.priceChange < 0).length;
  const neutralCount = products.filter((p) => p.priceChange === 0).length;

  const avgChange =
    products.length > 0
      ? products.reduce((acc, p) => acc + p.priceChange, 0) / products.length
      : 0;

  const marketTrend =
    avgChange > 0 ? 'ALTA' : avgChange < 0 ? 'BAIXA' : 'ESTÁVEL';
  const marketColor =
    avgChange > 0
      ? 'text-[#16A34A]'
      : avgChange < 0
        ? 'text-[#DC2626]'
        : 'text-[#F59E0B]';

  return (
    <header className="bg-[#111827] border-b border-[#1F2937] px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Logo e Título */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-[#2563EB]/10 rounded-lg">
            <Activity className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#E5E7EB] tracking-tight">
              Bar Market
            </h1>
            <p className="text-sm text-[#9CA3AF]">Cotações em Tempo Real</p>
          </div>
        </div>

        {/* Indicadores */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Tendência do Mercado */}
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${marketColor}`} />
            <div>
              <p className="text-xs text-[#9CA3AF] uppercase tracking-wide">
                Mercado
              </p>
              <p className={`text-lg font-bold ${marketColor}`}>{marketTrend}</p>
            </div>
          </div>

          {/* Altas / Quedas */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF]">Altas</p>
              <p className="text-lg font-bold text-[#16A34A]">{upCount}</p>
            </div>
            <div className="w-px h-8 bg-[#1F2937]" />
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF]">Quedas</p>
              <p className="text-lg font-bold text-[#DC2626]">{downCount}</p>
            </div>
            <div className="w-px h-8 bg-[#1F2937]" />
            <div className="text-center">
              <p className="text-xs text-[#9CA3AF]">Estável</p>
              <p className="text-lg font-bold text-[#F59E0B]">{neutralCount}</p>
            </div>
          </div>

          {/* Tick Info */}
          <div className="flex items-center gap-2 px-4 py-2 bg-[#0B0F14] rounded-lg border border-[#1F2937]">
            <Clock className="w-4 h-4 text-[#9CA3AF]" />
            <div>
              <p className="text-xs text-[#9CA3AF]">Tick #{tickSeq}</p>
              <p className="text-xs text-[#9CA3AF]">
                Atualização: {pricingConfig.tickSeconds}s
              </p>
            </div>
            <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </header>
  );
}
