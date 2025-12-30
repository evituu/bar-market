import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/orders/confirm - Confirma pedido e cria order_items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, sessionId } = body;

    // Validações
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId é obrigatório' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId é obrigatório' },
        { status: 400 }
      );
    }

    // Confirma pedido em transação
    const result = await prisma.$transaction(async (tx) => {
      // Busca pedido
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: {
          price_locks: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Valida sessão
      if (order.session_id !== sessionId) {
        throw new Error('Sessão inválida');
      }

      // Valida status
      if (order.status !== 'PENDING') {
        throw new Error(`Pedido já está ${order.status}`);
      }

      // Valida locks ativos e não expirados
      const now = new Date();
      const validLocks = order.price_locks.filter(
        (lock) => lock.expires_at > now
      );

      if (validLocks.length === 0) {
        throw new Error('Nenhum lock válido encontrado');
      }

      // Marca locks expirados como EXPIRED
      const expiredLockIds = order.price_locks
        .filter((lock) => lock.expires_at <= now)
        .map((lock) => lock.id);

      if (expiredLockIds.length > 0) {
        await tx.price_locks.updateMany({
          where: {
            id: { in: expiredLockIds },
            status: 'ACTIVE',
          },
          data: {
            status: 'EXPIRED',
          },
        });
      }

      // Cria order_items a partir dos locks válidos
      let totalCents = 0;
      const orderItems = [];

      for (const lock of validLocks) {
        const lineTotalCents = lock.locked_price_cents * lock.qty;
        totalCents += lineTotalCents;

        const orderItem = await tx.order_items.create({
          data: {
            order_id: order.id,
            product_id: lock.product_id,
            qty: lock.qty,
            locked_price_cents: lock.locked_price_cents,
            line_total_cents: lineTotalCents,
          },
        });

        orderItems.push(orderItem);

        // Marca lock como USED
        await tx.price_locks.update({
          where: { id: lock.id },
          data: {
            status: 'USED',
            used_at: now,
          },
        });

        // Cria trade_event para o motor de preço reagir
        await tx.trade_events.create({
          data: {
            product_id: lock.product_id,
            order_id: order.id,
            qty: lock.qty,
            price_cents: lock.locked_price_cents,
          },
        });
      }

      // Atualiza pedido: CONFIRMED, total, confirmed_at, kds_status=QUEUED
      const updatedOrder = await tx.orders.update({
        where: { id: order.id },
        data: {
          status: 'CONFIRMED',
          total_cents: totalCents,
          confirmed_at: now,
          kds_status: 'QUEUED', // Entra na fila
        },
      });

      return {
        order: updatedOrder,
        items: orderItems,
        totalCents,
      };
    });

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      totalCents: result.totalCents,
      items: result.items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        qty: item.qty,
        lockedPriceCents: item.locked_price_cents,
        lineTotalCents: item.line_total_cents,
      })),
    });
  } catch (error: any) {
    console.error('[API] Erro ao confirmar pedido:', error);

    // Erros específicos
    if (error.message === 'Pedido não encontrado') {
      return NextResponse.json(
        { error: error.message, code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (error.message === 'Sessão inválida') {
      return NextResponse.json(
        { error: error.message, code: 'SESSION_MISMATCH' },
        { status: 403 }
      );
    }

    if (error.message.includes('já está')) {
      return NextResponse.json(
        { error: error.message, code: 'ORDER_ALREADY_CONFIRMED' },
        { status: 409 }
      );
    }

    if (error.message.includes('lock')) {
      return NextResponse.json(
        { error: error.message, code: 'LOCK_EXPIRED' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
