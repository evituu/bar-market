'use client';

import { useState } from 'react';
import { Package, Tags, Activity, TrendingUp, TrendingDown, Zap, Gift, Snowflake } from 'lucide-react';
import {
  getProductsWithPrices,
  getAllCategories,
  MOCK_PRODUCTS,
} from '@/data';
import {
  AdminLayout,
  StatCard,
  RankingPanel,
  MarketTable,
} from './_components';

type MarketEvent = 'CRASH' | 'PROMO' | 'FREEZE' | null;

export default function AdminDashboard() {
  const [activeEvent, setActiveEvent] = useState<MarketEvent>(null);
  const [eventLoading, setEventLoading] = useState<MarketEvent>(null);

  const products = getProductsWithPrices();
  const categories = getAllCategories();
  const tickSeq = products[0]?.tickSeq ?? 0;

  // Estatísticas
  const activeProducts = MOCK_PRODUCTS.filter((p) => p.isActive).length;
  const totalProducts = MOCK_PRODUCTS.length;

  // Contagem de altas e baixas
  const gainers = products.filter((p) => p.priceChange > 0);
  const losers = products.filter((p) => p.priceChange < 0);
  const stable = products.filter((p) => p.priceChange === 0);

  // Handler de eventos de mercado
  const handleEventClick = async (event: MarketEvent) => {
    if (activeEvent === event) {
      // Desativar evento
      setEventLoading(event);
      // TODO: POST /api/admin/market-event { event: null }
      await new Promise((r) => setTimeout(r, 500)); // Simula API
      setActiveEvent(null);
      setEventLoading(null);
    } else {
      // Ativar evento
      setEventLoading(event);
      // TODO: POST /api/admin/market-event { event }
      await new Promise((r) => setTimeout(r, 500)); // Simula API
      setActiveEvent(event);
      setEventLoading(null);
    }
  };

  return (
    <AdminLayout>
      {/* Market Event Buttons */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-[#9CA3AF] mb-3 uppercase tracking-wider">
          Eventos de Mercado
        </h3>
        <div className="flex flex-wrap gap-3">
          {/* CRASH Button */}
          <button
            onClick={() => handleEventClick('CRASH')}
            disabled={eventLoading !== null}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeEvent === 'CRASH'
                ? 'bg-[#FF1744] text-white shadow-lg shadow-[#FF1744]/30 ring-2 ring-[#FF1744]/50'
                : 'bg-[#1F2937] text-[#FF1744] hover:bg-[#FF1744]/10 border border-[#FF1744]/30'
              }
              ${eventLoading === 'CRASH' ? 'opacity-70 cursor-wait' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Zap className={`w-4 h-4 ${eventLoading === 'CRASH' ? 'animate-pulse' : ''}`} />
            CRASH
            {activeEvent === 'CRASH' && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">ATIVO</span>
            )}
          </button>

          {/* PROMO Button */}
          <button
            onClick={() => handleEventClick('PROMO')}
            disabled={eventLoading !== null}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeEvent === 'PROMO'
                ? 'bg-[#00E676] text-[#0B0F14] shadow-lg shadow-[#00E676]/30 ring-2 ring-[#00E676]/50'
                : 'bg-[#1F2937] text-[#00E676] hover:bg-[#00E676]/10 border border-[#00E676]/30'
              }
              ${eventLoading === 'PROMO' ? 'opacity-70 cursor-wait' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Gift className={`w-4 h-4 ${eventLoading === 'PROMO' ? 'animate-pulse' : ''}`} />
            PROMO
            {activeEvent === 'PROMO' && (
              <span className="ml-1 px-1.5 py-0.5 bg-black/20 rounded text-xs">ATIVO</span>
            )}
          </button>

          {/* FREEZE Button */}
          <button
            onClick={() => handleEventClick('FREEZE')}
            disabled={eventLoading !== null}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeEvent === 'FREEZE'
                ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30 ring-2 ring-[#2563EB]/50'
                : 'bg-[#1F2937] text-[#2563EB] hover:bg-[#2563EB]/10 border border-[#2563EB]/30'
              }
              ${eventLoading === 'FREEZE' ? 'opacity-70 cursor-wait' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Snowflake className={`w-4 h-4 ${eventLoading === 'FREEZE' ? 'animate-pulse' : ''}`} />
            FREEZE
            {activeEvent === 'FREEZE' && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">ATIVO</span>
            )}
          </button>
        </div>

        {/* Event Description */}
        {activeEvent && (
          <div className={`
            mt-3 px-4 py-2 rounded-lg text-sm
            ${activeEvent === 'CRASH' ? 'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/20' : ''}
            ${activeEvent === 'PROMO' ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20' : ''}
            ${activeEvent === 'FREEZE' ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20' : ''}
          `}>
            {activeEvent === 'CRASH' && '⚡ CRASH ativo! Todos os preços caindo rapidamente.'}
            {activeEvent === 'PROMO' && '🎁 PROMO ativo! Descontos especiais aplicados.'}
            {activeEvent === 'FREEZE' && '❄️ FREEZE ativo! Preços congelados temporariamente.'}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Produtos Ativos"
          value={activeProducts}
          subtitle={`de ${totalProducts} total`}
          icon={Package}
          color="#2563EB"
        />
        <StatCard
          title="Categorias"
          value={categories.length}
          icon={Tags}
          color="#8B5CF6"
        />
        <StatCard
          title="Em Alta"
          value={gainers.length}
          subtitle={`${losers.length} em queda, ${stable.length} estáveis`}
          icon={TrendingUp}
          color="#00E676"
        />
        <StatCard
          title="Tick Atual"
          value={`#${tickSeq}`}
          subtitle="Sequência do mercado"
          icon={Activity}
          color="#F59E0B"
        />
      </div>

      {/* Ranking Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RankingPanel
          title="Top Valorizados"
          products={products}
          type="gainers"
          maxItems={5}
        />
        <RankingPanel
          title="Top Depreciados"
          products={products}
          type="losers"
          maxItems={5}
        />
      </div>

      {/* Market Table */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#E5E7EB] mb-4">
          Visão Geral do Mercado
        </h2>
        <MarketTable products={products} categories={categories} />
      </div>
    </AdminLayout>
  );
}
