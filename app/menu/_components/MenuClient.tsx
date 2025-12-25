'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MenuHeader } from './MenuHeader';
import { CategoryTabs } from './CategoryTabs';
import { ProductList } from './ProductList';
import { BuyModal } from './BuyModal';
import type { ProductWithPrice } from '@/data';

interface LockData {
  orderId: string;
  lockId: string;
  productId: string;
  productName: string;
  qty: number;
  lockedPriceCents: number;
  totalCents: number;
  expiresAt: string;
  ttlSeconds: number;
}

// Gera ou recupera sessionId
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  const STORAGE_KEY = 'bar-market-session-id';
  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }
  
  return sessionId;
}

export function MenuClient() {
  const searchParams = useSearchParams();
  const tableId = searchParams.get('table');
  
  // Estados principais
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);
  
  // Modal de compra
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lockData, setLockData] = useState<LockData | null>(null);
  
  // Session ID
  const [sessionId, setSessionId] = useState('');
  
  useEffect(() => {
    setSessionId(getSessionId());
  }, []);

  // Handler de compra - cria lock
  const handleBuy = useCallback(async (product: ProductWithPrice) => {
    if (!sessionId) return;
    
    setLoadingProductId(product.id);
    
    try {
      const response = await fetch('/api/orders/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          qty: 1,
          currentPriceCents: product.currentPriceCents,
          sessionId,
          tableId: tableId || undefined,
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
      setIsModalOpen(true);
    } catch (error) {
      console.error('[MenuClient] Lock fetch error:', error);
      // TODO: Mostrar toast de erro de conexão
    } finally {
      setLoadingProductId(null);
    }
  }, [sessionId, tableId]);

  // Fecha modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setLockData(null);
  }, []);

  // Sucesso na confirmação
  const handleConfirmSuccess = useCallback(() => {
    setIsModalOpen(false);
    setLockData(null);
    // TODO: Mostrar toast de sucesso
    // TODO: Redirecionar para página de pedidos ou mostrar resumo
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E5E7EB] flex flex-col">
      {/* Header fixo */}
      <MenuHeader
        tableId={tableId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
        loadingProductId={loadingProductId}
        onBuy={handleBuy}
      />

      {/* Modal de compra */}
      <BuyModal
        isOpen={isModalOpen}
        lockData={lockData}
        sessionId={sessionId}
        onClose={handleCloseModal}
        onConfirmSuccess={handleConfirmSuccess}
      />
    </div>
  );
}
