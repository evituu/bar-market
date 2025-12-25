'use client';

import { Package, Tags, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import {
  getProductsWithPrices,
  getAllCategories,
  MOCK_PRODUCTS,
} from '@/data';
import {
  AdminLayout,
  StatCard,
  RankingPanel,
  MarketTable,
} from './_components';

export default function AdminDashboard() {
  const products = getProductsWithPrices();
  const categories = getAllCategories();
  const tickSeq = products[0]?.tickSeq ?? 0;

  // Estatísticas
  const activeProducts = MOCK_PRODUCTS.filter((p) => p.isActive).length;
  const totalProducts = MOCK_PRODUCTS.length;

  // Contagem de altas e baixas
  const gainers = products.filter((p) => p.priceChange > 0);
  const losers = products.filter((p) => p.priceChange < 0);
  const stable = products.filter((p) => p.priceChange === 0);

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Dashboard</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Visão geral do mercado e estatísticas em tempo real
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Produtos Ativos"
          value={activeProducts}
          subtitle={`de ${totalProducts} total`}
          icon={Package}
          color="#2563EB"
        />
        <StatCard
          title="Categorias"
          value={categories.length}
          icon={Tags}
          color="#8B5CF6"
        />
        <StatCard
          title="Em Alta"
          value={gainers.length}
          subtitle={`${losers.length} em queda, ${stable.length} estáveis`}
          icon={TrendingUp}
          color="#00E676"
        />
        <StatCard
          title="Tick Atual"
          value={`#${tickSeq}`}
          subtitle="Sequência do mercado"
          icon={Activity}
          color="#F59E0B"
        />
      </div>

      {/* Ranking Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RankingPanel
          title="Top Valorizados"
          products={products}
          type="gainers"
          maxItems={5}
        />
        <RankingPanel
          title="Top Depreciados"
          products={products}
          type="losers"
          maxItems={5}
        />
      </div>

      {/* Market Table */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#E5E7EB] mb-4">
          Visão Geral do Mercado
        </h2>
        <MarketTable products={products} categories={categories} />
      </div>
    </AdminLayout>
  );
}
