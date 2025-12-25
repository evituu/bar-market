import { getAllCategories, MOCK_PRODUCTS } from '@/data';
import { AdminLayout, CategoriesTable } from '../_components';

export default function CategoriesPage() {
  const categoryNames = getAllCategories();

  // Monta dados de categorias com contagem de produtos
  const categories = categoryNames.map((name, index) => ({
    id: `cat-${index + 1}`,
    name,
    order: index + 1,
    isActive: true,
    productCount: MOCK_PRODUCTS.filter((p) => p.category === name).length,
  }));

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Categorias</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Gerencie as categorias de produtos do mercado
        </p>
      </div>

      {/* Categories Table */}
      <CategoriesTable categories={categories} />
    </AdminLayout>
  );
}
