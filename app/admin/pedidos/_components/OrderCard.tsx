'use client';

import { Clock, Play, CheckCircle, Truck, X } from 'lucide-react';
import { formatCurrency } from '@/data';

type KdsStatus = 'QUEUED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';

interface Order {
  id: string;
  tableCode: string | null;
  kdsStatus: KdsStatus;
  totalCents: number;
  note: string | null;
  confirmedAt: string | null;
  createdAt: string;
  items: Array<{
    productName: string;
    qty: number;
    lineTotalCents: number;
  }>;
}

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: KdsStatus) => void;
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
const STATUS_COLORS: Record<KdsStatus, { bg: string; border: string; text: string }> = {
  QUEUED: { bg: 'bg-[#F59E0B]/10', border: 'border-[#F59E0B]', text: 'text-[#F59E0B]' },
  IN_PROGRESS: { bg: 'bg-[#2563EB]/10', border: 'border-[#2563EB]', text: 'text-[#2563EB]' },
  READY: { bg: 'bg-[#00E676]/10', border: 'border-[#00E676]', text: 'text-[#00E676]' },
  DELIVERED: { bg: 'bg-[#6B7280]/10', border: 'border-[#6B7280]', text: 'text-[#6B7280]' },
};

// Labels de status
const STATUS_LABELS: Record<KdsStatus, string> = {
  QUEUED: 'Em Fila',
  IN_PROGRESS: 'Em Preparo',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
};

export function OrderCard({ order, onUpdateStatus, isUpdating }: OrderCardProps) {
  const colors = STATUS_COLORS[order.kdsStatus];
  const relativeTime = getRelativeTime(order.confirmedAt || order.createdAt);

  // Ação disponível baseada no status
  const getAction = () => {
    switch (order.kdsStatus) {
      case 'QUEUED':
        return {
          label: 'Iniciar Preparo',
          nextStatus: 'IN_PROGRESS' as KdsStatus,
          icon: Play,
          color: 'bg-[#2563EB] hover:bg-[#1D4ED8]',
        };
      case 'IN_PROGRESS':
        return {
          label: 'Marcar Pronto',
          nextStatus: 'READY' as KdsStatus,
          icon: CheckCircle,
          color: 'bg-[#00E676] hover:bg-[#00C853] text-[#0B0F14]',
        };
      case 'READY':
        return {
          label: 'Entregar',
          nextStatus: 'DELIVERED' as KdsStatus,
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
        ${order.kdsStatus === 'QUEUED' ? 'ring-2 ring-[#F59E0B]/30 animate-pulse-subtle' : ''}
      `}
    >
      {/* Header: Mesa + Tempo */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Mesa em destaque */}
          <span className="text-2xl font-bold font-market text-[#E5E7EB]">
            {order.tableCode || '—'}
          </span>
        </div>

        {/* Tempo */}
        <div className="flex items-center gap-1.5 text-[#9CA3AF]">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{relativeTime}</span>
        </div>
      </div>

      {/* Observação */}
      {order.note && (
        <div className="mb-3 p-2 bg-[#1F2937] rounded-lg">
          <p className="text-xs text-[#9CA3AF] mb-1">Observação:</p>
          <p className="text-sm text-[#E5E7EB]">{order.note}</p>
        </div>
      )}

      {/* Itens do pedido */}
      <div className="space-y-1.5 mb-4">
        {order.items.map((item, idx) => (
          <div
            key={idx}
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
              {STATUS_LABELS[order.kdsStatus]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
