// Utilitários para geração e validação de tickers (símbolos de bolsa)

// Palavras a serem removidas na normalização
const STOPWORDS = new Set([
  'de', 'da', 'do', 'das', 'dos',
  'ml', 'lata', 'garrafa', 'long', 'neck',
  'premium', 'especial', 'artesanal',
]);

/**
 * Normaliza uma string para geração de ticker
 * Remove acentos, stopwords e caracteres especiais
 */
export function normalizeForTicker(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => !STOPWORDS.has(word))
    .join(' ');
}

/**
 * Gera prefixo do ticker baseado no nome
 * Retorna 4-6 letras uppercase
 */
export function generateTickerPrefix(name: string): string {
  const normalized = normalizeForTicker(name);
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return 'PROD';
  }

  if (words.length === 1) {
    // Uma palavra: pega 4-6 primeiras letras
    const word = words[0].toUpperCase();
    return word.slice(0, Math.min(6, Math.max(4, word.length)));
  }

  // Duas ou mais palavras: combina iniciais + letras
  if (words.length === 2) {
    const [first, second] = words;
    // Ex: "Gin Tonica" → GINT (2 letras de cada)
    return (first.slice(0, 2) + second.slice(0, 2)).toUpperCase();
  }

  // Três ou mais: pega iniciais das 3 primeiras
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .padEnd(4, words[0][1]?.toUpperCase() || 'X');
}

/**
 * Gera sugestões de ticker para um produto
 * @param name Nome do produto
 * @param category Categoria (opcional, para desambiguação)
 * @param existingTickers Set de tickers já em uso
 * @param maxSuggestions Número máximo de sugestões
 */
export function generateTickerSuggestions(
  name: string,
  category?: string,
  existingTickers: Set<string> = new Set(),
  maxSuggestions: number = 3
): string[] {
  const suggestions: string[] = [];
  const prefix = generateTickerPrefix(name);

  // Tenta sufixos numéricos de 3 a 9
  for (let suffix = 3; suffix <= 9; suffix++) {
    const ticker = `${prefix}${suffix}`;
    if (!existingTickers.has(ticker)) {
      suggestions.push(ticker);
      if (suggestions.length >= maxSuggestions) break;
    }
  }

  // Se não achou suficientes, tenta variações do prefixo
  if (suggestions.length < maxSuggestions) {
    // Adiciona letra extra do nome
    const normalized = normalizeForTicker(name);
    const extraChar = normalized.replace(/\s/g, '')[prefix.length]?.toUpperCase();
    
    if (extraChar) {
      for (let suffix = 3; suffix <= 9; suffix++) {
        const ticker = `${prefix}${extraChar}${suffix}`;
        if (!existingTickers.has(ticker) && ticker.length <= 7) {
          suggestions.push(ticker);
          if (suggestions.length >= maxSuggestions) break;
        }
      }
    }
  }

  // Se ainda não tem, usa categoria como fallback
  if (suggestions.length === 0 && category) {
    const catPrefix = category.slice(0, 2).toUpperCase();
    for (let suffix = 3; suffix <= 9; suffix++) {
      const ticker = `${catPrefix}${prefix.slice(0, 2)}${suffix}`;
      if (!existingTickers.has(ticker) && ticker.length <= 7) {
        suggestions.push(ticker);
        if (suggestions.length >= maxSuggestions) break;
      }
    }
  }

  return suggestions;
}

/**
 * Valida formato de ticker
 * Deve ter 3-7 caracteres, uppercase, alfanumérico
 */
export function validateTickerFormat(ticker: string): {
  valid: boolean;
  error?: string;
} {
  if (!ticker || ticker.trim().length === 0) {
    return { valid: false, error: 'Ticker não pode ser vazio' };
  }

  const trimmed = ticker.trim().toUpperCase();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Ticker deve ter no mínimo 3 caracteres' };
  }

  if (trimmed.length > 7) {
    return { valid: false, error: 'Ticker deve ter no máximo 7 caracteres' };
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: 'Ticker deve conter apenas letras e números' };
  }

  // Deve terminar com número (padrão bolsa)
  if (!/\d$/.test(trimmed)) {
    return { valid: false, error: 'Ticker deve terminar com um número (ex: GINT3)' };
  }

  return { valid: true };
}

// Alias para compatibilidade
export const validateTicker = validateTickerFormat;

/**
 * Normaliza ticker para formato correto
 */
export function normalizeTicker(ticker: string): string {
  return ticker.trim().toUpperCase();
}

/**
 * Verifica se ticker está disponível
 */
export function isTickerAvailable(
  ticker: string,
  existingTickers: Set<string>,
  currentProductTicker?: string
): boolean {
  const normalized = normalizeTicker(ticker);
  
  // Permite se for o ticker atual do produto sendo editado
  if (currentProductTicker && normalized === currentProductTicker.toUpperCase()) {
    return true;
  }

  return !existingTickers.has(normalized);
}
