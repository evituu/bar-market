import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders?sessionId=... - Lista pedidos da sessão (Meus pedidos)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId é obrigatório' },
        { status: 400 }
      );
    }

    // Busca pedidos confirmados da sessão
    const orders = await prisma.orders.findMany({
      where: {
        session_id: sessionId,
        status: 'CONFIRMED', // Apenas confirmados
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
                ticker: true,
              },
            },
          },
        },
        tables: {
          select: {
            code: true,
          },
        },
      },
      orderBy: {
        confirmed_at: 'desc',
      },
    });

    // Formata resposta
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      tableCode: order.tables?.code || null,
      status: order.status,
      kdsStatus: order.kds_status || 'QUEUED',
      totalCents: order.total_cents,
      note: order.note || null,
      confirmedAt: order.confirmed_at?.toISOString() || null,
      createdAt: order.created_at.toISOString(),
      items: order.order_items.map((item) => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products.name,
        productTicker: item.products.ticker,
        qty: item.qty,
        lockedPriceCents: item.locked_price_cents,
        lineTotalCents: item.line_total_cents,
      })),
    }));

    return NextResponse.json({
      orders: formattedOrders,
      total: formattedOrders.length,
    });
  } catch (error: any) {
    console.error('[API] Erro ao listar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

