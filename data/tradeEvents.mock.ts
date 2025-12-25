export interface TradeEvent {
  id: number;
  productId: string;
  orderId: string | null;
  qty: number;
  priceCents: number;
  createdAt: Date;
}

export const MOCK_TRADE_EVENTS: TradeEvent[] = [
  {
    id: 1,
    productId: 'prod-1',
    orderId: 'order-1',
    qty: 2,
    priceCents: 1800,
    createdAt: new Date(Date.now() - 180000),
  },
  {
    id: 2,
    productId: 'prod-3',
    orderId: 'order-2',
    qty: 1,
    priceCents: 3200,
    createdAt: new Date(Date.now() - 120000),
  },
  {
    id: 3,
    productId: 'prod-1',
    orderId: 'order-3',
    qty: 3,
    priceCents: 1850,
    createdAt: new Date(Date.now() - 90000),
  },
  {
    id: 4,
    productId: 'prod-5',
    orderId: 'order-4',
    qty: 4,
    priceCents: 1900,
    createdAt: new Date(Date.now() - 60000),
  },
  {
    id: 5,
    productId: 'prod-2',
    orderId: 'order-5',
    qty: 1,
    priceCents: 2650,
    createdAt: new Date(Date.now() - 30000),
  },
];

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED';
export type SessionStatus = 'ACTIVE' | 'CLOSED';
export type LockStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELED';

export interface Table {
  id: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Session {
  id: string;
  tableId: string | null;
  status: SessionStatus;
  openedAt: Date;
  closedAt: Date | null;
}

export interface Order {
  id: string;
  sessionId: string | null;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  createdAt: Date;
  confirmedAt: Date | null;
  canceledAt: Date | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  lockedPriceCents: number;
  lineTotalCents: number;
  createdAt: Date;
}

export interface PriceLock {
  id: string;
  orderId: string;
  productId: string;
  qty: number;
  lockedPriceCents: number;
  expiresAt: Date;
  status: LockStatus;
  createdAt: Date;
  usedAt: Date | null;
}

export const MOCK_TABLES: Table[] = [
  { id: 'table-1', code: 'M01', isActive: true, createdAt: new Date() },
  { id: 'table-2', code: 'M02', isActive: true, createdAt: new Date() },
  { id: 'table-3', code: 'M03', isActive: true, createdAt: new Date() },
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'session-1',
    tableId: 'table-1',
    status: 'ACTIVE',
    openedAt: new Date(Date.now() - 3600000),
    closedAt: null,
  },
  {
    id: 'session-2',
    tableId: 'table-2',
    status: 'ACTIVE',
    openedAt: new Date(Date.now() - 1800000),
    closedAt: null,
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-1',
    sessionId: 'session-1',
    status: 'CONFIRMED',
    totalCents: 3600,
    currency: 'BRL',
    createdAt: new Date(Date.now() - 180000),
    confirmedAt: new Date(Date.now() - 175000),
    canceledAt: null,
  },
  {
    id: 'order-2',
    sessionId: 'session-1',
    status: 'PENDING',
    totalCents: 3200,
    currency: 'BRL',
    createdAt: new Date(Date.now() - 30000),
    confirmedAt: null,
    canceledAt: null,
  },
];

export const MOCK_ORDER_ITEMS: OrderItem[] = [
  {
    id: 'item-1',
    orderId: 'order-1',
    productId: 'prod-1',
    qty: 2,
    lockedPriceCents: 1800,
    lineTotalCents: 3600,
    createdAt: new Date(Date.now() - 180000),
  },
];

export const MOCK_PRICE_LOCKS: PriceLock[] = [
  {
    id: 'lock-1',
    orderId: 'order-2',
    productId: 'prod-3',
    qty: 1,
    lockedPriceCents: 3200,
    expiresAt: new Date(Date.now() + 270000), // 4.5min no futuro
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 30000),
    usedAt: null,
  },
];