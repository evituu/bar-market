import { AdminLayout, ProductsTable } from '../_components';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ProductsPage() {
  // Busca produtos do banco
  const products = await prisma.products.findMany({
    include: {
      price_states: true,
    },
    orderBy: [
      { is_active: 'desc' },
      { category: 'asc' },
      { name: 'asc' },
    ],
  });

  // Busca categorias únicas
  const categoriesResult = await prisma.products.findMany({
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  const categories = categoriesResult.map((c) => c.category);

  // Formata produtos para o formato esperado pelo ProductsTable
  const formattedProducts = products.map((product) => {
    const priceState = product.price_states;
    const currentPriceCents = priceState?.price_cents ?? product.base_price_cents;
    const prevPriceCents = priceState?.prev_price_cents ?? product.base_price_cents;
    
    // Calcula variação percentual
    const priceChange =
      prevPriceCents > 0
        ? (currentPriceCents - prevPriceCents) / prevPriceCents
        : 0;

    return {
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
      priceChange,
      tickSeq: priceState ? Number(priceState.tick_seq) : 0,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at),
    };
  });

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E5E7EB]">Produtos</h1>
          <p className="text-sm text-[#9CA3AF] mt-1">
            Gerencie o catálogo de produtos do mercado
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </Link>
      </div>

      {/* Products Table */}
      <ProductsTable products={formattedProducts} categories={categories} />
    </AdminLayout>
  );
}

