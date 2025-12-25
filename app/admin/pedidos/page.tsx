'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../_components';
import { OrdersFilters, OrdersKanban } from './_components';
import type { Order, OrderStatus, PrepArea } from '@/lib/stores/ordersStore';

const POLLING_INTERVAL = 3000; // 3 segundos

export default function PedidosPage() {
  // Estados
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<OrderStatus, number>>({
    NEW: 0,
    IN_PROGRESS: 0,
    READY: 0,
    DELIVERED: 0,
    CANCELED: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [prepAreaFilter, setPrepAreaFilter] = useState<PrepArea | 'ALL'>('ALL');
  const [showDelivered, setShowDelivered] = useState(false);

  // Fetch pedidos
  const fetchOrders = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);

    try {
      const params = new URLSearchParams();
      if (prepAreaFilter !== 'ALL') {
        params.set('prepArea', prepAreaFilter);
      }
      if (searchQuery.trim()) {
        params.set('tableId', searchQuery.trim());
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!response.ok) throw new Error('Erro ao buscar pedidos');

      const data = await response.json();
      setOrders(data.orders || []);
      setCounts(data.counts || {
        NEW: 0,
        IN_PROGRESS: 0,
        READY: 0,
        DELIVERED: 0,
        CANCELED: 0,
      });
    } catch (error) {
      console.error('[PedidosPage] Erro:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [prepAreaFilter, searchQuery]);

  // Polling automático
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => fetchOrders(), POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Atualizar status
  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('[PedidosPage] Erro ao atualizar:', error);
        // TODO: Toast de erro
        return;
      }

      // Atualiza localmente para resposta imediata
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );

      // Atualiza contagens
      setCounts((prev) => {
        const oldOrder = orders.find((o) => o.id === orderId);
        if (!oldOrder) return prev;

        return {
          ...prev,
          [oldOrder.status]: Math.max(0, prev[oldOrder.status] - 1),
          [newStatus]: prev[newStatus] + 1,
        };
      });
    } catch (error) {
      console.error('[PedidosPage] Fetch error:', error);
    } finally {
      setUpdatingOrderId(null);
    }
  }, [orders]);

  // Filtra pedidos para exibição
  const filteredOrders = orders.filter((order) => {
    // Esconde entregues se toggle desativado
    if (!showDelivered && order.status === 'DELIVERED') return false;
    // Esconde cancelados sempre
    if (order.status === 'CANCELED') return false;
    return true;
  });

  return (
    <AdminLayout>
      {/* Header da página */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#E5E7EB]">Pedidos</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Gerencie os pedidos em tempo real
          </p>
        </div>

        {/* Indicador de status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-[#00E676] rounded-full animate-pulse" />
          <span className="text-[#9CA3AF] font-market">
            Atualização: {POLLING_INTERVAL / 1000}s
          </span>
        </div>
      </div>

      {/* Filtros */}
      <OrdersFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        prepAreaFilter={prepAreaFilter}
        onPrepAreaChange={setPrepAreaFilter}
        showDelivered={showDelivered}
        onToggleDelivered={() => setShowDelivered((prev) => !prev)}
        isRefreshing={isRefreshing}
        onRefresh={() => fetchOrders(true)}
        counts={counts}
      />

      {/* Kanban Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#6B7280]">Carregando pedidos...</p>
          </div>
        </div>
      ) : (
        <OrdersKanban
          orders={filteredOrders}
          onUpdateStatus={handleUpdateStatus}
          updatingOrderId={updatingOrderId}
          showDelivered={showDelivered}
        />
      )}
    </AdminLayout>
  );
}
