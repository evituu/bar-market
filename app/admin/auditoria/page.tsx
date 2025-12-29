import { AdminLayout } from '../_components';
import { EventsTable } from './_components';
import { prisma } from '@/lib/prisma';
import { FileText } from 'lucide-react';

export default async function AuditoriaPage() {
  // Busca todos os eventos de mercado do banco
  const events = await prisma.market_events.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });

  // Formata eventos para o formato esperado pelo componente
  const formattedEvents = events.map((event) => {
    const startsAt = new Date(event.starts_at);
    const endsAt = new Date(event.ends_at);
    const durationMs = endsAt.getTime() - startsAt.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));

    return {
      id: event.id,
      type: event.type as 'CRASH' | 'RESET' | 'FREEZE' | 'MALUCO',
      startsAt,
      endsAt,
      isActive: event.is_active,
      createdAt: new Date(event.created_at),
      duration: durationMinutes,
    };
  });

  // Estatísticas
  const totalEvents = formattedEvents.length;
  const activeEvents = formattedEvents.filter((e) => e.isActive).length;
  const eventsByType = {
    CRASH: formattedEvents.filter((e) => e.type === 'CRASH').length,
    RESET: formattedEvents.filter((e) => e.type === 'RESET').length,
    FREEZE: formattedEvents.filter((e) => e.type === 'FREEZE').length,
    MALUCO: formattedEvents.filter((e) => e.type === 'MALUCO').length,
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-[#F59E0B]" />
          <h1 className="text-2xl font-bold text-[#E5E7EB]">Auditoria de Eventos</h1>
        </div>
        <p className="text-sm text-[#9CA3AF]">
          Histórico completo de eventos de mercado e suas ações
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF] mb-1">Total de Eventos</div>
          <div className="text-2xl font-bold text-[#E5E7EB] font-market-semibold">
            {totalEvents}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF] mb-1">Eventos Ativos</div>
          <div className="text-2xl font-bold text-[#00E676] font-market-semibold">
            {activeEvents}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#FF1744]/30 rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF] mb-1">CRASH</div>
          <div className="text-2xl font-bold text-[#FF1744] font-market-semibold">
            {eventsByType.CRASH}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#2563EB]/30 rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF] mb-1">FREEZE</div>
          <div className="text-2xl font-bold text-[#2563EB] font-market-semibold">
            {eventsByType.FREEZE}
          </div>
        </div>
        <div className="bg-[#111827] border border-[#A855F7]/30 rounded-lg p-4">
          <div className="text-sm text-[#9CA3AF] mb-1">MALUCO</div>
          <div className="text-2xl font-bold text-[#A855F7] font-market-semibold">
            {eventsByType.MALUCO}
          </div>
        </div>
      </div>

      {/* Tabela de Eventos */}
      <div>
        <h2 className="text-lg font-semibold text-[#E5E7EB] mb-4">Histórico de Eventos</h2>
        <EventsTable events={formattedEvents} />
      </div>
    </AdminLayout>
  );
}

