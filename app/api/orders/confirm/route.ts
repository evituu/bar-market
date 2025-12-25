import { NextRequest, NextResponse } from 'next/server';

// Store compartilhado de locks (em produção: Redis)
// Nota: Importar de outro arquivo causa problemas em edge runtime
// então mantemos uma referência local que simula o mesmo store
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

// Store de pedidos confirmados (em produção: banco de dados)
const confirmedOrders = new Map<
  string,
  {
    orderId: string;
    productId: string;
    qty: number;
    priceCents: number;
    totalCents: number;
    sessionId: string;
    tableId: string;
    confirmedAt: Date;
  }
>();

// POST /api/orders/confirm - Confirma um pedido com lock válido
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, lockId, sessionId } = body;

    // Validações
    if (!orderId || !lockId) {
      return NextResponse.json(
        { error: 'orderId e lockId são obrigatórios' },
        { status: 400 }
      );
    }

    // Busca o lock
    const lock = priceLocks.get(lockId);

    if (!lock) {
      return NextResponse.json(
        { error: 'Lock não encontrado', code: 'LOCK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Verifica se o orderId corresponde
    if (lock.orderId !== orderId) {
      return NextResponse.json(
        { error: 'orderId não corresponde ao lock', code: 'ORDER_MISMATCH' },
        { status: 400 }
      );
    }

    // Verifica se a sessão corresponde (se fornecida)
    if (sessionId && lock.sessionId !== sessionId) {
      return NextResponse.json(
        { error: 'Sessão inválida', code: 'SESSION_MISMATCH' },
        { status: 403 }
      );
    }

    // Verifica expiração
    const now = new Date();
    if (lock.expiresAt < now) {
      // Marca como expirado
      priceLocks.set(lockId, { ...lock, status: 'expired' });

      return NextResponse.json(
        {
          error: 'Lock expirado. O preço pode ter mudado.',
          code: 'LOCK_EXPIRED',
          expiredAt: lock.expiresAt.toISOString(),
        },
        { status: 410 } // Gone
      );
    }

    // Verifica se já foi confirmado
    if (lock.status === 'confirmed') {
      return NextResponse.json(
        { error: 'Pedido já confirmado', code: 'ALREADY_CONFIRMED' },
        { status: 409 }
      );
    }

    // Confirma o pedido
    const confirmedOrder = {
      orderId: lock.orderId,
      productId: lock.productId,
      qty: lock.qty,
      priceCents: lock.lockedPriceCents,
      totalCents: lock.lockedPriceCents * lock.qty,
      sessionId: lock.sessionId,
      tableId: lock.tableId,
      confirmedAt: now,
    };

    // Atualiza status do lock
    priceLocks.set(lockId, { ...lock, status: 'confirmed' });

    // Salva pedido confirmado
    confirmedOrders.set(orderId, confirmedOrder);

    return NextResponse.json({
      success: true,
      order: {
        orderId: confirmedOrder.orderId,
        productId: confirmedOrder.productId,
        qty: confirmedOrder.qty,
        priceCents: confirmedOrder.priceCents,
        totalCents: confirmedOrder.totalCents,
        tableId: confirmedOrder.tableId,
        confirmedAt: confirmedOrder.confirmedAt.toISOString(),
      },
      message: 'Pedido confirmado com sucesso!',
    });
  } catch (error) {
    console.error('[API] Erro ao confirmar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// GET /api/orders/confirm?orderId=xxx - Consulta pedido confirmado
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json(
      { error: 'orderId é obrigatório' },
      { status: 400 }
    );
  }

  const order = confirmedOrders.get(orderId);

  if (!order) {
    return NextResponse.json(
      { error: 'Pedido não encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}
