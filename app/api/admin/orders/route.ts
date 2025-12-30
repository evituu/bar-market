import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type KdsStatus = 'QUEUED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';

// GET /api/admin/orders - Lista pedidos confirmados para a fila
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const statusParam = searchParams.get('status'); // 'CONFIRMED' para filtrar
    const kdsStatusParam = searchParams.get('kdsStatus') as KdsStatus | null;
    const tableCodeParam = searchParams.get('tableCode');

    // Filtro padrão: apenas CONFIRMED
    const where: any = {
      status: statusParam || 'CONFIRMED',
    };

    // Filtro por kds_status (fila operacional)
    if (kdsStatusParam) {
      where.kds_status = kdsStatusParam;
    } else {
      // Por padrão, mostra apenas fila ativa (não entregues)
      where.kds_status = {
        in: ['QUEUED', 'IN_PROGRESS', 'READY'],
      };
    }

    // Filtro por mesa (através de sessions)
    if (tableCodeParam) {
      where.sessions = {
        tables: {
          code: tableCodeParam,
        },
      };
    }

    // Busca pedidos
    const orders = await prisma.orders.findMany({
      where,
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
        sessions: {
          include: {
            tables: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        confirmed_at: 'asc', // Mais antigos primeiro (FIFO)
      },
    });

    // Contagens por kds_status
    let countsMap: Record<KdsStatus, number> = {
      QUEUED: 0,
      IN_PROGRESS: 0,
      READY: 0,
      DELIVERED: 0,
    };

    try {
      const counts = await prisma.orders.groupBy({
        by: ['kds_status'],
        where: {
          status: 'CONFIRMED',
          kds_status: {
            in: ['QUEUED', 'IN_PROGRESS', 'READY', 'DELIVERED'],
          },
        },
        _count: {
          id: true,
        },
      });

      counts.forEach((c) => {
        if (c.kds_status && ['QUEUED', 'IN_PROGRESS', 'READY', 'DELIVERED'].includes(c.kds_status)) {
          countsMap[c.kds_status as KdsStatus] = c._count.id;
        }
      });
    } catch (groupByError: any) {
      // Se groupBy falhar (campo pode não existir), conta manualmente
      console.warn('[API] groupBy falhou, usando contagem manual:', groupByError.message);
      orders.forEach((order) => {
        const status = order.kds_status as KdsStatus | null;
        if (status && ['QUEUED', 'IN_PROGRESS', 'READY', 'DELIVERED'].includes(status)) {
          countsMap[status]++;
        }
      });
    }

    // Formata resposta
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      sessionId: order.session_id,
      tableCode: order.sessions?.tables?.code || null,
      tableId: order.sessions?.tables?.id || null,
      status: order.status,
      kdsStatus: (order.kds_status as KdsStatus) || 'QUEUED',
      totalCents: order.total_cents,
      note: order.note || null,
      confirmedAt: order.confirmed_at?.toISOString() || null,
      createdAt: order.created_at.toISOString(),
      updatedAt: order.updated_at.toISOString(),
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
      counts: countsMap,
      total: formattedOrders.length,
    });
  } catch (error: any) {
    console.error('[API] Erro ao listar pedidos:', error);
    console.error('[API] Detalhes do erro:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: 'Erro ao processar requisição',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
