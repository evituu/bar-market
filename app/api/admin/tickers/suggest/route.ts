import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/data';
import { generateTickerSuggestions } from '@/lib/utils/ticker';

/**
 * POST /api/admin/tickers/suggest
 * Body: { name: string, category?: string, excludeId?: string }
 * Retorna sugestões de ticker baseadas no nome do produto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, excludeId } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Nome do produto é obrigatório' },
        { status: 400 }
      );
    }

    // Coleta tickers existentes (excluindo o produto atual se estiver editando)
    const existingTickers = new Set(
      MOCK_PRODUCTS
        .filter((p) => p.id !== excludeId)
        .map((p) => p.ticker.toUpperCase())
    );

    // Gera sugestões
    const suggestions = generateTickerSuggestions(name, category, existingTickers);

    return NextResponse.json({
      suggestions,
      name,
      category,
    });
  } catch (error) {
    console.error('Erro ao gerar sugestões de ticker:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
