'use client';

import { useMarketStream } from '@/lib/context';
import {
  MarketHeader,
  TickerTape,
  DrinkValueBoard,
} from './';

export function TelaoClient() {
  const { snapshot, isConnected } = useMarketStream();

  // Se não há snapshot ainda, mostra loading
  if (!snapshot) {
    return (
      <div className="h-screen bg-[#0B0F14] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9CA3AF]">Carregando mercado...</p>
        </div>
      </div>
    );
  }

  const products = snapshot.products;
  const tickSeq = snapshot.tick || 0;

  return (
    <div className="h-screen bg-[#0B0F14] flex flex-col overflow-hidden">
      {/* Header compacto estilo terminal */}
      <MarketHeader products={products} tickSeq={tickSeq} />

      {/* Ticker Tape */}
      <div className="shrink-0">
        <TickerTape products={products} />
      </div>

      {/* Board tabular - área principal elástica */}
      <DrinkValueBoard products={products} />
    </div>
  );
}

