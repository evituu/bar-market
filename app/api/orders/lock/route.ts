import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProductsWithPricesFromDB } from '@/lib/domain/products';

// TTL do lock em segundos
const LOCK_TTL_SECONDS = 30;

// POST /api/orders/lock - Cria locks de preço para múltiplos itens
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, tableCode, items, note } = body;

    // Validações
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId é obrigatório' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items deve ser um array não vazio' },
        { status: 400 }
      );
    }

    // Valida cada item
    for (const item of items) {
      if (!item.productId || !item.qty || item.qty < 1) {
        return NextResponse.json(
          { error: 'Cada item deve ter productId e qty >= 1' },
          { status: 400 }
        );
      }
    }

    // Busca produtos e preços atuais
    const products = await getProductsWithPricesFromDB();
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Valida que todos os produtos existem e estão ativos
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produto ${item.productId} não encontrado` },
          { status: 404 }
        );
      }
      if (!product.isActive) {
        return NextResponse.json(
          { error: `Produto ${product.name} está inativo` },
          { status: 400 }
        );
      }
    }

    // Busca mesa se tableCode fornecido
    let tableId: string | null = null;
    if (tableCode) {
      const table = await prisma.tables.findUnique({
        where: { code: tableCode },
      });
      if (table) {
        tableId = table.id;
      }
    }

    // Cria pedido e locks em transação
    const result = await prisma.$transaction(async (tx) => {
      // Cria pedido PENDING
      const order = await tx.orders.create({
        data: {
          session_id: sessionId,
          status: 'PENDING',
          total_cents: 0, // Será calculado na confirmação
          ...(note && { note: note.trim() }),
        },
      });

      // Calcula expiração
      const expiresAt = new Date(Date.now() + LOCK_TTL_SECONDS * 1000);

      // Cria locks para cada item
      const locks = [];
      for (const item of items) {
        const product = productMap.get(item.productId)!;
        const lockedPriceCents = product.currentPriceCents;

        const lock = await tx.price_locks.create({
          data: {
            order_id: order.id,
            product_id: item.productId,
            qty: item.qty,
            locked_price_cents: lockedPriceCents,
            expires_at: expiresAt,
            status: 'ACTIVE',
          },
        });

        locks.push({
          lockId: lock.id,
          productId: item.productId,
          productName: product.name,
          qty: item.qty,
          lockedPriceCents,
          lineTotalCents: lockedPriceCents * item.qty,
        });
      }

      return {
        orderId: order.id,
        expiresAt,
        locks,
      };
    });

    // Calcula total
    const totalCents = result.locks.reduce(
      (sum, lock) => sum + lock.lineTotalCents,
      0
    );

    return NextResponse.json({
      orderId: result.orderId,
      expiresAt: result.expiresAt.toISOString(),
      ttlSeconds: LOCK_TTL_SECONDS,
      locks: result.locks,
      totalCents,
    });
  } catch (error: any) {
    console.error('[API] Erro ao criar locks:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
