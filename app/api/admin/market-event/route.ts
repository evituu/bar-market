import { NextRequest, NextResponse } from 'next/server';
import {
  activateMarketEvent,
  deactivateMarketEvent,
  getActiveMarketEvent,
  type MarketEventType,
} from '@/lib/domain/marketEvents';

/**
 * GET /api/admin/market-event
 * Retorna o evento ativo atual
 */
export async function GET() {
  try {
    const activeEvent = await getActiveMarketEvent();

    return NextResponse.json({
      event: activeEvent,
    });
  } catch (error) {
    console.error('[API] Erro ao buscar evento ativo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar evento ativo' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/market-event
 * Ativa ou desativa um evento de mercado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, durationMinutes } = body;

    // Se event é null, desativa evento atual
    if (!event || event === null) {
      const result = await deactivateMarketEvent();
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        event: null,
        message: 'Evento desativado',
      });
    }

    // Valida tipo de evento
    const validEvents: MarketEventType[] = ['CRASH', 'RESET', 'FREEZE', 'MALUCO'];
    if (!validEvents.includes(event)) {
      return NextResponse.json(
        { error: `Tipo de evento inválido: ${event}` },
        { status: 400 }
      );
    }

    // Duração padrão: 60 minutos (ou até desativar manualmente)
    // Para MALUCO, usa 15 segundos de intervalo interno
    const duration = durationMinutes || 60;

    const result = await activateMarketEvent(event as MarketEventType, duration);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
      eventId: result.eventId,
      message: `Evento ${event} ativado`,
    });
  } catch (error: any) {
    console.error('[API] Erro ao processar evento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

