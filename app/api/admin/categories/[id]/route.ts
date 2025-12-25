import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/data';

// Referência às categorias (em produção, viria do banco)
// Simula estado compartilhado
let mockCategories = [
  { id: 'cat-1', name: 'Chopes', order: 1, isActive: true },
  { id: 'cat-2', name: 'Cervejas', order: 2, isActive: true },
  { id: 'cat-3', name: 'Drinks', order: 3, isActive: true },
  { id: 'cat-4', name: 'Shots', order: 4, isActive: true },
];

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/categories/:id - Detalhe da categoria
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const category = mockCategories.find((c) => c.id === id);

  if (!category) {
    return NextResponse.json(
      { error: 'Categoria não encontrada' },
      { status: 404 }
    );
  }

  const productCount = MOCK_PRODUCTS.filter(
    (p) => p.category === category.name
  ).length;

  return NextResponse.json({
    category: { ...category, productCount },
  });
}

// PATCH /api/admin/categories/:id - Edita categoria
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const categoryIndex = mockCategories.findIndex((c) => c.id === id);

    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    const { name, order, isActive } = body;

    // Verifica duplicidade de nome
    if (name) {
      const duplicate = mockCategories.find(
        (c) =>
          c.id !== id && c.name.toLowerCase() === name.trim().toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          { error: 'Categoria com esse nome já existe' },
          { status: 400 }
        );
      }
    }

    const category = mockCategories[categoryIndex];
    const updatedCategory = {
      ...category,
      name: name?.trim() ?? category.name,
      order: order ?? category.order,
      isActive: isActive ?? category.isActive,
    };

    mockCategories[categoryIndex] = updatedCategory;

    const productCount = MOCK_PRODUCTS.filter(
      (p) => p.category === updatedCategory.name
    ).length;

    return NextResponse.json({
      category: { ...updatedCategory, productCount },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/:id - Remove categoria
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  const category = mockCategories.find((c) => c.id === id);

  if (!category) {
    return NextResponse.json(
      { error: 'Categoria não encontrada' },
      { status: 404 }
    );
  }

  // Verifica se tem produtos vinculados
  const productCount = MOCK_PRODUCTS.filter(
    (p) => p.category === category.name
  ).length;

  if (productCount > 0) {
    return NextResponse.json(
      {
        error: `Não é possível excluir. Categoria possui ${productCount} produto(s) vinculado(s).`,
      },
      { status: 400 }
    );
  }

  mockCategories = mockCategories.filter((c) => c.id !== id);

  return NextResponse.json({ success: true });
}
