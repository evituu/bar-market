'use client';

import { Search, Filter, Wine, ChefHat, Eye, EyeOff, RefreshCw } from 'lucide-react';
import type { OrderStatus, PrepArea } from '@/lib/stores/ordersStore';

interface OrdersFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  prepAreaFilter: PrepArea | 'ALL';
  onPrepAreaChange: (area: PrepArea | 'ALL') => void;
  showDelivered: boolean;
  onToggleDelivered: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  counts: Record<OrderStatus, number>;
}

export function OrdersFilters({
  searchQuery,
  onSearchChange,
  prepAreaFilter,
  onPrepAreaChange,
  showDelivered,
  onToggleDelivered,
  isRefreshing,
  onRefresh,
  counts,
}: OrdersFiltersProps) {
  const totalActive = counts.NEW + counts.IN_PROGRESS + counts.READY;

  return (
    <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Busca por mesa */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por mesa..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 focus:border-[#F59E0B]"
          />
        </div>

        {/* Filtro por área */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#6B7280]" />
          <div className="flex bg-[#0B0F14] rounded-lg border border-[#1F2937] p-1">
            <button
              onClick={() => onPrepAreaChange('ALL')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                prepAreaFilter === 'ALL'
                  ? 'bg-[#F59E0B] text-[#0B0F14]'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onPrepAreaChange('BAR')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                prepAreaFilter === 'BAR'
                  ? 'bg-[#F59E0B] text-[#0B0F14]'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              <Wine className="w-3.5 h-3.5" />
              Bar
            </button>
            <button
              onClick={() => onPrepAreaChange('KITCHEN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                prepAreaFilter === 'KITCHEN'
                  ? 'bg-[#8B5CF6] text-white'
                  : 'text-[#9CA3AF] hover:text-[#E5E7EB]'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              Cozinha
            </button>
          </div>
        </div>

        {/* Toggle entregues */}
        <button
          onClick={onToggleDelivered}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
            showDelivered
              ? 'bg-[#1F2937] text-[#E5E7EB] border-[#374151]'
              : 'bg-transparent text-[#6B7280] border-[#1F2937] hover:text-[#9CA3AF]'
          }`}
        >
          {showDelivered ? (
            <>
              <Eye className="w-4 h-4" />
              Entregues
            </>
          ) : (
            <>
              <EyeOff className="w-4 h-4" />
              Entregues
            </>
          )}
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Contador ativo */}
        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#6B7280]">Ativos:</span>
          <span className="font-bold font-market text-[#F59E0B]">{totalActive}</span>
        </div>

        {/* Botão refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>
    </div>
  );
}
