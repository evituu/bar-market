import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/sessions/ensure - Garante sessão vinculada à mesa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableCode } = body;

    // Se não tem tableCode, cria sessão sem mesa
    if (!tableCode) {
      const session = await prisma.sessions.create({
        data: {
          status: 'ACTIVE',
        },
      });

      return NextResponse.json({
        sessionId: session.id,
        tableCode: null,
        tableId: null,
      });
    }

    // Valida mesa ativa
    const table = await prisma.tables.findUnique({
      where: { code: tableCode },
    });

    if (!table) {
      return NextResponse.json(
        { error: `Mesa "${tableCode}" não encontrada` },
        { status: 404 }
      );
    }

    if (!table.is_active) {
      return NextResponse.json(
        { error: `Mesa "${tableCode}" está inativa` },
        { status: 400 }
      );
    }

    // Busca sessão ativa existente para esta mesa
    const existingSession = await prisma.sessions.findFirst({
      where: {
        table_id: table.id,
        status: 'ACTIVE',
      },
      orderBy: {
        opened_at: 'desc',
      },
    });

    // Se já existe sessão ativa, retorna ela
    if (existingSession) {
      return NextResponse.json({
        sessionId: existingSession.id,
        tableCode: table.code,
        tableId: table.id,
      });
    }

    // Cria nova sessão vinculada à mesa
    const session = await prisma.sessions.create({
      data: {
        table_id: table.id,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      tableCode: table.code,
      tableId: table.id,
    });
  } catch (error: any) {
    console.error('[API] Erro ao garantir sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

