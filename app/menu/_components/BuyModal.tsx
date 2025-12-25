'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Clock, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/data';

interface LockData {
  orderId: string;
  lockId: string;
  productId: string;
  productName: string;
  qty: number;
  lockedPriceCents: number;
  totalCents: number;
  expiresAt: string;
  ttlSeconds: number;
}

interface BuyModalProps {
  isOpen: boolean;
  lockData: LockData | null;
  sessionId: string;
  onClose: () => void;
  onConfirmSuccess: () => void;
}

type ModalState = 'countdown' | 'confirming' | 'success' | 'expired' | 'error';

export function BuyModal({
  isOpen,
  lockData,
  sessionId,
  onClose,
  onConfirmSuccess,
}: BuyModalProps) {
  const [state, setState] = useState<ModalState>('countdown');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Calcula tempo restante
  useEffect(() => {
    if (!lockData || !isOpen) return;

    const expiresAt = new Date(lockData.expiresAt).getTime();

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setRemainingSeconds(remaining);

      if (remaining === 0 && state === 'countdown') {
        setState('expired');
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockData, isOpen, state]);

  // Reset state quando modal abre
  useEffect(() => {
    if (isOpen && lockData) {
      setState('countdown');
      setErrorMessage('');
    }
  }, [isOpen, lockData]);

  // Confirma pedido
  const handleConfirm = useCallback(async () => {
    if (!lockData) return;

    setState('confirming');

    try {
      const response = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: lockData.orderId,
          lockId: lockData.lockId,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'LOCK_EXPIRED') {
          setState('expired');
        } else {
          setState('error');
          setErrorMessage(data.error || 'Erro ao confirmar pedido');
        }
        return;
      }

      setState('success');
      setTimeout(() => {
        onConfirmSuccess();
      }, 2000);
    } catch (error) {
      setState('error');
      setErrorMessage('Erro de conexão. Tente novamente.');
    }
  }, [lockData, sessionId, onConfirmSuccess]);

  if (!isOpen || !lockData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111827] border-t border-[#1F2937] rounded-t-3xl p-6 animate-slide-up safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#E5E7EB]">
            Confirmar Pedido
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo baseado no estado */}
        {state === 'countdown' && (
          <>
            {/* Produto e preço */}
            <div className="bg-[#0B0F14] rounded-xl p-4 mb-4">
              <p className="text-[#E5E7EB] font-medium mb-2">
                {lockData.productName}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[#9CA3AF] text-sm">
                  {lockData.qty}x {formatCurrency(lockData.lockedPriceCents)}
                </span>
                <span className="text-xl font-bold font-market-semibold text-[#E5E7EB]">
                  {formatCurrency(lockData.totalCents)}
                </span>
              </div>
            </div>

            {/* Contador regressivo */}
            <div className="flex items-center justify-center gap-2 mb-6 py-3 bg-[#F59E0B]/10 rounded-xl">
              <Clock className="w-5 h-5 text-[#F59E0B]" />
              <span className="text-[#F59E0B] font-market-semibold">
                Preço travado por{' '}
                <span className="text-lg">{remainingSeconds}s</span>
              </span>
            </div>

            {/* Botão confirmar */}
            <button
              onClick={handleConfirm}
              className="w-full py-4 bg-[#00E676] text-[#0B0F14] rounded-xl font-semibold text-base hover:bg-[#00C853] active:scale-98 transition-all"
            >
              Confirmar Pedido
            </button>

            <p className="text-center text-xs text-[#9CA3AF] mt-3">
              O preço será mantido até o fim do contador
            </p>
          </>
        )}

        {state === 'confirming' && (
          <div className="py-8 text-center">
            <div className="w-12 h-12 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#E5E7EB]">Confirmando pedido...</p>
          </div>
        )}

        {state === 'success' && (
          <div className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-[#00E676] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">
              Pedido Confirmado!
            </h3>
            <p className="text-[#9CA3AF]">
              {lockData.productName} por {formatCurrency(lockData.totalCents)}
            </p>
          </div>
        )}

        {state === 'expired' && (
          <div className="py-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#F59E0B] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">
              Tempo Esgotado
            </h3>
            <p className="text-[#9CA3AF] mb-6">
              O preço pode ter mudado. Tente novamente.
            </p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-[#F59E0B] text-[#0B0F14] rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Tentar Novamente
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="py-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#FF1744] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#E5E7EB] mb-2">
              Erro no Pedido
            </h3>
            <p className="text-[#9CA3AF] mb-6">{errorMessage}</p>
            <button
              onClick={onClose}
              className="w-full py-4 bg-[#1F2937] text-[#E5E7EB] rounded-xl font-semibold"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
