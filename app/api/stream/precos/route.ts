import { NextRequest, NextResponse } from 'next/server';
import { getProductsWithPrices, type ProductWithPrice } from '@/data';

// Interface do snapshot de mercado
interface MarketSnapshot {
  tick: number;
  timestamp: string;
  products: ProductWithPrice[];
}

// Gera snapshot atual do mercado
function generateSnapshot(): MarketSnapshot {
  const products = getProductsWithPrices();
  const tick = products[0]?.tickSeq ?? 0;

  return {
    tick,
    timestamp: new Date().toISOString(),
    products,
  };
}

// GET /api/stream/precos - SSE ou polling
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isPoll = searchParams.get('poll') === 'true';

  // Modo polling: retorna JSON único
  if (isPoll) {
    const snapshot = generateSnapshot();
    return NextResponse.json(snapshot);
  }

  // Modo SSE: stream contínuo
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Envia snapshot inicial
      const sendSnapshot = () => {
        try {
          const snapshot = generateSnapshot();
          const data = `data: ${JSON.stringify(snapshot)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('[SSE] Erro ao enviar snapshot:', error);
        }
      };

      // Snapshot imediato
      sendSnapshot();

      // Atualiza a cada 3 segundos (simula tick)
      const interval = setInterval(() => {
        sendSnapshot();
      }, 3000);

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
