import { AdminLayout, ProductForm } from '../../_components';
import { getAllCategoriesFromDB } from '@/lib/domain/products';

export default async function NewProductPage() {
  // Busca categorias do banco de dados
  const categories = await getAllCategoriesFromDB();

  // Se não houver categorias, usa lista padrão (fallback)
  const defaultCategories = ['Chopes', 'Cervejas', 'Drinks', 'Shots'];
  const availableCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Novo Produto</h1>
        <p className="text-sm text-[#9CA3AF] mt-1">
          Cadastre um novo produto no mercado. O preço inicial será igual ao preço base.
        </p>
      </div>

      {/* Form */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <ProductForm categories={availableCategories} mode="create" />
      </div>
    </AdminLayout>
  );
}

