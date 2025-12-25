'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Sparkles, Check, X } from 'lucide-react';
import Link from 'next/link';
import type { Product } from '@/data';

interface ProductFormProps {
  product?: Product;
  categories: string[];
  isNew?: boolean;
}

interface FormData {
  name: string;
  sku: string;
  ticker: string;
  tickerSource: 'AUTO' | 'MANUAL';
  description: string;
  category: string;
  basePriceCents: number;
  priceFloorCents: number;
  priceCapCents: number;
  isActive: boolean;
}

interface FormErrors {
  name?: string;
  sku?: string;
  ticker?: string;
  category?: string;
  basePriceCents?: string;
  priceFloorCents?: string;
  priceCapCents?: string;
  general?: string;
}

export function ProductForm({ product, categories, isNew = false }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [tickerSuggestions, setTickerSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [tickerAvailable, setTickerAvailable] = useState<boolean | null>(null);
  const [isCheckingTicker, setIsCheckingTicker] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: product?.name || '',
    sku: product?.sku || '',
    ticker: product?.ticker || '',
    tickerSource: product?.tickerSource || 'AUTO',
    description: product?.description || '',
    category: product?.category || (categories[0] || ''),
    basePriceCents: product?.basePriceCents || 0,
    priceFloorCents: product?.priceFloorCents || 0,
    priceCapCents: product?.priceCapCents || 0,
    isActive: product?.isActive ?? true,
  });

  // Função para buscar sugestões de ticker
  const handleGenerateSuggestions = async () => {
    if (!formData.name.trim()) {
      setErrors({ ...errors, ticker: 'Digite o nome do produto primeiro' });
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const response = await fetch('/api/admin/tickers/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          excludeId: product?.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTickerSuggestions(data.suggestions || []);
        if (data.suggestions.length > 0) {
          setFormData((prev) => ({ ...prev, ticker: data.suggestions[0], tickerSource: 'AUTO' }));
          checkTickerAvailability(data.suggestions[0]);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Função para verificar disponibilidade do ticker
  const checkTickerAvailability = async (ticker: string) => {
    if (!ticker || ticker.length < 4) {
      setTickerAvailable(null);
      return;
    }

    setIsCheckingTicker(true);
    try {
      const params = new URLSearchParams({ ticker });
      if (product?.id) {
        params.append('excludeId', product.id);
      }

      const response = await fetch(`/api/admin/tickers/check?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTickerAvailable(data.available);
        if (!data.available) {
          setErrors({ ...errors, ticker: data.error || 'Ticker já está em uso' });
        } else {
          const newErrors = { ...errors };
          delete newErrors.ticker;
          setErrors(newErrors);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar ticker:', error);
    } finally {
      setIsCheckingTicker(false);
    }
  };

  // Auto-gerar sugestão quando o nome mudar (apenas em novos produtos)
  useEffect(() => {
    if (isNew && formData.name.trim() && !formData.ticker) {
      const timer = setTimeout(() => {
        handleGenerateSuggestions();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData.name, isNew]);

  // Verificar disponibilidade quando ticker mudar manualmente
  useEffect(() => {
    if (formData.ticker && formData.tickerSource === 'MANUAL') {
      const timer = setTimeout(() => {
        checkTickerAvailability(formData.ticker);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.ticker]);

  // Converte centavos para reais para exibição
  const centsToCurrency = (cents: number) => (cents / 100).toFixed(2);
  const currencyToCents = (value: string) => Math.round(parseFloat(value || '0') * 100);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU é obrigatório';
    }

    if (!formData.ticker.trim()) {
      newErrors.ticker = 'Ticker é obrigatório';
    } else if (!/^[A-Z]{3,6}\d$/.test(formData.ticker.toUpperCase())) {
      newErrors.ticker = 'Ticker deve ter 3-6 letras seguidas de 1 dígito (ex: GINT3)';
    } else if (tickerAvailable === false) {
      newErrors.ticker = 'Este ticker já está em uso';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (formData.basePriceCents <= 0) {
      newErrors.basePriceCents = 'Preço base deve ser maior que zero';
    }

    if (formData.priceFloorCents <= 0) {
      newErrors.priceFloorCents = 'Preço mínimo deve ser maior que zero';
    }

    if (formData.priceCapCents <= 0) {
      newErrors.priceCapCents = 'Preço máximo deve ser maior que zero';
    }

    // Validação: floor <= base <= cap
    if (formData.priceFloorCents > formData.basePriceCents) {
      newErrors.priceFloorCents = 'Floor deve ser menor ou igual ao preço base';
    }

    if (formData.basePriceCents > formData.priceCapCents) {
      newErrors.priceCapCents = 'Cap deve ser maior ou igual ao preço base';
    }

    if (formData.priceFloorCents >= formData.priceCapCents) {
      newErrors.general = 'Floor deve ser menor que Cap';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const endpoint = isNew
        ? '/api/admin/products'
        : `/api/admin/products/${product?.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar produto');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      setErrors({ general: 'Erro ao salvar produto. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePriceChange = (field: keyof FormData, value: string) => {
    const cents = currencyToCents(value);
    setFormData((prev) => ({ ...prev, [field]: cents }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1F2937] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#E5E7EB]">
              {isNew ? 'Novo Produto' : 'Editar Produto'}
            </h1>
            <p className="text-sm text-[#9CA3AF] mt-1">
              {isNew
                ? 'Cadastre um novo produto no mercado'
                : `Editando: ${product?.name}`}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#F59E0B] text-[#0B0F14] rounded-lg text-sm font-semibold hover:bg-[#D97706] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
        </button>
      </div>

      {/* General Error */}
      {errors.general && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#FF1744]/10 border border-[#FF1744]/30 rounded-lg text-[#FF1744] text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errors.general}
        </div>
      )}

      {/* Form Content */}
      <div className="bg-[#111827] border border-[#1F2937] rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`w-full px-4 py-2.5 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none transition-colors ${
                errors.name
                  ? 'border-[#FF1744] focus:border-[#FF1744]'
                  : 'border-[#1F2937] focus:border-[#F59E0B]'
              }`}
              placeholder="Ex: Chopp Pilsen 300ml"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.name}</p>
            )}
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, sku: e.target.value }))
              }
              className={`w-full px-4 py-2.5 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none transition-colors ${
                errors.sku
                  ? 'border-[#FF1744] focus:border-[#FF1744]'
                  : 'border-[#1F2937] focus:border-[#F59E0B]'
              }`}
              placeholder="Ex: CHOP-PILS-300"
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.sku}</p>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Categoria *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className={`w-full px-4 py-2.5 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] focus:outline-none transition-colors cursor-pointer ${
                errors.category
                  ? 'border-[#FF1744] focus:border-[#FF1744]'
                  : 'border-[#1F2937] focus:border-[#F59E0B]'
              }`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.category}</p>
            )}
          </div>

          {/* Ticker (Símbolo de Bolsa) */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Ticker (Símbolo de Bolsa) *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData((prev) => ({ 
                      ...prev, 
                      ticker: value,
                      tickerSource: 'MANUAL'
                    }));
                  }}
                  className={`w-full px-4 py-2.5 pr-10 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none transition-colors font-mono text-lg ${
                    errors.ticker
                      ? 'border-[#FF1744] focus:border-[#FF1744]'
                      : tickerAvailable === true
                        ? 'border-[#00E676] focus:border-[#00E676]'
                        : 'border-[#1F2937] focus:border-[#F59E0B]'
                  }`}
                  placeholder="Ex: GINT3"
                  maxLength={7}
                />
                {/* Indicador de disponibilidade */}
                {formData.ticker && !isCheckingTicker && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {tickerAvailable === true ? (
                      <Check className="w-5 h-5 text-[#00E676]" />
                    ) : tickerAvailable === false ? (
                      <X className="w-5 h-5 text-[#FF1744]" />
                    ) : null}
                  </div>
                )}
              </div>
              
              {/* Botão de sugestão */}
              <button
                type="button"
                onClick={handleGenerateSuggestions}
                disabled={isLoadingSuggestions || !formData.name.trim()}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1F2937] text-[#E5E7EB] rounded-lg text-sm font-medium hover:bg-[#374151] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#374151]"
              >
                <Sparkles className="w-4 h-4" />
                {isLoadingSuggestions ? 'Gerando...' : 'Sugerir'}
              </button>
            </div>
            
            {/* Sugestões de ticker */}
            {tickerSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-[#9CA3AF] self-center">Sugestões:</span>
                {tickerSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, ticker: suggestion, tickerSource: 'AUTO' }));
                      checkTickerAvailability(suggestion);
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-mono transition-colors ${
                      formData.ticker === suggestion
                        ? 'bg-[#F59E0B] text-[#0B0F14] font-semibold'
                        : 'bg-[#1F2937] text-[#9CA3AF] hover:bg-[#374151] hover:text-[#E5E7EB]'
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {/* Preview e ajuda */}
            <div className="mt-2 space-y-1">
              {formData.ticker && tickerAvailable === true && (
                <p className="text-xs text-[#00E676] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Aparecerá no telão como: <span className="font-mono font-semibold">{formData.ticker}</span>
                </p>
              )}
              <p className="text-xs text-[#9CA3AF]">
                3-6 letras + 1 dígito (ex: GINT3, CHOP4). Será exibido em destaque no telão.
              </p>
            </div>
            
            {errors.ticker && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.ticker}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0B0F14] border border-[#1F2937] rounded-lg text-[#E5E7EB] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F59E0B] transition-colors resize-none"
              placeholder="Descrição opcional do produto..."
            />
          </div>

          {/* Divider */}
          <div className="lg:col-span-2 border-t border-[#1F2937] pt-6 mt-2">
            <h3 className="text-sm font-semibold text-[#E5E7EB] mb-4">
              Configuração de Preços
            </h3>
            <p className="text-xs text-[#9CA3AF] mb-4">
              O preço oscila entre Floor (mínimo) e Cap (máximo). O preço base é
              o valor inicial quando o produto entra no mercado.
            </p>
          </div>

          {/* Preço Base */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Preço Base (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={centsToCurrency(formData.basePriceCents)}
                onChange={(e) => handlePriceChange('basePriceCents', e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] font-market-medium focus:outline-none transition-colors ${
                  errors.basePriceCents
                    ? 'border-[#FF1744] focus:border-[#FF1744]'
                    : 'border-[#1F2937] focus:border-[#F59E0B]'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.basePriceCents && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.basePriceCents}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Status
            </label>
            <div className="flex items-center gap-4 h-[42px]">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  formData.isActive
                    ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30'
                    : 'bg-[#0B0F14] text-[#9CA3AF] border border-[#1F2937]'
                }`}
              >
                Ativo
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !formData.isActive
                    ? 'bg-[#FF1744]/10 text-[#FF1744] border border-[#FF1744]/30'
                    : 'bg-[#0B0F14] text-[#9CA3AF] border border-[#1F2937]'
                }`}
              >
                Inativo
              </button>
            </div>
          </div>

          {/* Floor */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Floor - Preço Mínimo (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={centsToCurrency(formData.priceFloorCents)}
                onChange={(e) => handlePriceChange('priceFloorCents', e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] font-market-medium focus:outline-none transition-colors ${
                  errors.priceFloorCents
                    ? 'border-[#FF1744] focus:border-[#FF1744]'
                    : 'border-[#1F2937] focus:border-[#F59E0B]'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.priceFloorCents && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.priceFloorCents}</p>
            )}
          </div>

          {/* Cap */}
          <div>
            <label className="block text-sm font-medium text-[#E5E7EB] mb-2">
              Cap - Preço Máximo (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={centsToCurrency(formData.priceCapCents)}
                onChange={(e) => handlePriceChange('priceCapCents', e.target.value)}
                className={`w-full pl-12 pr-4 py-2.5 bg-[#0B0F14] border rounded-lg text-[#E5E7EB] font-market-medium focus:outline-none transition-colors ${
                  errors.priceCapCents
                    ? 'border-[#FF1744] focus:border-[#FF1744]'
                    : 'border-[#1F2937] focus:border-[#F59E0B]'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.priceCapCents && (
              <p className="mt-1 text-xs text-[#FF1744]">{errors.priceCapCents}</p>
            )}
          </div>

          {/* Price Range Preview */}
          <div className="lg:col-span-2 mt-2">
            <div className="bg-[#0B0F14] border border-[#1F2937] rounded-lg p-4">
              <p className="text-xs text-[#9CA3AF] mb-3">
                Intervalo de oscilação do preço:
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-[#1F2937] rounded-full relative overflow-hidden">
                  {formData.priceCapCents > 0 && (
                    <>
                      <div
                        className="absolute h-full bg-[#FF1744]/50 rounded-l-full"
                        style={{
                          width: `${(formData.priceFloorCents / formData.priceCapCents) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute h-full w-1 bg-[#F59E0B]"
                        style={{
                          left: `${(formData.basePriceCents / formData.priceCapCents) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute h-full bg-[#00E676]/50 rounded-r-full right-0"
                        style={{
                          width: `${((formData.priceCapCents - formData.basePriceCents) / formData.priceCapCents) * 100}%`,
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs font-market-medium">
                <span className="text-[#FF1744]">
                  Floor: {formatCurrency(formData.priceFloorCents)}
                </span>
                <span className="text-[#F59E0B]">
                  Base: {formatCurrency(formData.basePriceCents)}
                </span>
                <span className="text-[#00E676]">
                  Cap: {formatCurrency(formData.priceCapCents)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

// Helper para formatação no preview
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}
