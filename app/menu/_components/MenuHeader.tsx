'use client';

import { useState } from 'react';
import { Search, Wifi, WifiOff, RefreshCw, ShoppingCart } from 'lucide-react';
import { useMarketStream } from '@/lib/context';

interface MenuHeaderProps {
  tableId: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showDebug?: boolean;
  cartCount?: number;
  onCartClick?: () => void;
}

export function MenuHeader({
  tableId,
  searchQuery,
  onSearchChange,
  showDebug = false,
  cartCount = 0,
  onCartClick,
}: MenuHeaderProps) {
  const { isConnected, isReconnecting, snapshot } = useMarketStream();

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F14] border-b border-[#1F2937] safe-area-top">
      <div className="px-4 py-3">
        {/* Linha superior: Logo + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-[#E5E7EB] font-market">
              Bar Market
            </h1>
            {tableId && (
              <span className="px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-semibold rounded">
                {tableId}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Carrinho */}
            {onCartClick && (
              <button
                onClick={onCartClick}
                className="relative p-2 text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#1F2937] rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F59E0B] text-[#0B0F14] text-xs font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Status de conexão (apenas em debug) */}
            {showDebug && (
              <>
                {isReconnecting ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F59E0B]/10 rounded-full">
                    <RefreshCw className="w-3.5 h-3.5 text-[#F59E0B] animate-spin" />
                    <span className="text-xs text-[#F59E0B]">Reconectando...</span>
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#00E676]/10 rounded-full">
                    <Wifi className="w-3.5 h-3.5 text-[#00E676]" />
                    <span className="text-xs text-[#00E676] font-market-medium">
                      Tick #{snapshot?.tick ?? 0}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-[#FF1744]/10 rounded-full">
                    <WifiOff className="w-3.5 h-3.5 text-[#FF1744]" />
                    <span className="text-xs text-[#FF1744]">Offline</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Barra de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar bebida..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#111827] border border-[#1F2937] rounded-xl text-sm text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F59E0B] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#E5E7EB]"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
