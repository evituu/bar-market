'use client';

import { useEffect, useState, ReactNode } from 'react';

interface PriceFlashProps {
  currentValue: number;
  previousValue: number;
  children: ReactNode;
  duration?: number; // em ms (padrão: 350ms)
}

export function PriceFlash({
  currentValue,
  previousValue,
  children,
  duration = 350,
}: PriceFlashProps) {
  const [flashState, setFlashState] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    // Detecta mudança de preço
    if (currentValue !== previousValue) {
      const isUp = currentValue > previousValue;
      setFlashState(isUp ? 'up' : 'down');

      // Remove o flash após a duração especificada
      const timer = setTimeout(() => {
        setFlashState(null);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [currentValue, previousValue, duration]);

  // Classe de flash correspondente
  const flashClass =
    flashState === 'up'
      ? 'flash-up'
      : flashState === 'down'
        ? 'flash-down'
        : '';

  return <div className={flashClass}>{children}</div>;
}
