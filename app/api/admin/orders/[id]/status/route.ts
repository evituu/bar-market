import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, type OrderStatus } from '@/lib/stores/ordersStore';

const VALID_STATUSES: OrderStatus[] = ['NEW', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELED'];

// PATCH /api/admin/orders/[id]/status - Atualiza status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validações
    if (!status) {
      return NextResponse.json(
        { error: 'status é obrigatório' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `status inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
          validStatuses: VALID_STATUSES,
        },
        { status: 400 }
      );
    }

    // Verifica se pedido existe
    const existingOrder = getOrderById(id);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Valida transição de status
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      NEW: ['IN_PROGRESS', 'CANCELED'],
      IN_PROGRESS: ['READY', 'CANCELED'],
      READY: ['DELIVERED', 'IN_PROGRESS'], // Pode voltar se necessário
      DELIVERED: [], // Estado final
      CANCELED: [], // Estado final
    };

    if (!validTransitions[existingOrder.status].includes(status)) {
      return NextResponse.json(
        { 
          error: `Transição inválida: ${existingOrder.status} → ${status}`,
          currentStatus: existingOrder.status,
          allowedTransitions: validTransitions[existingOrder.status],
        },
        { status: 400 }
      );
    }

    // Atualiza status
    const updatedOrder = updateOrderStatus(id, status);

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Erro ao atualizar pedido' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
      message: `Status atualizado para ${status}`,
    });
  } catch (error) {
    console.error('[API] Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

// GET /api/admin/orders/[id]/status - Consulta pedido específico
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('[API] Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
