/**
 * Domínio de Produtos
 * Centraliza regras de negócio e operações de banco relacionadas a produtos
 */

import { prisma } from '@/lib/prisma';
import { validateTickerFormat, normalizeTicker } from '@/lib/utils/ticker';

export interface CreateProductInput {
  sku: string;
  ticker: string;
  tickerSource: 'AUTO' | 'MANUAL';
  name: string;
  description?: string | null;
  category: string;
  isActive?: boolean;
  basePriceCents: number;
  priceFloorCents: number;
  priceCapCents: number;
}

export interface CreateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
  code?: string;
}

/**
 * Valida regras de preço: floor ≤ base ≤ cap e floor < cap
 */
export function validatePriceRange(
  floor: number,
  base: number,
  cap: number
): { valid: boolean; error?: string } {
  if (floor > base) {
    return {
      valid: false,
      error: 'Preço mínimo (floor) deve ser menor ou igual ao preço base',
    };
  }

  if (base > cap) {
    return {
      valid: false,
      error: 'Preço máximo (cap) deve ser maior ou igual ao preço base',
    };
  }

  if (floor >= cap) {
    return {
      valid: false,
      error: 'Preço mínimo deve ser menor que o preço máximo',
    };
  }

  return { valid: true };
}

/**
 * Cria produto com inicialização obrigatória de price_states
 * Usa transaction para garantir atomicidade
 */
export async function createProduct(
  input: CreateProductInput
): Promise<CreateProductResult> {
  try {
    // 1. Validação de ticker
    const tickerNormalized = normalizeTicker(input.ticker);
    const tickerValidation = validateTickerFormat(tickerNormalized);
    if (!tickerValidation.valid) {
      return {
        success: false,
        error: tickerValidation.error,
        code: 'INVALID_TICKER',
      };
    }

    // 2. Validação de preços
    const priceValidation = validatePriceRange(
      input.priceFloorCents,
      input.basePriceCents,
      input.priceCapCents
    );
    if (!priceValidation.valid) {
      return {
        success: false,
        error: priceValidation.error,
        code: 'INVALID_PRICE_RANGE',
      };
    }

    // 3. Validação de campos obrigatórios
    if (!input.sku?.trim()) {
      return {
        success: false,
        error: 'SKU é obrigatório',
        code: 'MISSING_SKU',
      };
    }

    if (!input.name?.trim()) {
      return {
        success: false,
        error: 'Nome é obrigatório',
        code: 'MISSING_NAME',
      };
    }

    if (!input.category?.trim()) {
      return {
        success: false,
        error: 'Categoria é obrigatória',
        code: 'MISSING_CATEGORY',
      };
    }

    // 4. Verifica unicidade de SKU e Ticker (dentro da transaction)
    const [existingSku, existingTicker] = await Promise.all([
      prisma.products.findUnique({
        where: { sku: input.sku.trim() },
        select: { id: true },
      }),
      prisma.products.findUnique({
        where: { ticker: tickerNormalized },
        select: { id: true },
      }),
    ]);

    if (existingSku) {
      return {
        success: false,
        error: `SKU "${input.sku}" já está em uso`,
        code: 'DUPLICATE_SKU',
      };
    }

    if (existingTicker) {
      return {
        success: false,
        error: `Ticker "${tickerNormalized}" já está em uso`,
        code: 'DUPLICATE_TICKER',
      };
    }

    // 5. Cria produto e price_states em transaction
    const result = await prisma.$transaction(async (tx) => {
      // Cria produto
      const product = await tx.products.create({
        data: {
          sku: input.sku.trim(),
          ticker: tickerNormalized,
          ticker_source: input.tickerSource,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          category: input.category.trim(),
          is_active: input.isActive ?? true,
          base_price_cents: input.basePriceCents,
          price_floor_cents: input.priceFloorCents,
          price_cap_cents: input.priceCapCents,
        },
      });

      // Inicializa price_states obrigatoriamente
      await tx.price_states.create({
        data: {
          product_id: product.id,
          price_cents: input.basePriceCents, // current = base no início
          prev_price_cents: input.basePriceCents, // prev = base no início
          tick_seq: BigInt(0), // Começa do zero
        },
      });

      return product;
    });

    return {
      success: true,
      productId: result.id,
    };
  } catch (error: any) {
    // Tratamento de erros do Prisma
    if (error.code === 'P2002') {
      // Unique constraint violation
      const target = error.meta?.target as string[] | undefined;
      if (target?.includes('sku')) {
        return {
          success: false,
          error: `SKU "${input.sku}" já está em uso`,
          code: 'DUPLICATE_SKU',
        };
      }
      if (target?.includes('ticker')) {
        return {
          success: false,
          error: `Ticker "${tickerNormalized}" já está em uso`,
          code: 'DUPLICATE_TICKER',
        };
      }
    }

    console.error('[createProduct] Database error:', error);
    return {
      success: false,
      error: 'Erro ao criar produto no banco de dados',
      code: 'DATABASE_ERROR',
    };
  }
}

/**
 * Busca todas as categorias únicas do banco
 */
export async function getAllCategoriesFromDB(): Promise<string[]> {
  try {
    const categories = await prisma.products.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map((c) => c.category);
  } catch (error) {
    console.error('[getAllCategoriesFromDB] Error:', error);
    return [];
  }
}

/**
 * Interface compatível com ProductWithPrice dos mocks
 * Usada para manter compatibilidade com componentes existentes
 * 
 * Nota: Este tipo deve ser compatível com o tipo ProductWithPrice de @/data
 * para que os componentes do telão funcionem corretamente
 */
export interface ProductWithPrice {
  id: string;
  sku: string;
  ticker: string;
  tickerSource: 'AUTO' | 'MANUAL';
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  basePriceCents: number;
  priceFloorCents: number;
  priceCapCents: number;
  currentPriceCents: number;
  prevPriceCents: number;
  priceChange: number; // percentual: (current - prev) / prev
  tickSeq: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Busca produtos do banco com preços formatados
 * Retorna no formato ProductWithPrice para compatibilidade com componentes
 */
export async function getProductsWithPricesFromDB(): Promise<ProductWithPrice[]> {
  try {
    const products = await prisma.products.findMany({
      where: {
        is_active: true, // Apenas produtos ativos para o telão
      },
      include: {
        price_states: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    return products.map((product) => {
      const priceState = product.price_states;
      const currentPriceCents = priceState?.price_cents ?? product.base_price_cents;
      const prevPriceCents = priceState?.prev_price_cents ?? product.base_price_cents;
      
      // Calcula variação percentual
      const priceChange =
        prevPriceCents > 0
          ? (currentPriceCents - prevPriceCents) / prevPriceCents
          : 0;

      return {
        id: product.id,
        sku: product.sku,
        ticker: product.ticker,
        tickerSource: product.ticker_source as 'AUTO' | 'MANUAL',
        name: product.name,
        description: product.description,
        category: product.category,
        isActive: product.is_active,
        basePriceCents: product.base_price_cents,
        priceFloorCents: product.price_floor_cents,
        priceCapCents: product.price_cap_cents,
        currentPriceCents,
        prevPriceCents,
        priceChange,
        tickSeq: priceState ? Number(priceState.tick_seq) : 0,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
      };
    });
  } catch (error) {
    console.error('[getProductsWithPricesFromDB] Error:', error);
    return [];
  }
}

