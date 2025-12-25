import { NextRequest, NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/data';

// Simula categorias persistidas (em produção, viria do banco)
let mockCategories = [
  { id: 'cat-1', name: 'Chopes', order: 1, isActive: true },
  { id: 'cat-2', name: 'Cervejas', order: 2, isActive: true },
  { id: 'cat-3', name: 'Drinks', order: 3, isActive: true },
  { id: 'cat-4', name: 'Shots', order: 4, isActive: true },
];

// GET /api/admin/categories - Lista todas as categorias
export async function GET() {
  // Enriquece com contagem de produtos
  const categoriesWithCount = mockCategories.map((category) => ({
    ...category,
    productCount: MOCK_PRODUCTS.filter((p) => p.category === category.name)
      .length,
  }));

  return NextResponse.json({
    categories: categoriesWithCount,
    total: categoriesWithCount.length,
  });
}

// POST /api/admin/categories - Cria nova categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica duplicidade
    if (
      mockCategories.some(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: 'Categoria já existe' },
        { status: 400 }
      );
    }

    const newCategory = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      order: mockCategories.length + 1,
      isActive: true,
    };

    mockCategories.push(newCategory);

    return NextResponse.json(
      { category: { ...newCategory, productCount: 0 } },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
