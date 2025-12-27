# Funcionamento da API - Bar Market

## Visão Geral

A API do Bar Market utiliza **Next.js 16 App Router** com **Server Actions** e **API Routes**, integrada com **PostgreSQL** via **Prisma 7.2.0**. O sistema foi projetado seguindo princípios de **Domain-Driven Design (DDD)**, separando regras de negócio da camada de apresentação.

---

## Arquitetura de Dados

### Stack Tecnológica

- **Next.js 16.1.1** (App Router)
- **Prisma 7.2.0** (ORM)
- **PostgreSQL** (Banco de dados)
- **@prisma/adapter-pg** (Driver Adapter)
- **pg** (Cliente PostgreSQL nativo)

### Configuração do Prisma Client

O Prisma Client é configurado em `lib/prisma.ts` usando um **singleton pattern** com **Driver Adapter**:

```typescript
import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Pool do PostgreSQL (singleton)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // máximo de conexões
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Adapter do Prisma
const adapter = new PrismaPg(pool);

// Prisma Client com adapter
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
```

**Por que usar adapter?**

Prisma 7.x requer um **adapter** (ou `accelerateUrl`) para funcionar corretamente. O adapter `@prisma/adapter-pg` conecta o Prisma Client ao pool de conexões do PostgreSQL, garantindo:

- Gerenciamento eficiente de conexões
- Suporte a transações
- Compatibilidade com Prisma 7.x
- Performance otimizada

**Cache em desenvolvimento:**

Em desenvolvimento, o Prisma Client é cacheado em `globalThis` para evitar múltiplas instâncias durante Hot Module Replacement (HMR):

```typescript
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
  global.__prismaAdapter = adapter;
  global.__prismaPool = pool;
}
```

---

## Domínio de Produtos

### Localização

`lib/domain/products.ts`

### Responsabilidades

O domínio de produtos centraliza todas as **regras de negócio** relacionadas a produtos, incluindo:

- Validações de dados
- Regras de preço
- Criação de produtos com inicialização de `price_states`
- Consultas ao banco de dados

### Interfaces Principais

```typescript
interface CreateProductInput {
  sku: string;                    // SKU único
  ticker: string;                 // Ticker único (ex: "HEIN3")
  tickerSource: 'AUTO' | 'MANUAL'; // Origem do ticker
  name: string;                   // Nome do produto
  description?: string | null;    // Descrição opcional
  category: string;                // Categoria
  isActive?: boolean;             // Status ativo/inativo
  basePriceCents: number;         // Preço base (em centavos)
  priceFloorCents: number;        // Preço mínimo (em centavos)
  priceCapCents: number;          // Preço máximo (em centavos)
}

interface CreateProductResult {
  success: boolean;
  productId?: string;
  error?: string;
  code?: string;  // Código do erro (ex: 'DUPLICATE_SKU', 'INVALID_PRICE_RANGE')
}
```

### Funções Principais

#### `validatePriceRange(floor, base, cap)`

Valida as regras de negócio para preços:

- ✅ `floor ≤ base ≤ cap`
- ✅ `floor < cap`

**Retorna:** `{ valid: boolean, error?: string }`

#### `createProduct(input)`

Cria um produto no banco de dados com **inicialização obrigatória de `price_states`**.

**Fluxo:**

1. **Validação de ticker** (formato e unicidade)
2. **Validação de preços** (floor ≤ base ≤ cap)
3. **Validação de campos obrigatórios** (SKU, nome, categoria)
4. **Verificação de unicidade** (SKU e ticker)
5. **Transaction Prisma:**
   - Cria produto em `products`
   - Cria registro inicial em `price_states`:
     - `price_cents = basePriceCents`
     - `prev_price_cents = basePriceCents`
     - `tick_seq = 0`

**Tratamento de erros:**

- `DUPLICATE_SKU` - SKU já existe
- `DUPLICATE_TICKER` - Ticker já existe
- `INVALID_TICKER` - Formato de ticker inválido
- `INVALID_PRICE_RANGE` - Violação de regras de preço
- `MISSING_SKU` - SKU não fornecido
- `MISSING_NAME` - Nome não fornecido
- `MISSING_CATEGORY` - Categoria não fornecida
- `DATABASE_ERROR` - Erro genérico do banco

**Exemplo de uso:**

```typescript
const result = await createProduct({
  sku: 'CHOPP-HEINEKEN-300',
  ticker: 'HEIN3',
  tickerSource: 'MANUAL',
  name: 'Chopp Heineken 300ml',
  description: 'Chopp gelado',
  category: 'Chopes',
  isActive: true,
  basePriceCents: 1500,
  priceFloorCents: 1000,
  priceCapCents: 2500,
});

if (result.success) {
  console.log('Produto criado:', result.productId);
} else {
  console.error('Erro:', result.error, result.code);
}
```

#### `getAllCategoriesFromDB()`

Busca todas as categorias únicas do banco de dados.

**Retorna:** `Promise<string[]>`

---

## API Routes - Produtos

### GET `/api/admin/products`

Lista todos os produtos com seus preços atuais.

**Query Parameters:**

- `category` (opcional) - Filtrar por categoria
- `isActive` (opcional) - Filtrar por status (`true`/`false`)

**Response (200 OK):**

```json
{
  "products": [
    {
      "id": "uuid",
      "sku": "CHOPP-HEINEKEN-300",
      "ticker": "HEIN3",
      "tickerSource": "MANUAL",
      "name": "Chopp Heineken 300ml",
      "description": "Chopp gelado",
      "category": "Chopes",
      "isActive": true,
      "basePriceCents": 1500,
      "priceFloorCents": 1000,
      "priceCapCents": 2500,
      "currentPriceCents": 1500,
      "prevPriceCents": 1500,
      "tickSeq": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Ordenação:**

1. Produtos ativos primeiro (`is_active DESC`)
2. Por categoria (`category ASC`)
3. Por nome (`name ASC`)

**Inclusão de `price_states`:**

A API automaticamente inclui o estado de preço atual via `include: { price_states: true }`. Se não existir, usa o `basePriceCents` como fallback.

---

### POST `/api/admin/products`

Cria um novo produto no banco de dados.

**Request Body:**

```json
{
  "sku": "CHOPP-HEINEKEN-300",
  "ticker": "HEIN3",
  "tickerSource": "MANUAL",
  "name": "Chopp Heineken 300ml",
  "description": "Chopp gelado",
  "category": "Chopes",
  "isActive": true,
  "basePriceCents": 1500,
  "priceFloorCents": 1000,
  "priceCapCents": 2500
}
```

**Validações:**

1. **Tipos numéricos:** Todos os preços devem ser números positivos
2. **Campos obrigatórios:** SKU, ticker, nome, categoria
3. **Formato de ticker:** 3-7 caracteres, alfanumérico, termina com número
4. **Unicidade:** SKU e ticker devem ser únicos
5. **Range de preços:** `floor ≤ base ≤ cap` e `floor < cap`

**Response (201 Created):**

```json
{
  "product": {
    "id": "uuid",
    "sku": "CHOPP-HEINEKEN-300",
    "ticker": "HEIN3",
    "tickerSource": "MANUAL",
    "name": "Chopp Heineken 300ml",
    "description": "Chopp gelado",
    "category": "Chopes",
    "isActive": true,
    "basePriceCents": 1500,
    "priceFloorCents": 1000,
    "priceCapCents": 2500,
    "currentPriceCents": 1500,
    "prevPriceCents": 1500,
    "tickSeq": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**

```json
{
  "error": "SKU \"CHOPP-HEINEKEN-300\" já está em uso",
  "code": "DUPLICATE_SKU"
}
```

**Códigos de erro possíveis:**

- `DUPLICATE_SKU` - SKU já existe
- `DUPLICATE_TICKER` - Ticker já existe
- `INVALID_TICKER` - Formato de ticker inválido
- `INVALID_PRICE_RANGE` - Violação de regras de preço
- `MISSING_SKU` - SKU não fornecido
- `MISSING_NAME` - Nome não fornecido
- `MISSING_CATEGORY` - Categoria não fornecida

**Inicialização de `price_states`:**

Ao criar um produto, um registro correspondente é **automaticamente criado** em `price_states`:

- `product_id` = ID do produto criado
- `price_cents` = `basePriceCents` (preço atual = preço base)
- `prev_price_cents` = `basePriceCents` (preço anterior = preço base)
- `tick_seq` = `0` (sequência de tick inicial)

Isso garante que:
- O telão (`/telao`) tenha dados desde o primeiro tick
- O menu (`/menu`) exiba preços corretos
- O motor de precificação tenha estado inicial consistente

---

## Fluxo Completo de Criação de Produto

### 1. Frontend (`/admin/products/new`)

**Página:** `app/admin/products/new/page.tsx`

- Server Component que busca categorias do banco
- Renderiza `ProductForm` com categorias disponíveis

**Componente:** `app/admin/_components/ProductForm.tsx`

- Formulário completo com validações em tempo real
- Campos: SKU, Ticker (AUTO/MANUAL), Nome, Categoria, Descrição, Preços
- Preview visual do intervalo de oscilação (floor → base → cap)
- Validação de ticker com sugestões automáticas
- Validação de range de preços antes do submit

### 2. Submit do Formulário

```typescript
// ProductForm.tsx
const response = await fetch('/api/admin/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sku: sku.trim(),
    ticker: normalizeTicker(ticker),
    tickerSource,
    name: name.trim(),
    description: description.trim() || null,
    category: category.trim(),
    isActive,
    basePriceCents: Math.round(basePriceCents),
    priceFloorCents: Math.round(priceFloorCents),
    priceCapCents: Math.round(priceCapCents),
  }),
});
```

### 3. API Route (`POST /api/admin/products`)

**Arquivo:** `app/api/admin/products/route.ts`

1. Recebe e valida tipos dos dados
2. Converte valores monetários para centavos (inteiros)
3. Chama `createProduct()` do domínio
4. Retorna produto criado ou erro

### 4. Domínio (`createProduct()`)

**Arquivo:** `lib/domain/products.ts`

1. Valida ticker (formato e unicidade)
2. Valida range de preços
3. Valida campos obrigatórios
4. Verifica unicidade de SKU e ticker
5. **Transaction Prisma:**
   ```typescript
   await prisma.$transaction(async (tx) => {
     // Cria produto
     const product = await tx.products.create({ ... });
     
     // Inicializa price_states
     await tx.price_states.create({
       product_id: product.id,
       price_cents: input.basePriceCents,
       prev_price_cents: input.basePriceCents,
       tick_seq: BigInt(0),
     });
     
     return product;
   });
   ```

### 5. Resposta e Redirecionamento

- Sucesso: Redireciona para `/admin/products` após 1.5s
- Erro: Exibe mensagem de erro no formulário

---

## Validações e Regras de Negócio

### Ticker

**Formato válido:**
- 3-7 caracteres
- Alfanumérico (A-Z, 0-9)
- Deve terminar com número (ex: `HEIN3`, `GINT4`)
- Uppercase automático

**Validação:** `lib/utils/ticker.ts` → `validateTickerFormat()`

**Sugestões automáticas:** `generateTickerSuggestions()` baseado no nome do produto

### Preços

**Regras obrigatórias:**

1. `priceFloorCents ≤ basePriceCents ≤ priceCapCents`
2. `priceFloorCents < priceCapCents`
3. Todos os valores devem ser números positivos (inteiros, em centavos)

**Validação:** `lib/domain/products.ts` → `validatePriceRange()`

### Unicidade

- **SKU:** Deve ser único na tabela `products`
- **Ticker:** Deve ser único na tabela `products`

**Verificação:** Antes de criar, consulta o banco para verificar duplicatas.

---

## Inicialização de `price_states`

### Por que é obrigatório?

O sistema de precificação dinâmica depende de `price_states` para:

- Exibir preços atuais no telão (`/telao`)
- Mostrar preços no menu (`/menu`)
- Calcular variações de preço
- Processar ticks do motor de precificação

### Quando é criado?

**Automaticamente** ao criar um produto via `createProduct()`.

### Valores iniciais

```typescript
{
  product_id: product.id,
  price_cents: basePriceCents,      // Preço atual = preço base
  prev_price_cents: basePriceCents,  // Preço anterior = preço base
  tick_seq: BigInt(0),                // Sequência inicial = 0
  updated_at: new Date()
}
```

### Garantia de atomicidade

A criação de produto e `price_states` acontece em uma **transaction Prisma**, garantindo que:

- Se `price_states` falhar, o produto não é criado
- Se o produto falhar, `price_states` não é criado
- Ambos são criados juntos ou nenhum é criado (ACID)

---

## Estrutura do Banco de Dados

### Tabela `products`

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) UNIQUE NOT NULL,
  ticker VARCHAR(7) UNIQUE NOT NULL,
  ticker_source VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  base_price_cents INTEGER NOT NULL,
  price_floor_cents INTEGER NOT NULL,
  price_cap_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Índices:**
- `idx_products_sku` (sku)
- `idx_products_ticker` (ticker)
- `idx_products_category` (category)
- `idx_products_is_active` (is_active)

### Tabela `price_states`

```sql
CREATE TABLE price_states (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL,
  prev_price_cents INTEGER NOT NULL,
  tick_seq BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Índices:**
- `idx_price_states_tick_seq` (tick_seq)
- `idx_price_states_updated_at` (updated_at)

**Relacionamento:**
- `price_states.product_id` → `products.id` (1:1, obrigatório)

---

## Tratamento de Erros

### Erros de Validação (400 Bad Request)

Todos os erros de validação retornam código HTTP 400 com estrutura:

```json
{
  "error": "Mensagem descritiva do erro",
  "code": "CODIGO_DO_ERRO"
}
```

**Códigos de erro:**

| Código | Descrição |
|--------|-----------|
| `DUPLICATE_SKU` | SKU já está em uso |
| `DUPLICATE_TICKER` | Ticker já está em uso |
| `INVALID_TICKER` | Formato de ticker inválido |
| `INVALID_PRICE_RANGE` | Violação de regras de preço |
| `MISSING_SKU` | SKU não fornecido |
| `MISSING_NAME` | Nome não fornecido |
| `MISSING_CATEGORY` | Categoria não fornecida |

### Erros de Banco de Dados (500 Internal Server Error)

Erros inesperados do Prisma são capturados e retornam:

```json
{
  "error": "Erro ao processar requisição"
}
```

**Logs:** Erros são logados no console para debugging.

---

## Exemplos de Uso

### Criar Produto via API

```bash
curl -X POST http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "CHOPP-HEINEKEN-300",
    "ticker": "HEIN3",
    "tickerSource": "MANUAL",
    "name": "Chopp Heineken 300ml",
    "description": "Chopp gelado",
    "category": "Chopes",
    "isActive": true,
    "basePriceCents": 1500,
    "priceFloorCents": 1000,
    "priceCapCents": 2500
  }'
```

### Listar Produtos Ativos

```bash
curl "http://localhost:3000/api/admin/products?isActive=true"
```

### Listar Produtos por Categoria

```bash
curl "http://localhost:3000/api/admin/products?category=Chopes"
```

---

## Boas Práticas

### 1. Sempre use a função de domínio

❌ **Errado:**
```typescript
// Criar produto diretamente no Prisma
await prisma.products.create({ ... });
```

✅ **Correto:**
```typescript
// Usar função de domínio
await createProduct({ ... });
```

### 2. Validações no domínio

Todas as validações de negócio devem estar em `lib/domain/products.ts`, não nas API Routes.

### 3. Transactions para operações atômicas

Use `prisma.$transaction()` quando precisar garantir atomicidade (ex: criar produto + price_states).

### 4. Tratamento de erros consistente

Sempre retorne códigos de erro descritivos e mensagens claras para o frontend.

### 5. Preços sempre em centavos

Nunca trabalhe com valores decimais. Converta para centavos antes de salvar no banco.

---

## Próximos Passos

### Melhorias Futuras

1. **Migração de outras APIs:** Migrar `/api/admin/products/:id` (PATCH, DELETE) para usar Prisma
2. **Cache:** Implementar cache de produtos usando Redis
3. **Paginação:** Adicionar paginação na listagem de produtos
4. **Busca avançada:** Implementar busca full-text por nome/descrição
5. **Auditoria:** Adicionar logs de criação/edição de produtos
6. **Validação de categoria:** Criar tabela `categories` e validar FK

---

## Referências

- [Prisma 7.x Documentation](https://www.prisma.io/docs)
- [Prisma Adapter PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

