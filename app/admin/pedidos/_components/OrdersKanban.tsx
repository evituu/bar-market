'use client';

import { OrderCard } from './OrderCard';
import { Clock, Play, CheckCircle, Truck } from 'lucide-react';

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

interface OrdersKanbanProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, newStatus: KdsStatus) => void;
  updatingOrderId: string | null;
  showDelivered: boolean;
}

interface ColumnConfig {
  status: KdsStatus;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    status: 'QUEUED',
    title: 'Em Fila',
    icon: Clock,
    color: 'text-[#F59E0B]',
    bgColor: 'bg-[#F59E0B]/10',
  },
  {
    status: 'IN_PROGRESS',
    title: 'Em Preparo',
    icon: Play,
    color: 'text-[#2563EB]',
    bgColor: 'bg-[#2563EB]/10',
  },
  {
    status: 'READY',
    title: 'Prontos',
    icon: CheckCircle,
    color: 'text-[#00E676]',
    bgColor: 'bg-[#00E676]/10',
  },
  {
    status: 'DELIVERED',
    title: 'Entregues',
    icon: Truck,
    color: 'text-[#6B7280]',
    bgColor: 'bg-[#6B7280]/10',
  },
];

export function OrdersKanban({
  orders,
  onUpdateStatus,
  updatingOrderId,
  showDelivered,
}: OrdersKanbanProps) {
  // Filtra colunas (opcionalmente esconde entregues)
  const visibleColumns = showDelivered
    ? COLUMNS
    : COLUMNS.filter((c) => c.status !== 'DELIVERED');

  // Agrupa pedidos por status
  const ordersByStatus = (status: KdsStatus) =>
    orders.filter((o) => o.kdsStatus === status);

  return (
    <div
      className={`
        grid gap-4 min-h-[calc(100vh-280px)]
        ${visibleColumns.length === 4 ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}
      `}
    >
      {visibleColumns.map((column) => {
        const columnOrders = ordersByStatus(column.status);
        const Icon = column.icon;

        return (
          <div
            key={column.status}
            className="flex flex-col bg-[#0B0F14] rounded-xl border border-[#1F2937] overflow-hidden"
          >
            {/* Header da coluna */}
            <div className={`flex items-center justify-between px-4 py-3 ${column.bgColor} border-b border-[#1F2937]`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-5 h-5 ${column.color}`} />
                <h3 className={`font-semibold ${column.color}`}>{column.title}</h3>
              </div>
              <span
                className={`
                  px-2 py-0.5 rounded-full text-sm font-bold font-market
                  ${column.color} ${column.bgColor}
                `}
              >
                {columnOrders.length}
              </span>
            </div>

            {/* Lista de cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-350px)]">
              {columnOrders.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-[#6B7280] text-sm">
                  Nenhum pedido
                </div>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={onUpdateStatus}
                    isUpdating={updatingOrderId === order.id}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
