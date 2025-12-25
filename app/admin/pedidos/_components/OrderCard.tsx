'use client';

import { Clock, ChefHat, Wine, Play, CheckCircle, Truck, X } from 'lucide-react';
import { formatCurrency } from '@/data';
import type { Order, OrderStatus } from '@/lib/stores/ordersStore';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  isUpdating: boolean;
}

// Formata tempo relativo
function getRelativeTime(isoDate: string): string {
  const now = Date.now();
  const created = new Date(isoDate).getTime();
  const diffMs = now - created;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHour < 24) return `há ${diffHour}h`;
  return `há ${Math.floor(diffHour / 24)}d`;
}

// Cores por status
const STATUS_COLORS: Record<OrderStatus, { bg: string; border: string; text: string }> = {
  NEW: { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]' },
  IN_PROGRESS: { bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]', text: 'text-[#2563EB]' },
  READY: { bg: 'bg-[#00E676]/10', border: 'border-[#00E676]', text: 'text-[#00E676]' },
  DELIVERED: { bg: 'bg-[#6B7280]/10', border: 'border-[#6B7280]', text: 'text-[#6B7280]' },
  CANCELED: { bg: 'bg-[#FF1744]/10', border: 'border-[#FF1744]', text: 'text-[#FF1744]' },
};

// Labels de status
const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: 'Novo',
  IN_PROGRESS: 'Em preparo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado',
};

export function OrderCard({ order, onUpdateStatus, isUpdating }: OrderCardProps) {
  const colors = STATUS_COLORS[order.status];
  const relativeTime = getRelativeTime(order.createdAt);
  
  // Determina área de preparo predominante
  const prepAreas = [...new Set(order.items.map((i) => i.prepArea))];
  const isBar = prepAreas.includes('BAR');
  const isKitchen = prepAreas.includes('KITCHEN');

  // Ação disponível baseada no status
  const getAction = () => {
    switch (order.status) {
      case 'NEW':
        return {
          label: 'Iniciar Preparo',
          nextStatus: 'IN_PROGRESS' as OrderStatus,
          icon: Play,
          color: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
        };
      case 'IN_PROGRESS':
        return {
          label: 'Marcar Pronto',
          nextStatus: 'READY' as OrderStatus,
          icon: CheckCircle,
          color: 'bg-[#00E676] hover:bg-[#00C853] text-[#0B0F14]',
        };
      case 'READY':
        return {
          label: 'Entregar',
          nextStatus: 'DELIVERED' as OrderStatus,
          icon: Truck,
          color: 'bg-[#8B5CF6] hover:bg-[#7C3AED]',
        };
      default:
        return null;
    }
  };

  const action = getAction();

  return (
    <div
      className={`
        rounded-xl border-l-4 ${colors.border} ${colors.bg}
        bg-[#111827] p-4 transition-all
        ${order.status === 'NEW' ? 'ring-2 ring-[#F59E0B]/30 animate-pulse-subtle' : ''}
      `}
    >
      {/* Header: Mesa + Tempo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Mesa em destaque */}
          <span className="text-2xl font-bold font-market text-[#E5E7EB]">
            {order.tableId || '—'}
          </span>
          
          {/* Badges de área */}
          <div className="flex gap-1">
            {isBar && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-semibold rounded">
                <Wine className="w-3 h-3" />
                BAR
              </span>
            )}
            {isKitchen && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-semibold rounded">
                <ChefHat className="w-3 h-3" />
                COZINHA
              </span>
            )}
          </div>
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-1.5 text-[#9CA3AF]">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{relativeTime}</span>
        </div>
      </div>

      {/* Itens do pedido */}
      <div className="space-y-1.5 mb-4">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-[#E5E7EB]">
              <span className="font-semibold text-[#F59E0B]">{item.qty}x</span>{' '}
              {item.productName}
            </span>
            <span className="text-[#9CA3AF] font-market text-xs">
              {formatCurrency(item.lineTotalCents)}
            </span>
          </div>
        ))}
      </div>

      {/* Footer: Total + Ações */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
        {/* Total */}
        <div className="text-sm">
          <span className="text-[#9CA3AF]">Total: </span>
          <span className="font-bold font-market text-[#E5E7EB]">
            {formatCurrency(order.totalCents)}
          </span>
        </div>

        {/* Botões de ação */}
        <div className="flex items-center gap-2">
          {/* Botão cancelar (apenas para NEW e IN_PROGRESS) */}
          {(order.status === 'NEW' || order.status === 'IN_PROGRESS') && (
            <button
              onClick={() => onUpdateStatus(order.id, 'CANCELED')}
              disabled={isUpdating}
              className="p-2 text-[#FF1744] hover:bg-[#FF1744]/10 rounded-lg transition-colors disabled:opacity-50"
              title="Cancelar pedido"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Botão de ação principal */}
          {action && (
            <button
              onClick={() => onUpdateStatus(order.id, action.nextStatus)}
              disabled={isUpdating}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white
                transition-all disabled:opacity-50 disabled:cursor-wait
                ${action.color}
              `}
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </button>
          )}

          {/* Status final (sem ação) */}
          {!action && (
            <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${colors.bg} ${colors.text}`}>
              {STATUS_LABELS[order.status]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
