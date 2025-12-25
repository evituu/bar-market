import { getProductsWithPrices, getAllCategories, MOCK_PRODUCTS } from '@/data';
import { AdminLayout, ProductsTable } from '../_components';

export default function ProductsPage() {
  const products = getProductsWithPrices();
  const categories = getAllCategories();

  // Inclui também produtos inativos para gestão
  const allProductsWithPrices = MOCK_PRODUCTS.map((product) => {
    const activeProduct = products.find((p) => p.id === product.id);
    if (activeProduct) return activeProduct;

    return {
      ...product,
      currentPriceCents: product.basePriceCents,
      prevPriceCents: product.basePriceCents,
      priceChange: 0,
      tickSeq: 0,
    };
  });

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Produtos</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Gerencie o catálogo de produtos do mercado
        </p>
      </div>

      {/* Products Table */}
      <ProductsTable products={allProductsWithPrices} categories={categories} />
    </AdminLayout>
  );
}
