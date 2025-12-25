import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/data';
import { validateTicker } from '@/lib/utils/ticker';

/**
 * GET /api/admin/tickers/check?ticker=GINT3&excludeId=prod-3
 * Verifica se um ticker está disponível
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');
    const excludeId = searchParams.get('excludeId') || undefined;

    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker é obrigatório' },
        { status: 400 }
      );
    }

    // Valida formato
    const validation = validateTicker(ticker);
    if (!validation.valid) {
      return NextResponse.json(
        {
          available: false,
          error: validation.error,
        },
        { status: 200 }
      );
    }

    // Verifica se já existe (excluindo o próprio produto se estiver editando)
    const existingProduct = MOCK_PRODUCTS.find(
      (p) => p.ticker.toUpperCase() === ticker.toUpperCase() && p.id !== excludeId
    );

    return NextResponse.json({
      available: !existingProduct,
      ticker: ticker.toUpperCase(),
    });
  } catch (error) {
    console.error('Erro ao verificar ticker:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
