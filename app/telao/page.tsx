import { getProductsWithPricesFromDB } from '@/lib/domain/products';
import {
  MarketHeader,
  TickerTape,
  DrinkValueBoard,
} from './_components';

export default async function TelaoPage() {
  // Busca produtos do banco de dados (apenas ativos)
  const products = await getProductsWithPricesFromDB();
  const tickSeq = products[0]?.tickSeq ?? 0;

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
