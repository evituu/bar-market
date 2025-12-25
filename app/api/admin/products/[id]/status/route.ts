import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS, MOCK_PRICE_STATE } from '@/data';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/products/:id/status - Altera status ativo/inativo
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

    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo isActive é obrigatório e deve ser boolean' },
        { status: 400 }
      );
    }

    // Atualiza status (em produção, salvaria no banco)
    const updatedProduct = {
      ...product,
      isActive,
    };

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
