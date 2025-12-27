import { NextRequest, NextResponse } from 'next/server';
import { createProduct, type CreateProductInput } from '@/lib/domain/products';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/products
 * Lista todos os produtos com seus preços atuais
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    // Monta filtros
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (isActive !== null) {
      where.is_active = isActive === 'true';
    }

    // Busca produtos com price_states
    const products = await prisma.products.findMany({
      where,
      include: {
        price_states: true,
      },
      orderBy: [
        { is_active: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Formata resposta
    const formattedProducts = products.map((product) => {
      const priceState = product.price_states;
      return {
        id: product.id,
        sku: product.sku,
        ticker: product.ticker,
        tickerSource: product.ticker_source,
        name: product.name,
        description: product.description,
        category: product.category,
        isActive: product.is_active,
        basePriceCents: product.base_price_cents,
        priceFloorCents: product.price_floor_cents,
        priceCapCents: product.price_cap_cents,
        currentPriceCents: priceState?.price_cents ?? product.base_price_cents,
        prevPriceCents: priceState?.prev_price_cents ?? product.base_price_cents,
        tickSeq: priceState?.tick_seq ? Number(priceState.tick_seq) : 0,
        createdAt: product.created_at.toISOString(),
        updatedAt: product.updated_at.toISOString(),
      };
    });

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
    });
  } catch (error) {
    console.error('[GET /api/admin/products] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products
 * Cria novo produto com inicialização de price_states
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extrai e valida campos
    const {
      sku,
      ticker,
      tickerSource = 'MANUAL',
      name,
      description,
      category,
      isActive = true,
      basePriceCents,
      priceFloorCents,
      priceCapCents,
    } = body;

    // Validação básica de tipos
    if (typeof basePriceCents !== 'number' || basePriceCents <= 0) {
      return NextResponse.json(
        { error: 'Preço base deve ser um número positivo' },
        { status: 400 }
      );
    }

    if (typeof priceFloorCents !== 'number' || priceFloorCents < 0) {
      return NextResponse.json(
        { error: 'Preço mínimo deve ser um número não negativo' },
        { status: 400 }
      );
    }

    if (typeof priceCapCents !== 'number' || priceCapCents <= 0) {
      return NextResponse.json(
        { error: 'Preço máximo deve ser um número positivo' },
        { status: 400 }
      );
    }

    // Prepara input para função de domínio
    const input: CreateProductInput = {
      sku: String(sku || '').trim(),
      ticker: String(ticker || '').trim(),
      tickerSource: tickerSource === 'AUTO' ? 'AUTO' : 'MANUAL',
      name: String(name || '').trim(),
      description: description ? String(description).trim() : null,
      category: String(category || '').trim(),
      isActive: Boolean(isActive),
      basePriceCents: Math.round(basePriceCents),
      priceFloorCents: Math.round(priceFloorCents),
      priceCapCents: Math.round(priceCapCents),
    };

    // Chama função de domínio
    const result = await createProduct(input);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          code: result.code,
        },
        { status: 400 }
      );
    }

    // Busca produto criado para retornar
    const createdProduct = await prisma.products.findUnique({
      where: { id: result.productId! },
      include: {
        price_states: true,
      },
    });

    if (!createdProduct) {
      return NextResponse.json(
        { error: 'Produto criado mas não encontrado' },
        { status: 500 }
      );
    }

    // Formata resposta
    const priceState = createdProduct.price_states;
    const formattedProduct = {
      id: createdProduct.id,
      sku: createdProduct.sku,
      ticker: createdProduct.ticker,
      tickerSource: createdProduct.ticker_source,
      name: createdProduct.name,
      description: createdProduct.description,
      category: createdProduct.category,
      isActive: createdProduct.is_active,
      basePriceCents: createdProduct.base_price_cents,
      priceFloorCents: createdProduct.price_floor_cents,
      priceCapCents: createdProduct.price_cap_cents,
      currentPriceCents: priceState?.price_cents ?? createdProduct.base_price_cents,
      prevPriceCents: priceState?.prev_price_cents ?? createdProduct.base_price_cents,
      tickSeq: priceState ? Number(priceState.tick_seq) : 0,
      createdAt: createdProduct.created_at.toISOString(),
      updatedAt: createdProduct.updated_at.toISOString(),
    };

    return NextResponse.json(
      { product: formattedProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/admin/products] Error:', error);

    // Erro de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'JSON inválido no corpo da requisição' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

