'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MenuHeader } from './MenuHeader';
import { CategoryTabs } from './CategoryTabs';
import { ProductList } from './ProductList';
import { CartDrawer } from './CartDrawer';
import { BuyModal } from './BuyModal';
import type { ProductWithPrice } from '@/lib/domain/products';

interface CartItem {
  product: ProductWithPrice;
  qty: number;
}

interface LockData {
  orderId: string;
  expiresAt: string;
  ttlSeconds: number;
  locks: Array<{
    lockId: string;
    productId: string;
    productName: string;
    qty: number;
    lockedPriceCents: number;
    lineTotalCents: number;
  }>;
  totalCents: number;
}

export function MenuClient() {
  const searchParams = useSearchParams();
  const tableCode = searchParams.get('table');
  const debug = searchParams.get('debug') === '1';

  // Estados principais
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [tableId, setTableId] = useState<string | null>(null);

  // Carrinho
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Modal de confirmação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lockData, setLockData] = useState<LockData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializa sessão
  useEffect(() => {
    async function ensureSession() {
      try {
        const response = await fetch('/api/sessions/ensure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableCode: tableCode || undefined }),
        });

        if (!response.ok) {
          console.error('[MenuClient] Erro ao garantir sessão');
          return;
        }

        const data = await response.json();
        setSessionId(data.sessionId);
        setTableId(data.tableCode);
      } catch (error) {
        console.error('[MenuClient] Erro ao garantir sessão:', error);
      }
    }

    ensureSession();
  }, [tableCode]);

  // Adiciona produto ao carrinho
  const handleAddToCart = useCallback((product: ProductWithPrice) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  // Atualiza quantidade no carrinho
  const handleUpdateQty = useCallback((productId: string, qty: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, qty } : item
      )
    );
  }, []);

  // Remove do carrinho
  const handleRemove = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  // Finaliza pedido (cria lock)
  const handleCheckout = useCallback(
    async (note: string) => {
      if (!sessionId || cartItems.length === 0) return;

      setIsLoading(true);

      try {
        const response = await fetch('/api/orders/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            tableCode: tableCode || undefined,
            items: cartItems.map((item) => ({
              productId: item.product.id,
              qty: item.qty,
            })),
            note: note.trim() || undefined,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[MenuClient] Lock error:', error);
          // TODO: Mostrar toast de erro
          return;
        }

        const data = await response.json();
        setLockData(data);
        setIsCartOpen(false);
        setIsModalOpen(true);
      } catch (error) {
        console.error('[MenuClient] Lock fetch error:', error);
        // TODO: Mostrar toast de erro
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, tableCode, cartItems]
  );

  // Confirma pedido
  const handleConfirm = useCallback(async () => {
    if (!lockData || !sessionId) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: lockData.orderId,
          sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[MenuClient] Confirm error:', error);
        // TODO: Mostrar toast de erro
        return;
      }

      // Limpa carrinho e fecha modal
      setCartItems([]);
      setIsModalOpen(false);
      setLockData(null);
      // TODO: Mostrar toast de sucesso
      // TODO: Redirecionar para "Meus pedidos" ou mostrar resumo
    } catch (error) {
      console.error('[MenuClient] Confirm fetch error:', error);
      // TODO: Mostrar toast de erro
    } finally {
      setIsLoading(false);
    }
  }, [lockData, sessionId]);

  // Fecha modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setLockData(null);
  }, []);

  const cartTotalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E5E7EB] flex flex-col">
      {/* Header fixo */}
      <MenuHeader
        tableId={tableId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showDebug={debug}
        cartCount={cartTotalItems}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Tabs de categoria */}
      <CategoryTabs
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {/* Lista de produtos */}
      <ProductList
        selectedCategory={selectedCategory}
        searchQuery={searchQuery}
        onAddToCart={handleAddToCart}
      />

      {/* Carrinho (Drawer) */}
      <CartDrawer
        isOpen={isCartOpen}
        items={cartItems}
        onClose={() => setIsCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemove}
        onCheckout={handleCheckout}
        isLoading={isLoading}
      />

      {/* Modal de confirmação */}
      <BuyModal
        isOpen={isModalOpen}
        lockData={lockData}
        sessionId={sessionId}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        isLoading={isLoading}
      />
    </div>
  );
}
