import { notFound } from 'next/navigation';
import { getAllCategories, getProductById } from '@/data';
import { AdminLayout, ProductForm } from '../../_components';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const product = getProductById(id);
  const categories = getAllCategories();

  if (!product) {
    notFound();
  }

  return (
    <AdminLayout>
      <ProductForm product={product} categories={categories} />
    </AdminLayout>
  );
}
