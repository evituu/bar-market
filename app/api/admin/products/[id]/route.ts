import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS, MOCK_PRICE_STATE } from '@/data';
import { validateTicker } from '@/lib/utils/ticker';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/products/:id - Detalhe do produto
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const product = MOCK_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json(
      { error: 'Produto não encontrado' },
      { status: 404 }
    );
  }

  const priceState = MOCK_PRICE_STATE.find((ps) => ps.productId === id);

  return NextResponse.json({
    product: {
      ...product,
      currentPriceCents: priceState?.priceCents ?? product.basePriceCents,
      prevPriceCents: priceState?.prevPriceCents ?? product.basePriceCents,
      tickSeq: priceState?.tickSeq ?? 0,
    },
  });
}

// PATCH /api/admin/products/:id - Edita produto
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const product = MOCK_PRODUCTS.find((p) => p.id === id);

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const {
      name,
      sku,
      ticker,
      tickerSource,
      description,
      category,
      basePriceCents,
      priceFloorCents,
      priceCapCents,
      isActive,
    } = body;

    // Valida ticker se fornecido
    if (ticker !== undefined) {
      if (!ticker) {
        return NextResponse.json(
          { error: 'Ticker não pode ser vazio' },
          { status: 400 }
        );
      }

      const tickerValidation = validateTicker(ticker);
      if (!tickerValidation.valid) {
        return NextResponse.json(
          { error: tickerValidation.error },
          { status: 400 }
        );
      }

      // Verifica se ticker já existe (excluindo o próprio produto)
      const tickerExists = MOCK_PRODUCTS.some(
        (p) => p.id !== id && p.ticker.toUpperCase() === ticker.toUpperCase()
      );
      if (tickerExists) {
        return NextResponse.json(
          { error: 'Ticker já está em uso' },
          { status: 400 }
        );
      }
    }

    // Validações de preço se fornecidos
    const floor = priceFloorCents ?? product.priceFloorCents;
    const base = basePriceCents ?? product.basePriceCents;
    const cap = priceCapCents ?? product.priceCapCents;

    if (floor > base) {
      return NextResponse.json(
        { error: 'Floor deve ser menor ou igual ao preço base' },
        { status: 400 }
      );
    }

    if (base > cap) {
      return NextResponse.json(
        { error: 'Cap deve ser maior ou igual ao preço base' },
        { status: 400 }
      );
    }

    if (floor >= cap) {
      return NextResponse.json(
        { error: 'Floor deve ser menor que Cap' },
        { status: 400 }
      );
    }

    // Atualiza produto (em produção, salvaria no banco)
    const updatedProduct = {
      ...product,
      name: name ?? product.name,
      sku: sku ?? product.sku,
      ticker: ticker ? ticker.toUpperCase() : product.ticker,
      tickerSource: tickerSource ?? product.tickerSource,
      description: description ?? product.description,
      category: category ?? product.category,
      basePriceCents: base,
      priceFloorCents: floor,
      priceCapCents: cap,
      isActive: isActive ?? product.isActive,
      updatedAt: new Date(),
    };

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/:id - Remove produto (opcional)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const product = MOCK_PRODUCTS.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json(
      { error: 'Produto não encontrado' },
      { status: 404 }
    );
  }

  // Em produção: remover do banco
  // await db.products.delete(id);
  // await db.priceState.deleteByProductId(id);

  return NextResponse.json({ success: true });
}
