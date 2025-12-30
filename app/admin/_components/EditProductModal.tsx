'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { ProductForm } from './ProductForm';
import type { ProductWithPrice } from '@/lib/domain/products';

interface EditProductModalProps {
  isOpen: boolean;
  product: ProductWithPrice | null;
  categories: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({
  isOpen,
  product,
  categories,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  // Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  // Prepara dados iniciais para o formulário
  const initialData = {
    id: product.id,
    sku: product.sku,
    ticker: product.ticker,
    tickerSource: product.tickerSource,
    name: product.name,
    description: product.description || '',
    category: product.category,
    isActive: product.isActive,
    basePriceCents: product.basePriceCents,
    priceFloorCents: product.priceFloorCents,
    priceCapCents: product.priceCapCents,
  };

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#111827] border border-[#1F2937] rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1F2937] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[#E5E7EB]">Editar Produto</h2>
            <p className="text-sm text-[#9CA3AF] mt-1">
              Atualize as informações do produto
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937] rounded-lg transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <ProductForm
            categories={categories}
            initialData={initialData}
            mode="edit"
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}

