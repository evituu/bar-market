import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateProduct } from '@/lib/domain/products';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/products/:id - Detalhe do produto
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const product = await prisma.products.findUnique({
      where: { id },
      include: {
        price_states: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const priceState = product.price_states;
    const currentPriceCents = priceState?.price_cents ?? product.base_price_cents;
    const prevPriceCents = priceState?.prev_price_cents ?? product.base_price_cents;

    return NextResponse.json({
      product: {
        id: product.id,
        sku: product.sku,
        ticker: product.ticker,
        tickerSource: product.ticker_source as 'AUTO' | 'MANUAL',
        name: product.name,
        description: product.description,
        category: product.category,
        isActive: product.is_active,
        basePriceCents: product.base_price_cents,
        priceFloorCents: product.price_floor_cents,
        priceCapCents: product.price_cap_cents,
        currentPriceCents,
        prevPriceCents,
        tickSeq: priceState ? Number(priceState.tick_seq) : 0,
        createdAt: product.created_at.toISOString(),
        updatedAt: product.updated_at.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API] Erro ao buscar produto:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/:id - Edita produto
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Valida tipos numéricos
    const numericFields = ['basePriceCents', 'priceFloorCents', 'priceCapCents'];
    for (const field of numericFields) {
      if (body[field] !== undefined && (typeof body[field] !== 'number' || body[field] < 0)) {
        return NextResponse.json(
          { error: `${field} deve ser um número positivo` },
          { status: 400 }
        );
      }
    }

    // Converte valores monetários para inteiros (centavos)
    const updateData: any = {};
    if (body.basePriceCents !== undefined) {
      updateData.basePriceCents = Math.round(body.basePriceCents);
    }
    if (body.priceFloorCents !== undefined) {
      updateData.priceFloorCents = Math.round(body.priceFloorCents);
    }
    if (body.priceCapCents !== undefined) {
      updateData.priceCapCents = Math.round(body.priceCapCents);
    }

    // Adiciona outros campos se fornecidos
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.ticker !== undefined) updateData.ticker = body.ticker;
    if (body.tickerSource !== undefined) updateData.tickerSource = body.tickerSource;
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Chama função de domínio para atualizar
    const result = await updateProduct(id, updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, code: result.code },
        { status: 400 }
      );
    }

    // Busca produto atualizado para retornar
    const updatedProduct = await prisma.products.findUnique({
      where: { id },
      include: {
        price_states: true,
      },
    });

    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Erro ao buscar produto atualizado' },
        { status: 500 }
      );
    }

    const priceState = updatedProduct.price_states;
    const currentPriceCents = priceState?.price_cents ?? updatedProduct.base_price_cents;
    const prevPriceCents = priceState?.prev_price_cents ?? updatedProduct.base_price_cents;

    return NextResponse.json({
      product: {
        id: updatedProduct.id,
        sku: updatedProduct.sku,
        ticker: updatedProduct.ticker,
        tickerSource: updatedProduct.ticker_source as 'AUTO' | 'MANUAL',
        name: updatedProduct.name,
        description: updatedProduct.description,
        category: updatedProduct.category,
        isActive: updatedProduct.is_active,
        basePriceCents: updatedProduct.base_price_cents,
        priceFloorCents: updatedProduct.price_floor_cents,
        priceCapCents: updatedProduct.price_cap_cents,
        currentPriceCents,
        prevPriceCents,
        tickSeq: priceState ? Number(priceState.tick_seq) : 0,
        createdAt: updatedProduct.created_at.toISOString(),
        updatedAt: updatedProduct.updated_at.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API] Erro ao atualizar produto:', error);
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
