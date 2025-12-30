'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  Pencil,
} from 'lucide-react';
import type { ProductWithPrice } from '@/lib/domain/products';
import { formatCurrency, formatPriceChange } from '@/data';
import { EditProductModal } from './EditProductModal';

interface ProductsTableProps {
  products: ProductWithPrice[];
  categories: string[];
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingProduct, setEditingProduct] = useState<ProductWithPrice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1F2937] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Buscar produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-sm text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F59E0B] transition-colors"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-sm text-[#E5E7EB] focus:outline-none focus:border-[#F59E0B] transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Todas categorias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-sm text-[#E5E7EB] focus:outline-none focus:border-[#F59E0B] transition-colors appearance-none cursor-pointer"
          >
            <option value="all">Todos status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {/* New Product Button */}
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-[#0B0F14] rounded-lg text-sm font-semibold hover:bg-[#D97706] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#1F2937]/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Produto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Base
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Atual
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Floor
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Cap
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Var (Δ)
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Editar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]">
            {filtered.map((product) => {
              const isUp = product.priceChange > 0;
              const isDown = product.priceChange < 0;
              const arrow = isUp ? '↑' : isDown ? '↓' : '=';
              const changeColor = isUp
                ? 'text-[#00E676]'
                : isDown
                  ? 'text-[#FF1744]'
                  : 'text-[#F59E0B]';

              return (
                <tr
                  key={product.id}
                  className="hover:bg-[#1F2937]/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#E5E7EB]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">{product.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1F2937] text-[#E5E7EB]">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-market-medium text-[#9CA3AF]">
                      {formatCurrency(product.basePriceCents)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold font-market-semibold text-[#E5E7EB]">
                      {formatCurrency(product.currentPriceCents)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-market-medium text-[#9CA3AF]">
                      {formatCurrency(product.priceFloorCents)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-market-medium text-[#9CA3AF]">
                      {formatCurrency(product.priceCapCents)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-sm font-market-medium ${changeColor}`}
                    >
                      {arrow} {formatPriceChange(product.priceChange)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-[#00E676]/10 text-[#00E676]'
                          : 'bg-[#FF1744]/10 text-[#FF1744]'
                      }`}
                    >
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setIsModalOpen(true);
                      }}
                      className="p-2 text-[#9CA3AF] hover:text-[#F59E0B] hover:bg-[#1F2937] rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-[#9CA3AF]">
            Nenhum produto encontrado
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1F2937] flex items-center justify-between">
        <p className="text-xs text-[#9CA3AF]">
          {filtered.length} de {products.length} produtos
        </p>
      </div>

      {/* Modal de Edição */}
      <EditProductModal
        isOpen={isModalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          // Recarrega a página para atualizar dados
          window.location.reload();
        }}
      />
    </div>
  );
}
