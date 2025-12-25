'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { ProductWithPrice } from '@/data';

// Snapshot de mercado recebido via SSE
export interface MarketSnapshot {
  tick: number;
  timestamp: string;
  products: ProductWithPrice[];
}

interface MarketStreamContextValue {
  snapshot: MarketSnapshot | null;
  isConnected: boolean;
  isReconnecting: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

const MarketStreamContext = createContext<MarketStreamContextValue | null>(null);

const SSE_URL = '/api/stream/precos';
const POLLING_INTERVAL = 3000; // 3s fallback
const RECONNECT_DELAY = 2000; // 2s antes de reconectar

interface MarketStreamProviderProps {
  children: ReactNode;
  fallbackToPolling?: boolean;
}

export function MarketStreamProvider({
  children,
  fallbackToPolling = true,
}: MarketStreamProviderProps) {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch inicial ou fallback polling
  const fetchSnapshot = useCallback(async () => {
    try {
      const response = await fetch('/api/stream/precos?poll=true');
      if (!response.ok) throw new Error('Erro ao buscar preços');
      
      const data = await response.json();
      setSnapshot(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Erro ao carregar preços');
      console.error('[MarketStream] Fetch error:', err);
    }
  }, []);

  // Inicia polling como fallback
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    
    console.log('[MarketStream] Iniciando polling fallback...');
    pollingRef.current = setInterval(fetchSnapshot, POLLING_INTERVAL);
    fetchSnapshot(); // Fetch imediato
  }, [fetchSnapshot]);

  // Para polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Conecta ao SSE
  const connect = useCallback(() => {
    // Limpa conexão anterior
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      console.log('[MarketStream] Conectando ao SSE...');
      const eventSource = new EventSource(SSE_URL);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[MarketStream] SSE conectado');
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        stopPolling();
      };

      eventSource.onmessage = (event) => {
        try {
          const data: MarketSnapshot = JSON.parse(event.data);
          setSnapshot(data);
          setLastUpdate(new Date());
        } catch (err) {
          console.error('[MarketStream] Erro ao parsear:', err);
        }
      };

      eventSource.onerror = () => {
        console.log('[MarketStream] SSE erro/desconectado');
        setIsConnected(false);
        setIsReconnecting(true);
        eventSource.close();

        // Fallback para polling
        if (fallbackToPolling) {
          startPolling();
        }

        // Agenda reconexão
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY);
      };
    } catch (err) {
      console.error('[MarketStream] Erro ao criar EventSource:', err);
      setError('Erro na conexão');
      
      if (fallbackToPolling) {
        startPolling();
      }
    }
  }, [fallbackToPolling, startPolling, stopPolling]);

  // Cleanup
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      stopPolling();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, stopPolling]);

  const value: MarketStreamContextValue = {
    snapshot,
    isConnected,
    isReconnecting,
    error,
    lastUpdate,
  };

  return (
    <MarketStreamContext.Provider value={value}>
      {children}
    </MarketStreamContext.Provider>
  );
}

export function useMarketStream() {
  const context = useContext(MarketStreamContext);
  if (!context) {
    throw new Error('useMarketStream must be used within MarketStreamProvider');
  }
  return context;
}

// Hook para obter produto específico por ID (evita re-render completo)
export function useProduct(productId: string): ProductWithPrice | null {
  const { snapshot } = useMarketStream();
  return snapshot?.products.find((p) => p.id === productId) ?? null;
}

// Hook para obter produtos por categoria
export function useProductsByCategory(category: string): ProductWithPrice[] {
  const { snapshot } = useMarketStream();
  if (!snapshot) return [];
  return snapshot.products.filter((p) => p.category === category);
}
