'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { validateTickerFormat, normalizeTicker, generateTickerSuggestions } from '@/lib/utils/ticker';

interface ProductFormProps {
  categories: string[];
  initialData?: {
    id?: string;
    sku?: string;
    ticker?: string;
    tickerSource?: 'AUTO' | 'MANUAL';
    name?: string;
    description?: string;
    category?: string;
    isActive?: boolean;
    basePriceCents?: number;
    priceFloorCents?: number;
    priceCapCents?: number;
  };
  mode?: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProductForm({
  categories,
  initialData,
  mode = 'create',
  onSuccess,
  onCancel,
}: ProductFormProps) {
  const router = useRouter();

  // Estados do formulário
  const [sku, setSku] = useState(initialData?.sku || '');
  const [ticker, setTicker] = useState(initialData?.ticker || '');
  const [tickerSource, setTickerSource] = useState<'AUTO' | 'MANUAL'>(
    initialData?.tickerSource || 'MANUAL'
  );
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || categories[0] || '');
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // Preços em reais (para exibição)
  const [basePrice, setBasePrice] = useState(
    initialData?.basePriceCents ? (initialData.basePriceCents / 100).toFixed(2) : ''
  );
  const [priceFloor, setPriceFloor] = useState(
    initialData?.priceFloorCents ? (initialData.priceFloorCents / 100).toFixed(2) : ''
  );
  const [priceCap, setPriceCap] = useState(
    initialData?.priceCapCents ? (initialData.priceCapCents / 100).toFixed(2) : ''
  );

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tickerSuggestions, setTickerSuggestions] = useState<string[]>([]);
  const [priceValidationError, setPriceValidationError] = useState<string | null>(null);

  // Gera sugestões de ticker quando nome muda
  useEffect(() => {
    if (name.trim() && tickerSource === 'AUTO') {
      const suggestions = generateTickerSuggestions(name, category);
      setTickerSuggestions(suggestions);
      if (suggestions.length > 0 && !ticker) {
        setTicker(suggestions[0]);
      }
    } else {
      setTickerSuggestions([]);
    }
  }, [name, category, tickerSource, ticker]);

  // Validação de preços em tempo real
  useEffect(() => {
    const floor = parseFloat(priceFloor) || 0;
    const base = parseFloat(basePrice) || 0;
    const cap = parseFloat(priceCap) || 0;

    if (floor > 0 && base > 0 && cap > 0) {
      if (floor > base) {
        setPriceValidationError('Preço mínimo deve ser ≤ preço base');
      } else if (base > cap) {
        setPriceValidationError('Preço base deve ser ≤ preço máximo');
      } else if (floor >= cap) {
        setPriceValidationError('Preço mínimo deve ser < preço máximo');
      } else {
        setPriceValidationError(null);
      }
    } else {
      setPriceValidationError(null);
    }
  }, [priceFloor, basePrice, priceCap]);

  // Converte valor monetário para centavos
  const parsePriceToCents = (value: string): number => {
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validações básicas
    if (!sku.trim()) {
      setError('SKU é obrigatório');
      return;
    }

    if (!name.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!ticker.trim()) {
      setError('Ticker é obrigatório');
      return;
    }

    if (!category) {
      setError('Categoria é obrigatória');
      return;
    }

    const floorCents = parsePriceToCents(priceFloor);
    const baseCents = parsePriceToCents(basePrice);
    const capCents = parsePriceToCents(priceCap);

    if (floorCents <= 0 || baseCents <= 0 || capCents <= 0) {
      setError('Todos os preços devem ser maiores que zero');
      return;
    }

    // Validação de ticker
    const tickerNormalized = normalizeTicker(ticker);
    const tickerValidation = validateTickerFormat(tickerNormalized);
    if (!tickerValidation.valid) {
      setError(tickerValidation.error || 'Ticker inválido');
      return;
    }

    // Validação de range de preço
    if (floorCents > baseCents || baseCents > capCents || floorCents >= capCents) {
      setError('Verifique os valores de preço mínimo, base e máximo');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = mode === 'create' ? '/api/admin/products' : `/api/admin/products/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: sku.trim(),
          ticker: tickerNormalized,
          tickerSource,
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim(),
          isActive,
          basePriceCents: baseCents,
          priceFloorCents: floorCents,
          priceCapCents: capCents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao salvar produto');
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      
      // Se tem callback onSuccess (modal), chama ele
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        // Senão, redireciona (página normal)
        setTimeout(() => {
          router.push('/admin/products');
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      console.error('[ProductForm] Submit error:', err);
      setError('Erro ao conectar com o servidor');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensagens de feedback */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-[#EF4444]">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg text-[#22C55E]">
          <CheckCircle2 className="w-5 h-5" />
          <span>Produto salvo com sucesso! Redirecionando...</span>
        </div>
      )}

      {/* Grid de campos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            SKU <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB]"
            placeholder="Ex: CHOPP-HEINEKEN-300"
            required
          />
        </div>

        {/* Ticker */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Ticker <span className="text-[#EF4444]">*</span>
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={tickerSource}
                onChange={(e) => setTickerSource(e.target.value as 'AUTO' | 'MANUAL')}
                className="px-3 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="MANUAL">Manual</option>
                <option value="AUTO">Auto</option>
              </select>
              <input
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB] font-market"
                placeholder="Ex: HEIN3"
                maxLength={7}
                required
              />
            </div>
            {tickerSuggestions.length > 0 && tickerSource === 'AUTO' && (
              <div className="flex gap-2 flex-wrap">
                {tickerSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setTicker(suggestion)}
                    className={`px-2 py-1 text-xs rounded ${
                      ticker === suggestion
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-[#9CA3AF]">
              Formato: 3-7 caracteres, alfanumérico, termina com número (ex: GINT3)
            </p>
          </div>
        </div>

        {/* Nome */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Nome <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB]"
            placeholder="Ex: Chopp Heineken 300ml"
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Categoria <span className="text-[#EF4444]">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB]"
            required
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Status
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-[#1F2937] bg-[#111827] text-[#2563EB] focus:ring-[#2563EB]"
              />
              <span className="text-sm text-[#E5E7EB]">
                {isActive ? 'Ativo' : 'Inativo'}
              </span>
            </label>
          </div>
        </div>

        {/* Descrição */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Descrição
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB] resize-none"
            placeholder="Descrição opcional do produto"
          />
        </div>

        {/* Preços */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Preço Mínimo (Floor) <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">R$</span>
            <input
              type="text"
              value={priceFloor}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
                  setPriceFloor(value);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB] font-market"
              placeholder="0,00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Preço Base <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">R$</span>
            <input
              type="text"
              value={basePrice}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
                  setBasePrice(value);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB] font-market"
              placeholder="0,00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
            Preço Máximo (Cap) <span className="text-[#EF4444]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">R$</span>
            <input
              type="text"
              value={priceCap}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
                if (value === '' || /^\d+\.?\d{0,2}$/.test(value)) {
                  setPriceCap(value);
                }
              }}
              className="w-full pl-10 pr-4 py-2 bg-[#111827] border border-[#1F2937] rounded-lg text-[#E5E7EB] focus:outline-none focus:border-[#2563EB] font-market"
              placeholder="0,00"
              required
            />
          </div>
        </div>

        {/* Preview de range */}
        {priceFloor && basePrice && priceCap && !priceValidationError && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Intervalo de Oscilação
            </label>
            <div className="relative h-8 bg-[#1F2937] rounded-lg overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF1744] via-[#F59E0B] to-[#00E676]"
                style={{
                  width: '100%',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-market-medium text-[#E5E7EB]">
                <span>R$ {parseFloat(priceFloor).toFixed(2)}</span>
                <span className="bg-[#0B0F14]/80 px-2 py-0.5 rounded">
                  Base: R$ {parseFloat(basePrice).toFixed(2)}
                </span>
                <span>R$ {parseFloat(priceCap).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {priceValidationError && (
          <div className="md:col-span-2 text-sm text-[#EF4444]">
            {priceValidationError}
          </div>
        )}
      </div>

      {/* Botões */}
      <div className="flex items-center gap-4 pt-4 border-t border-[#1F2937]">
        <button
          type="submit"
          disabled={isSubmitting || !!priceValidationError}
          className="flex items-center gap-2 px-6 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando...</span>
            </>
          ) : (
            <span>{mode === 'create' ? 'Criar Produto' : 'Salvar Alterações'}</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              router.back();
            }
          }}
          className="px-6 py-2 bg-[#1F2937] text-[#E5E7EB] rounded-lg hover:bg-[#374151] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

