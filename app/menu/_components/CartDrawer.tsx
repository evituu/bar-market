'use client';

import { useState } from 'react';
import { X, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/data';
import type { ProductWithPrice } from '@/lib/domain/products';

interface CartItem {
  product: ProductWithPrice;
  qty: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  items: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onCheckout: (note: string) => void;
  isLoading: boolean;
}

export function CartDrawer({
  isOpen,
  items,
  onClose,
  onUpdateQty,
  onRemove,
  onCheckout,
  isLoading,
}: CartDrawerProps) {
  const [note, setNote] = useState('');

  const totalCents = items.reduce(
    (sum, item) => sum + item.product.currentPriceCents * item.qty,
    0
  );

  const totalItems = items.reduce((sum, item) => sum + item.qty, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111827] border-t border-[#1F2937] rounded-t-3xl max-h-[90vh] flex flex-col safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1F2937]">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-lg font-semibold text-[#E5E7EB]">
              Carrinho ({totalItems})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-[#9CA3AF]">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-sm">Carrinho vazio</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product.id}
                className="bg-[#0B0F14] rounded-xl p-4 border border-[#1F2937]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-[#E5E7EB] mb-1">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-[#9CA3AF]">
                      {item.product.ticker}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.product.id)}
                    className="p-1.5 text-[#FF1744] hover:bg-[#FF1744]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onUpdateQty(item.product.id, Math.max(1, item.qty - 1))}
                      className="p-1.5 bg-[#1F2937] hover:bg-[#374151] rounded-lg transition-colors"
                    >
                      <Minus className="w-4 h-4 text-[#E5E7EB]" />
                    </button>
                    <span className="text-base font-semibold text-[#E5E7EB] w-8 text-center">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.product.id, item.qty + 1)}
                      className="p-1.5 bg-[#1F2937] hover:bg-[#374151] rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 text-[#E5E7EB]" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold font-market text-[#E5E7EB]">
                      {formatCurrency(item.product.currentPriceCents * item.qty)}
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      {formatCurrency(item.product.currentPriceCents)} cada
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer com total e checkout */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#1F2937] space-y-3">
            {/* Campo de observação */}
            <div>
              <label className="block text-xs font-medium text-[#9CA3AF] mb-2">
                Observação (opcional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ex: Sem gelo, por favor"
                rows={2}
                className="w-full px-3 py-2 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-sm text-[#E5E7EB] placeholder-[#6B7280] focus:outline-none focus:border-[#F59E0B] resize-none"
              />
            </div>

            {/* Total */}
            <div className="flex items-center justify-between py-3 border-t border-[#1F2937]">
              <span className="text-base font-medium text-[#9CA3AF]">Total:</span>
              <span className="text-2xl font-bold font-market text-[#E5E7EB]">
                {formatCurrency(totalCents)}
              </span>
            </div>

            {/* Botão Finalizar */}
            <button
              onClick={() => onCheckout(note)}
              disabled={isLoading}
              className={`
                w-full py-4 bg-[#F59E0B] text-[#0B0F14] rounded-xl font-semibold text-base
                hover:bg-[#D97706] active:scale-98 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
              `}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0B0F14] border-t-transparent rounded-full animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  <span>Finalizar Pedido</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

