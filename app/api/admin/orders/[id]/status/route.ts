import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type KdsStatus = 'QUEUED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED';

const VALID_KDS_STATUSES: KdsStatus[] = ['QUEUED', 'IN_PROGRESS', 'READY', 'DELIVERED'];

// PATCH /api/admin/orders/:id/status - Atualiza kds_status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { kdsStatus } = body;

    // Validações
    if (!kdsStatus) {
      return NextResponse.json(
        { error: 'kdsStatus é obrigatório' },
        { status: 400 }
      );
    }

    if (!VALID_KDS_STATUSES.includes(kdsStatus)) {
      return NextResponse.json(
        {
          error: `kdsStatus inválido. Valores permitidos: ${VALID_KDS_STATUSES.join(', ')}`,
          validStatuses: VALID_KDS_STATUSES,
        },
        { status: 400 }
      );
    }

    // Verifica se pedido existe e está CONFIRMED
    const existingOrder = await prisma.orders.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    if (existingOrder.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Apenas pedidos confirmados podem ter kds_status atualizado' },
        { status: 400 }
      );
    }

    // Valida transição de status (opcional, mas recomendado)
    const validTransitions: Record<KdsStatus, KdsStatus[]> = {
      QUEUED: ['IN_PROGRESS', 'DELIVERED'], // Pode pular para entregue se necessário
      IN_PROGRESS: ['READY', 'DELIVERED'],
      READY: ['DELIVERED', 'IN_PROGRESS'], // Pode voltar se necessário
      DELIVERED: [], // Estado final
    };

    const currentStatus = (existingOrder.kds_status || 'QUEUED') as KdsStatus;
    if (!validTransitions[currentStatus].includes(kdsStatus)) {
      return NextResponse.json(
        {
          error: `Transição inválida: ${currentStatus} → ${kdsStatus}`,
          currentStatus,
          allowedTransitions: validTransitions[currentStatus],
        },
        { status: 400 }
      );
    }

    // Atualiza kds_status
    const updatedOrder = await prisma.orders.update({
      where: { id },
      data: {
        kds_status: kdsStatus,
        updated_at: new Date(),
      },
      include: {
        order_items: {
          include: {
            products: {
              select: {
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
    });

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        kdsStatus: updatedOrder.kds_status,
        tableCode: updatedOrder.tables?.code || null,
        totalCents: updatedOrder.total_cents,
        items: updatedOrder.order_items.map((item) => ({
          productName: item.products.name,
          qty: item.qty,
        })),
      },
      message: `Status atualizado para ${kdsStatus}`,
    });
  } catch (error: any) {
    console.error('[API] Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// GET /api/admin/orders/:id/status - Consulta pedido específico
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        order_items: {
          include: {
            products: {
              select: {
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
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        kdsStatus: order.kds_status || 'QUEUED',
        tableCode: order.tables?.code || null,
        totalCents: order.total_cents,
        note: order.note || null,
        confirmedAt: order.confirmed_at?.toISOString() || null,
        items: order.order_items.map((item) => ({
          productName: item.products.name,
          qty: item.qty,
          lineTotalCents: item.line_total_cents,
        })),
      },
    });
  } catch (error: any) {
    console.error('[API] Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
