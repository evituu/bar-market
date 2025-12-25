import { NextRequest, NextResponse } from 'next/server';
import { getPriceStateByProductId, getProductById } from '@/data';

// Store em memória para locks (em produção: Redis)
const priceLocks = new Map<
  string,
  {
    orderId: string;
    lockId: string;
    productId: string;
    qty: number;
    lockedPriceCents: number;
    sessionId: string;
    tableId: string;
    expiresAt: Date;
    status: 'pending' | 'confirmed' | 'expired';
  }
>();

// TTL do lock em segundos
const LOCK_TTL_SECONDS = 15;

// Limpa locks expirados periodicamente
function cleanExpiredLocks() {
  const now = new Date();
  for (const [lockId, lock] of priceLocks.entries()) {
    if (lock.expiresAt < now && lock.status === 'pending') {
      priceLocks.set(lockId, { ...lock, status: 'expired' });
    }
  }
}

// POST /api/orders/lock - Cria um price lock
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, qty = 1, sessionId, tableId } = body;

    // Validações
    if (!productId) {
      return NextResponse.json(
        { error: 'productId é obrigatório' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se produto existe
    const product = getProductById(productId);
    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Obtém preço atual
    const priceState = getPriceStateByProductId(productId);
    const currentPriceCents = priceState?.priceCents ?? product.basePriceCents;

    // Limpa locks expirados
    cleanExpiredLocks();

    // Gera IDs únicos
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const lockId = `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calcula expiração
    const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000);

    // Cria o lock
    const lock = {
      orderId,
      lockId,
      productId,
      qty,
      lockedPriceCents: currentPriceCents,
      sessionId,
      tableId: tableId || 'unknown',
      expiresAt,
      status: 'pending' as const,
    };

    priceLocks.set(lockId, lock);

    return NextResponse.json({
      orderId,
      lockId,
      productId,
      productName: product.name,
      qty,
      lockedPriceCents: currentPriceCents,
      totalCents: currentPriceCents * qty,
      expiresAt: expiresAt.toISOString(),
      ttlSeconds: LOCK_TTL_SECONDS,
    });
  } catch (error) {
    console.error('[API] Erro ao criar lock:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// GET /api/orders/lock?lockId=xxx - Consulta status do lock
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const lockId = searchParams.get('lockId');

  if (!lockId) {
    return NextResponse.json(
      { error: 'lockId é obrigatório' },
      { status: 400 }
    );
  }

  cleanExpiredLocks();

  const lock = priceLocks.get(lockId);
  if (!lock) {
    return NextResponse.json(
      { error: 'Lock não encontrado' },
      { status: 404 }
    );
  }

  const now = new Date();
  const isExpired = lock.expiresAt < now;
  const remainingSeconds = Math.max(
    0,
    Math.floor((lock.expiresAt.getTime() - now.getTime()) / 1000)
  );

  return NextResponse.json({
    lockId: lock.lockId,
    orderId: lock.orderId,
    productId: lock.productId,
    qty: lock.qty,
    lockedPriceCents: lock.lockedPriceCents,
    totalCents: lock.lockedPriceCents * lock.qty,
    expiresAt: lock.expiresAt.toISOString(),
    remainingSeconds,
    status: isExpired ? 'expired' : lock.status,
  });
}

// Exporta o map de locks para uso no confirm
export { priceLocks };
