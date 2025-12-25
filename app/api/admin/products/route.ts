import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS, MOCK_PRICE_STATE } from '@/data';

// GET /api/admin/products - Lista todos os produtos com filtros
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const categoryId = searchParams.get('categoryId');
  const active = searchParams.get('active');
  const search = searchParams.get('search');

  let products = [...MOCK_PRODUCTS];

  // Filtro por categoria
  if (categoryId) {
    products = products.filter((p) => p.category === categoryId);
  }

  // Filtro por status
  if (active !== null) {
    const isActive = active === 'true';
    products = products.filter((p) => p.isActive === isActive);
  }

  // Filtro por busca
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
    );
  }

  // Enriquece com preço atual
  const productsWithPrice = products.map((product) => {
    const priceState = MOCK_PRICE_STATE.find(
      (ps) => ps.productId === product.id
    );
    return {
      ...product,
      currentPriceCents: priceState?.priceCents ?? product.basePriceCents,
      prevPriceCents: priceState?.prevPriceCents ?? product.basePriceCents,
      tickSeq: priceState?.tickSeq ?? 0,
    };
  });

  return NextResponse.json({
    products: productsWithPrice,
    total: productsWithPrice.length,
  });
}

// POST /api/admin/products - Cria novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      sku,
      description,
      category,
      basePriceCents,
      priceFloorCents,
      priceCapCents,
      isActive,
    } = body;

    // Validações
    if (!name || !sku || !category) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, sku, category' },
        { status: 400 }
      );
    }

    if (priceFloorCents > basePriceCents) {
      return NextResponse.json(
        { error: 'Floor deve ser menor ou igual ao preço base' },
        { status: 400 }
      );
    }

    if (basePriceCents > priceCapCents) {
      return NextResponse.json(
        { error: 'Cap deve ser maior ou igual ao preço base' },
        { status: 400 }
      );
    }

    if (priceFloorCents >= priceCapCents) {
      return NextResponse.json(
        { error: 'Floor deve ser menor que Cap' },
        { status: 400 }
      );
    }

    // Cria novo produto (em produção, salvaria no banco)
    const newProduct = {
      id: `prod-${Date.now()}`,
      sku,
      name,
      description: description || '',
      category,
      isActive: isActive ?? true,
      basePriceCents,
      priceFloorCents,
      priceCapCents,
    };

    // Em produção: também criar price_state inicial
    // const initialPriceState = {
    //   productId: newProduct.id,
    //   priceCents: basePriceCents,
    //   prevPriceCents: basePriceCents,
    //   tickSeq: currentTickSeq,
    //   updatedAt: new Date(),
    // };

    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
