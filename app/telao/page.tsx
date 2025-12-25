import { getProductsWithPrices } from '@/data';
import {
  MarketHeader,
  TickerTape,
  DrinkValueBoard,
} from './_components';

export default function TelaoPage() {
  const products = getProductsWithPrices();
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
