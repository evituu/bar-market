import { Suspense } from 'react';
import { MarketStreamProvider } from '@/lib/context';
import { MenuClient } from './_components';

export const metadata = {
  title: 'Cardápio | Bar Market',
  description: 'Cardápio de bebidas com preços em tempo real',
};

export default function MenuPage() {
  return (
    <MarketStreamProvider fallbackToPolling>
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#9CA3AF]">Carregando cardápio...</p>
            </div>
          </div>
        }
      >
        <MenuClient />
      </Suspense>
    </MarketStreamProvider>
  );
}
