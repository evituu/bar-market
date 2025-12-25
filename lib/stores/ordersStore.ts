// In-memory store para pedidos (substituir por Redis/Postgres em produção)

export type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'CANCELED';
export type PrepArea = 'BAR' | 'KITCHEN';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  priceCents: number;
  lineTotalCents: number;
  category: string;
  prepArea: PrepArea;
}

export interface Order {
  id: string;
  sessionId: string;
  tableId: string | null;
  status: OrderStatus;
  items: OrderItem[];
  totalCents: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
  confirmedAt: string | null;
}

// Categorias que vão para a cozinha (futuro)
const KITCHEN_CATEGORIES = ['Petiscos', 'Porções', 'Lanches'];

export function getPrepArea(category: string): PrepArea {
  return KITCHEN_CATEGORIES.includes(category) ? 'KITCHEN' : 'BAR';
}

// Store em memória
const ordersStore = new Map<string, Order>();

// Gerar ID único
export function generateOrderId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = ordersStore.size + 1;
  return `ORD-${dateStr}-${seq.toString().padStart(4, '0')}`;
}

// Criar pedido
export function createOrder(data: {
  sessionId: string;
  tableId: string | null;
  productId: string;
  productName: string;
  category: string;
  qty: number;
  priceCents: number;
}): Order {
  const orderId = generateOrderId();
  const now = new Date().toISOString();
  
  const item: OrderItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    productId: data.productId,
    productName: data.productName,
    qty: data.qty,
    priceCents: data.priceCents,
    lineTotalCents: data.priceCents * data.qty,
    category: data.category,
    prepArea: getPrepArea(data.category),
  };

  const order: Order = {
    id: orderId,
    sessionId: data.sessionId,
    tableId: data.tableId,
    status: 'NEW',
    items: [item],
    totalCents: item.lineTotalCents,
    createdAt: now,
    updatedAt: now,
    confirmedAt: now,
  };

  ordersStore.set(orderId, order);
  return order;
}

// Listar pedidos com filtros
export function getOrders(filters?: {
  status?: OrderStatus | OrderStatus[];
  prepArea?: PrepArea;
  tableId?: string;
}): Order[] {
  let orders = Array.from(ordersStore.values());

  if (filters?.status) {
    const statusList = Array.isArray(filters.status) ? filters.status : [filters.status];
    orders = orders.filter((o) => statusList.includes(o.status));
  }

  if (filters?.prepArea) {
    orders = orders.filter((o) => 
      o.items.some((item) => item.prepArea === filters.prepArea)
    );
  }

  if (filters?.tableId) {
    orders = orders.filter((o) => 
      o.tableId?.toLowerCase().includes(filters.tableId!.toLowerCase())
    );
  }

  // Ordenar por data de criação (mais recentes primeiro)
  return orders.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Buscar pedido por ID
export function getOrderById(id: string): Order | undefined {
  return ordersStore.get(id);
}

// Atualizar status
export function updateOrderStatus(id: string, status: OrderStatus): Order | null {
  const order = ordersStore.get(id);
  if (!order) return null;

  order.status = status;
  order.updatedAt = new Date().toISOString();
  ordersStore.set(id, order);
  
  return order;
}

// Contagem por status
export function getOrderCounts(): Record<OrderStatus, number> {
  const counts: Record<OrderStatus, number> = {
    NEW: 0,
    IN_PROGRESS: 0,
    READY: 0,
    DELIVERED: 0,
    CANCELED: 0,
  };

  for (const order of ordersStore.values()) {
    counts[order.status]++;
  }

  return counts;
}

// Limpar pedidos antigos (> 24h)
export function cleanOldOrders(): number {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const [id, order] of ordersStore.entries()) {
    if (new Date(order.createdAt).getTime() < oneDayAgo) {
      ordersStore.delete(id);
      removed++;
    }
  }

  return removed;
}

// Para debug/testes: limpar todos os pedidos
export function clearAllOrders(): void {
  ordersStore.clear();
}

// Para debug: listar todos
export function getAllOrders(): Order[] {
  return Array.from(ordersStore.values());
}
