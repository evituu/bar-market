import { NextRequest, NextResponse } from 'next/server';
import { getProductsWithPricesFromDB, type ProductWithPrice } from '@/lib/domain/products';
import { getActiveMarketEvent, applyMarketEventToPrices } from '@/lib/domain/marketEvents';

// Interface do snapshot de mercado
interface MarketSnapshot {
  tick: number;
  timestamp: string;
  products: ProductWithPrice[];
  activeEvent?: string | null;
}

// Gera snapshot atual do mercado com eventos aplicados
async function generateSnapshot(): Promise<MarketSnapshot> {
  // Busca produtos do banco
  const products = await getProductsWithPricesFromDB();
  
  // Busca evento ativo
  const activeEvent = await getActiveMarketEvent();
  
  // Aplica evento aos preços se houver evento ativo
  const pricesWithEvent = applyMarketEventToPrices(
    products.map((p) => ({
      id: p.id,
      basePriceCents: p.basePriceCents,
      priceFloorCents: p.priceFloorCents,
      priceCapCents: p.priceCapCents,
      currentPriceCents: p.currentPriceCents,
      prevPriceCents: p.prevPriceCents,
    })),
    activeEvent
  );

  // Atualiza produtos com preços modificados pelo evento
  const productsWithEvent: ProductWithPrice[] = products.map((product) => {
    const modifiedPrice = pricesWithEvent.find((p) => p.id === product.id);
    if (!modifiedPrice) return product;

    // Recalcula priceChange baseado no novo preço
    const priceChange =
      modifiedPrice.prevPriceCents > 0
        ? (modifiedPrice.currentPriceCents - modifiedPrice.prevPriceCents) /
          modifiedPrice.prevPriceCents
        : 0;

    return {
      ...product,
      currentPriceCents: modifiedPrice.currentPriceCents,
      prevPriceCents: modifiedPrice.prevPriceCents,
      priceChange,
    };
  });

  const tick = productsWithEvent[0]?.tickSeq ?? 0;

  return {
    tick,
    timestamp: new Date().toISOString(),
    products: productsWithEvent,
    activeEvent: activeEvent || null,
  };
}

// GET /api/stream/precos - SSE ou polling
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isPoll = searchParams.get('poll') === 'true';

  // Modo polling: retorna JSON único
  if (isPoll) {
    const snapshot = await generateSnapshot();
    return NextResponse.json(snapshot);
  }

  // Modo SSE: stream contínuo
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastMalucoUpdate = Date.now();
      const MALUCO_INTERVAL_MS = 15000; // 15 segundos para MALUCO
      const DEFAULT_INTERVAL_MS = 3000; // 3 segundos padrão

      // Envia snapshot inicial
      const sendSnapshot = async () => {
        try {
          const snapshot = await generateSnapshot();
          const data = `data: ${JSON.stringify(snapshot)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('[SSE] Erro ao enviar snapshot:', error);
        }
      };

      // Snapshot imediato
      await sendSnapshot();

      // Atualiza a cada 3 segundos
      // Para MALUCO, só atualiza a cada 15 segundos (mas verifica a cada 3s)
      const interval = setInterval(async () => {
        const now = Date.now();
        const activeEvent = await getActiveMarketEvent();
        
        // Se MALUCO e passou 15s desde última atualização, força novo snapshot
        if (activeEvent === 'MALUCO') {
          if (now - lastMalucoUpdate >= MALUCO_INTERVAL_MS) {
            lastMalucoUpdate = now;
            await sendSnapshot();
          }
        } else {
          // Para outros eventos, sempre atualiza
          await sendSnapshot();
        }
      }, DEFAULT_INTERVAL_MS);

      // Cleanup quando conexão fecha
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Desabilita buffering no nginx
    },
  });
}
