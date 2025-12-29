'use client';

import { useState, useMemo } from 'react';

export interface MarketEvent {
  id: string;
  type: 'CRASH' | 'RESET' | 'FREEZE' | 'MALUCO';
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  duration: number; // em minutos
}

interface EventsTableProps {
  events: MarketEvent[];
}


export function EventsTable({ events }: EventsTableProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtra eventos
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter((e) => e.type === filterType);
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      const isActive = filterStatus === 'active';
      filtered = filtered.filter((e) => e.isActive === isActive);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, filterType, filterStatus, sortBy, sortOrder]);

  // Formata data/hora
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Formata duração
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Calcula status do evento
  const getEventStatus = (event: MarketEvent) => {
    const now = new Date();
    if (event.isActive && now >= event.startsAt && now <= event.endsAt) {
      return { label: 'Ativo', color: 'text-[#00E676]' };
    }
    if (now > event.endsAt) {
      return { label: 'Finalizado', color: 'text-[#9CA3AF]' };
    }
    return { label: 'Inativo', color: 'text-[#F59E0B]' };
  };

  return (
    <div className="bg-[#111827] rounded-lg border border-[#1F2937] overflow-hidden">
      {/* Filtros e Ordenação */}
      <div className="p-4 border-b border-[#1F2937] bg-[#0B0F14]">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro por Tipo */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#9CA3AF]">Tipo:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] text-sm focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="all">Todos</option>
              <option value="CRASH">CRASH</option>
              <option value="RESET">RESET</option>
              <option value="FREEZE">FREEZE</option>
              <option value="MALUCO">MALUCO</option>
            </select>
          </div>

          {/* Filtro por Status */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-[#9CA3AF]">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] text-sm focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-[#9CA3AF]">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] text-sm focus:outline-none focus:border-[#F59E0B]"
            >
              <option value="date">Data</option>
              <option value="duration">Duração</option>
              <option value="type">Tipo</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 bg-[#1F2937] border border-[#374151] rounded-lg text-[#E5E7EB] text-sm hover:bg-[#374151] transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Contador */}
        <div className="mt-3 text-sm text-[#9CA3AF]">
          Mostrando <span className="text-[#E5E7EB] font-semibold">{filteredEvents.length}</span> de{' '}
          <span className="text-[#E5E7EB] font-semibold">{events.length}</span> eventos
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1F2937] border-b border-[#374151]">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                EVENTO
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Início
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Término
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Duração
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[#9CA3AF]">
                  Nenhum evento encontrado
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => {
                const status = getEventStatus(event);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-[#1F2937]/50 transition-colors"
                  >
                    {/* EVENTO */}
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-[#E5E7EB] text-sm">
                        {event.type}
                      </span>
                    </td>

                    {/* Início */}
                    <td className="px-4 py-3 text-center text-[#E5E7EB] text-sm">
                      {formatDateTime(event.startsAt)}
                    </td>

                    {/* Término */}
                    <td className="px-4 py-3 text-center text-[#E5E7EB] text-sm">
                      {formatDateTime(event.endsAt)}
                    </td>

                    {/* Duração */}
                    <td className="px-4 py-3 text-center text-[#E5E7EB] text-sm font-market-medium">
                      {formatDuration(event.duration)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`
                          inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                          ${status.color}
                        `}
                      >
                        {event.isActive && (
                          <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full animate-pulse" />
                        )}
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

