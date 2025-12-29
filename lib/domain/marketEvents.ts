/**
 * Domínio de Market Events
 * Gerencia eventos especiais de mercado (CRASH, RESET, FREEZE, MALUCO)
 */

import { prisma } from '@/lib/prisma';

export type MarketEventType = 'CRASH' | 'RESET' | 'FREEZE' | 'MALUCO';

export interface MarketEventPayload {
  [key: string]: any;
}

export interface MarketEvent {
  id: string;
  type: MarketEventType;
  startsAt: Date;
  endsAt: Date;
  payload: MarketEventPayload;
  isActive: boolean;
  createdAt: Date;
}

/**
 * Busca o evento ativo atual
 */
export async function getActiveMarketEvent(): Promise<MarketEventType | null> {
  try {
    const now = new Date();
    
    const activeEvent = await prisma.market_events.findFirst({
      where: {
        is_active: true,
        starts_at: { lte: now },
        ends_at: { gte: now },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!activeEvent) return null;

    return activeEvent.type as MarketEventType;
  } catch (error) {
    console.error('[getActiveMarketEvent] Error:', error);
    return null;
  }
}

/**
 * Ativa um evento de mercado
 * Desativa qualquer evento ativo anterior e cria um novo
 */
export async function activateMarketEvent(
  type: MarketEventType,
  durationMinutes: number = 60
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const now = new Date();
    const endsAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // Desativa todos os eventos ativos anteriores
    await prisma.market_events.updateMany({
      where: {
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    // Cria novo evento
    const event = await prisma.market_events.create({
      data: {
        type,
        starts_at: now,
        ends_at: endsAt,
        payload: {},
        is_active: true,
      },
    });

    return {
      success: true,
      eventId: event.id,
    };
  } catch (error: any) {
    console.error('[activateMarketEvent] Error:', error);
    return {
      success: false,
      error: 'Erro ao ativar evento de mercado',
    };
  }
}

/**
 * Desativa o evento ativo atual
 */
export async function deactivateMarketEvent(): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.market_events.updateMany({
      where: {
        is_active: true,
      },
      data: {
        is_active: false,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error('[deactivateMarketEvent] Error:', error);
    return {
      success: false,
      error: 'Erro ao desativar evento de mercado',
    };
  }
}

/**
 * Aplica um evento aos preços dos produtos
 */
export function applyMarketEventToPrices(
  products: Array<{
    id: string;
    basePriceCents: number;
    priceFloorCents: number;
    priceCapCents: number;
    currentPriceCents: number;
    prevPriceCents: number;
  }>,
  event: MarketEventType | null
): Array<{
  id: string;
  currentPriceCents: number;
  prevPriceCents: number;
}> {
  if (!event) {
    return products.map((p) => ({
      id: p.id,
      currentPriceCents: p.currentPriceCents,
      prevPriceCents: p.prevPriceCents,
    }));
  }

  switch (event) {
    case 'CRASH':
      // Reduz preços em 20% (mas não abaixo do floor)
      return products.map((p) => {
        const newPrice = Math.max(
          p.priceFloorCents,
          Math.floor(p.currentPriceCents * 0.8)
        );
        return {
          id: p.id,
          currentPriceCents: newPrice,
          prevPriceCents: p.currentPriceCents,
        };
      });

    case 'RESET':
      // Restaura para preço base
      return products.map((p) => ({
        id: p.id,
        currentPriceCents: p.basePriceCents,
        prevPriceCents: p.currentPriceCents,
      }));

    case 'FREEZE':
      // Mantém preços congelados (sem mudanças)
      return products.map((p) => ({
        id: p.id,
        currentPriceCents: p.currentPriceCents,
        prevPriceCents: p.prevPriceCents,
      }));

    case 'MALUCO':
      // Oscila aleatoriamente entre floor e cap
      return products.map((p) => {
        const range = p.priceCapCents - p.priceFloorCents;
        const randomFactor = Math.random(); // 0 a 1
        const newPrice = Math.floor(
          p.priceFloorCents + range * randomFactor
        );
        return {
          id: p.id,
          currentPriceCents: newPrice,
          prevPriceCents: p.currentPriceCents,
        };
      });

    default:
      return products.map((p) => ({
        id: p.id,
        currentPriceCents: p.currentPriceCents,
        prevPriceCents: p.prevPriceCents,
      }));
  }
}

