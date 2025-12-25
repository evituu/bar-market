import { NextRequest, NextResponse } from 'next/server';
import { getOrders, getOrderCounts, type OrderStatus, type PrepArea } from '@/lib/stores/ordersStore';

// GET /api/admin/orders - Lista pedidos com filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parâmetros de filtro
    const statusParam = searchParams.get('status');
    const prepAreaParam = searchParams.get('prepArea') as PrepArea | null;
    const tableIdParam = searchParams.get('tableId');
    const countsOnly = searchParams.get('countsOnly') === 'true';

    // Se só quer contagens
    if (countsOnly) {
      const counts = getOrderCounts();
      return NextResponse.json({ counts });
    }

    // Parse status (pode ser múltiplo: status=NEW,IN_PROGRESS)
    let statusFilter: OrderStatus | OrderStatus[] | undefined;
    if (statusParam) {
      const statuses = statusParam.split(',') as OrderStatus[];
      statusFilter = statuses.length === 1 ? statuses[0] : statuses;
    }

    // Busca pedidos
    const orders = getOrders({
      status: statusFilter,
      prepArea: prepAreaParam || undefined,
      tableId: tableIdParam || undefined,
    });

    // Contagens para o header
    const counts = getOrderCounts();

    return NextResponse.json({
      orders,
      counts,
      total: orders.length,
    });
  } catch (error) {
    console.error('[API] Erro ao listar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar pedidos' },
      { status: 500 }
    );
  }
}
