import { getProductsWithPrices } from '@/data';
import {
  MarketHeader,
  TickerTape,
  MarketRanking,
  PriceTicker,
} from './_components';

export default function TelaoPage() {
  const products = getProductsWithPrices();
  const tickSeq = products[0]?.tickSeq ?? 0;

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col">
      {/* Header com indicadores do mercado */}
      <MarketHeader products={products} tickSeq={tickSeq} />

      {/* Ticker Tape (faixa de cotações correndo) */}
      <TickerTape products={products} />

      {/* Conteúdo Principal */}
      <main className="flex-1 px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Rankings: Altas, Quedas, Mais Negociados */}
          <section>
            <h2 className="text-lg font-semibold text-[#E5E7EB] mb-6 uppercase tracking-wide">
              Destaques do Mercado
            </h2>
            <MarketRanking products={products} />
          </section>

          {/* Grid de Cotações */}
          <section>
            <h2 className="text-lg font-semibold text-[#E5E7EB] mb-6 uppercase tracking-wide">
              Todas as Cotações
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <PriceTicker key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#111827] border-t border-[#1F2937] px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-[#9CA3AF]">
            Bar Market © {new Date().getFullYear()} — Cotações em tempo real
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#16A34A] rounded-full animate-pulse" />
            <span className="text-sm text-[#9CA3AF]">Sistema ativo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
