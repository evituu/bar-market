'use client';

import { useState, useEffect } from 'react';
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

type MarketEvent = 'CRASH' | 'RESET' | 'FREEZE' | 'MALUCO' | null;

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
      try {
        const response = await fetch('/api/admin/market-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: null }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[Admin] Erro ao desativar evento:', error);
          alert('Erro ao desativar evento. Tente novamente.');
          setEventLoading(null);
          return;
        }

        setActiveEvent(null);
      } catch (error) {
        console.error('[Admin] Erro na requisição:', error);
        alert('Erro de conexão. Tente novamente.');
      } finally {
        setEventLoading(null);
      }
    } else {
      // Ativar evento
      setEventLoading(event);
      try {
        // Duração padrão: 60 minutos (ou até desativar manualmente)
        // Para MALUCO, o intervalo de 15s é gerenciado internamente
        const durationMinutes = event === 'MALUCO' ? 60 : 60;

        const response = await fetch('/api/admin/market-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, durationMinutes }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[Admin] Erro ao ativar evento:', error);
          alert(`Erro ao ativar evento: ${error.error || 'Erro desconhecido'}`);
          setEventLoading(null);
          return;
        }

        const data = await response.json();
        setActiveEvent(event);
      } catch (error) {
        console.error('[Admin] Erro na requisição:', error);
        alert('Erro de conexão. Tente novamente.');
      } finally {
        setEventLoading(null);
      }
    }
  };

  // Busca evento ativo ao carregar página
  useEffect(() => {
    const fetchActiveEvent = async () => {
      try {
        const response = await fetch('/api/admin/market-event');
        if (response.ok) {
          const data = await response.json();
          setActiveEvent(data.event as MarketEvent);
        }
      } catch (error) {
        console.error('[Admin] Erro ao buscar evento ativo:', error);
      }
    };

    fetchActiveEvent();
  }, []);

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

          {/* RESET Button */}
          <button
            onClick={() => handleEventClick('RESET')}
            disabled={eventLoading !== null}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeEvent === 'RESET'
                ? 'bg-[#6B7280] text-white shadow-lg shadow-[#6B7280]/30 ring-2 ring-[#6B7280]/50'
                : 'bg-[#1F2937] text-[#6B7280] hover:bg-[#6B7280]/10 border border-[#6B7280]/30'
              }
              ${eventLoading === 'RESET' ? 'opacity-70 cursor-wait' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <svg className={`w-4 h-4 ${eventLoading === 'RESET' ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            RESET
            {activeEvent === 'RESET' && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">ATIVO</span>
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

          {/* MALUCO Button */}
          <button
            onClick={() => handleEventClick('MALUCO')}
            disabled={eventLoading !== null}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
              ${activeEvent === 'MALUCO'
                ? 'bg-[#A855F7] text-white shadow-lg shadow-[#A855F7]/30 ring-2 ring-[#A855F7]/50'
                : 'bg-[#1F2937] text-[#A855F7] hover:bg-[#A855F7]/10 border border-[#A855F7]/30'
              }
              ${eventLoading === 'MALUCO' ? 'opacity-70 cursor-wait' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <Zap className={`w-4 h-4 ${eventLoading === 'MALUCO' ? 'animate-bounce' : ''}`} />
            MALUCO
            {activeEvent === 'MALUCO' && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">ATIVO</span>
            )}
          </button>
        </div>

        {/* Event Description */}
        {activeEvent && (
          <div className={`
            mt-3 px-4 py-2 rounded-lg text-sm
            ${activeEvent === 'CRASH' ? 'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/20' : ''}
            ${activeEvent === 'RESET' ? 'bg-[#6B7280]/10 text-[#6B7280] border border-[#6B7280]/20' : ''}
            ${activeEvent === 'FREEZE' ? 'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20' : ''}
            ${activeEvent === 'MALUCO' ? 'bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20' : ''}
          `}>
            {activeEvent === 'CRASH' && '⚡ CRASH ativo! Todos os preços caindo rapidamente.'}
            {activeEvent === 'RESET' && '🔄 RESET ativo! Todos os preços restaurados para o valor base.'}
            {activeEvent === 'FREEZE' && '❄️ FREEZE ativo! Preços congelados temporariamente.'}
            {activeEvent === 'MALUCO' && '🤪 MALUCO ativo! Preços oscilando loucamente a cada 15 segundos!'}
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
