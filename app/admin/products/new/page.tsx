import { getAllCategories } from '@/data';
import { AdminLayout, ProductForm } from '../../_components';

export default function NewProductPage() {
  const categories = getAllCategories();

  return (
    <AdminLayout>
      <ProductForm categories={categories} isNew />
    </AdminLayout>
  );
}
