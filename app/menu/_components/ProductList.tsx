'use client';

import { useMemo } from 'react';
import { useMarketStream } from '@/lib/context';
import { ProductCard } from './ProductCard';
import type { ProductWithPrice } from '@/data';

interface ProductListProps {
  selectedCategory: string;
  searchQuery: string;
  loadingProductId: string | null;
  onBuy: (product: ProductWithPrice) => void;
}

export function ProductList({
  selectedCategory,
  searchQuery,
  loadingProductId,
  onBuy,
}: ProductListProps) {
  const { snapshot, isConnected } = useMarketStream();

  const filteredProducts = useMemo(() => {
    if (!snapshot?.products) return [];

    let products = snapshot.products;

    // Filtra por categoria
    if (selectedCategory !== 'Todos') {
      products = products.filter((p) => p.category === selectedCategory);
    }

    // Filtra por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter((p) =>
        p.name.toLowerCase().includes(query)
      );
    }

    // Ordena: ativos primeiro, depois por variação absoluta
    return products.sort((a, b) => {
      if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
      return Math.abs(b.priceChange) - Math.abs(a.priceChange);
    });
  }, [snapshot?.products, selectedCategory, searchQuery]);

  // Loading state inicial
  if (!snapshot) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9CA3AF] text-sm">Carregando cardápio...</p>
        </div>
      </div>
    );
  }

  // Nenhum produto encontrado
  if (filteredProducts.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-[#9CA3AF] text-sm">
            {searchQuery
              ? `Nenhum produto encontrado para "${searchQuery}"`
              : 'Nenhum produto disponível nesta categoria'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-4 space-y-3 pb-24">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onBuy={onBuy}
          isLoading={loadingProductId === product.id}
        />
      ))}
    </div>
  );
}
