# Arquitetura das Páginas - Bar Market

## Visão Geral

O projeto utiliza **Next.js 16 App Router** com arquitetura baseada em sistema de arquivos. Todas as páginas são **Server Components** por padrão, com **Client Components** apenas quando necessário (interatividade, estado, hooks).

---

## Estrutura de Diretórios

```
app/
├── layout.tsx                    # Layout raiz (global)
├── page.tsx                      # Página inicial (/)
├── globals.css                   # Estilos globais
│
├── menu/                         # Menu Interativo
│   ├── page.tsx                 # Página principal
│   └── _components/             # Componentes privados
│       ├── MenuClient.tsx
│       ├── MenuHeader.tsx
│       ├── CategoryTabs.tsx
│       ├── ProductList.tsx
│       ├── ProductCard.tsx
│       ├── BuyModal.tsx
│       └── index.ts
│
├── telao/                        # Telão ao Vivo
│   ├── page.tsx                 # Página principal
│   └── _components/             # Componentes privados
│       ├── MarketHeader.tsx
│       ├── TickerTape.tsx
│       ├── DrinkValueBoard.tsx
│       ├── PriceFlash.tsx
│       ├── MarketRanking.tsx
│       ├── PriceTicker.tsx
│       └── index.ts
│
├── admin/                        # Central de Operações
│   ├── page.tsx                 # Dashboard
│   ├── _components/             # Componentes compartilhados
│   │   ├── AdminLayout.tsx
│   │   ├── StatCard.tsx
│   │   ├── RankingPanel.tsx
│   │   ├── MarketTable.tsx
│   │   ├── ProductsTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── CategoriesTable.tsx
│   │   └── index.ts
│   │
│   ├── products/                # Gestão de Produtos
│   │   ├── page.tsx            # Lista de produtos
│   │   ├── new/
│   │   │   └── page.tsx        # Criar produto
│   │   └── [id]/
│   │       └── page.tsx        # Editar produto
│   │
│   ├── categories/              # Gestão de Categorias
│   │   └── page.tsx
│   │
│   └── pedidos/                 # Painel de Pedidos
│       ├── page.tsx
│       └── _components/
│           ├── OrdersKanban.tsx
│           ├── OrdersFilters.tsx
│           ├── OrderCard.tsx
│           └── index.ts
│
└── api/                          # API Routes
    ├── admin/
    ├── orders/
    └── stream/
```

---

## Layout Global

### `app/layout.tsx`

**Tipo:** Server Component  
**Função:** Layout raiz da aplicação

**Responsabilidades:**
- Carrega fonte **JetBrains Mono** local (pesos 400, 500, 600, 700)
- Define metadados globais (title, description, lang: "pt-BR")
- Aplica variável CSS `--font-jetbrains-mono`
- Define ícone da aplicação (`/logo_bar_market.svg`)

**Estrutura:**
```tsx
<html lang="pt-BR">
  <body className={`${jetBrainsMono.variable} antialiased`}>
    {children}
  </body>
</html>
```

---

## Página Inicial

### `app/page.tsx` → `/`

**Tipo:** Server Component  
**Rota:** `/`  
**Status:** ✅ Implementada

**Descrição:** Landing page com três cards de navegação para as principais áreas do sistema.

**Estrutura:**
- **Header:** Logo + título "Bar Market" + descrição
- **Cards Grid:** 3 cards responsivos (1 col mobile, 3 cols desktop)
- **Footer:** Indicador "Sistema ativo" com pulse verde

**Cards de Navegação:**

| Card | Rota | Cor | Ícone | Descrição |
|------|------|-----|-------|-----------|
| Central de Operações | `/admin` | Âmbar (#F59E0B) | Settings | Backoffice administrativo |
| Telão ao Vivo | `/telao` | Verde (#16A34A) | Monitor | Display público de cotações |
| Menu Interativo | `/menu` | Azul (#2563EB) | TrendingUp | Interface do cliente |

**Design:**
- Fundo escuro (#0B0F14)
- Cards com hover states (elevação, sombra colorida)
- Transições suaves (300ms)
- Elementos decorativos com blur

---

## Menu Interativo

### `app/menu/page.tsx` → `/menu`

**Tipo:** Server Component (wrapper)  
**Rota:** `/menu`  
**Status:** ✅ Implementada

**Descrição:** Interface para clientes visualizarem produtos e realizarem pedidos.

**Estrutura:**
- Envolvido em `MarketStreamProvider` para preços em tempo real
- `Suspense` com fallback de loading
- Renderiza `MenuClient` (Client Component)

**Componentes:**

#### `MenuClient.tsx` (Client Component)
**Função:** Orquestrador principal da página menu

**Responsabilidades:**
- Gerencia estado: categoria selecionada, busca, modal de compra
- Geração/persistência de `sessionId` via `sessionStorage`
- Extração de `?table=M12` dos query params
- Orquestração do fluxo de compra (lock → modal → confirm)

**State:**
- `selectedCategory`: string
- `searchQuery`: string
- `loadingProductId`: string | null
- `lockData`: LockData | null
- `sessionId`: string

**Features:**
- Catálogo de produtos por categoria
- Preços em tempo real via SSE
- Sistema de lock de preços (15s TTL)
- Fluxo completo de confirmação de pedido
- Suporte a query param `?table=M12` para identificação de mesa

#### `MenuHeader.tsx`
**Função:** Header fixo com branding e status

**Elementos:**
- Logo "Bar Market" em JetBrains Mono
- Badge de mesa (`?table=M12`)
- Indicador de conexão:
  - Verde (conectado): "Tick #X"
  - Âmbar (reconectando): "Reconectando..."
  - Vermelho (offline): "Offline"
- Input de busca (debounce)

#### `CategoryTabs.tsx`
**Função:** Navegação por categorias

**Elementos:**
- Tab "Todos" (count total)
- Tab para cada categoria com contagem de produtos
- Scroll horizontal em mobile
- Selected state com cor âmbar (#F59E0B)

#### `ProductList.tsx`
**Função:** Grid de produtos filtrado e ordenado

**Lógica:**
- Filtra por categoria selecionada
- Filtra por termo de busca
- Ordena: ativos primeiro, depois por variação absoluta
- Mostra skeleton em carregamento
- Mensagem quando nenhum resultado

**Layout:** 1 col mobile, 2+ cols em telas maiores

#### `ProductCard.tsx`
**Função:** Card individual com preço e ação de compra

**Elementos:**
- Nome do produto
- Preço atual (JetBrains Mono, bold)
- Indicador de variação (↑ verde, ↓ vermelho, = âmbar)
- Botão "Comprar" com loading state

**Performance:** Memoizado para evitar re-renders desnecessários

#### `BuyModal.tsx`
**Função:** Fluxo completo de compra com lock

**Estados da Máquina:**
1. `countdown` - Lock criado, aguardando confirmação com countdown
2. `confirming` - Enviando confirmação
3. `success` - Pedido confirmado
4. `expired` - Lock expirou (15s)
5. `error` - Erro na confirmação

**Elementos:**
- Resumo: produto, quantidade (fixa 1), preço, total
- Contador regressivo (segundos restantes)
- Botão "Confirmar Pedido"
- Estados de erro com retry

**Fluxo:**
1. Modal abre quando `lockData` é definido
2. Timer atualiza a cada segundo
3. Se expira, muda para estado `expired`
4. Confirmar dispara POST `/api/orders/confirm`
5. Sucesso fecha modal e callback `onConfirmSuccess`

---

## Telão ao Vivo

### `app/telao/page.tsx` → `/telao`

**Tipo:** Server Component  
**Rota:** `/telao`  
**Status:** ✅ Implementada

**Descrição:** Display público mostrando cotações em tempo real (estilo bolsa de valores).

**Layout:** `h-screen overflow-hidden` (sem scroll, layout fixo)

**Estrutura:**
```tsx
<div className="h-screen bg-[#0B0F14] flex flex-col overflow-hidden">
  <MarketHeader products={products} tickSeq={tickSeq} />
  <TickerTape products={products} />
  <DrinkValueBoard products={products} />
</div>
```

**Componentes:**

#### `MarketHeader.tsx`
**Função:** Header compacto com indicadores de mercado

**Elementos:**
- Logo + "Market Open" (JetBrains Mono)
- Contadores inline: ↑ Altas | ↓ Quedas | – Estáveis
- Hora atual (HH:MM:SS) e Tick #
- Indicador pulse verde "sistema ativo"

**Altura:** Fixa, compacta (~48px)

#### `TickerTape.tsx`
**Função:** Faixa horizontal com cotações animadas

**Animação:** Loop infinito (CSS keyframes), pausa no hover  
**Conteúdo:** Nome | Preço | Ícone seta | Variação %  
**Velocidade:** 30s por ciclo completo  
**Posição:** Entre header e board principal

#### `DrinkValueBoard.tsx`
**Função:** Grid tabular principal (substituiu cards)

**Layout:** Grid dinâmico com colunas por categoria

**Lógica:**
- Agrupa produtos por `category`
- Ordena por maior variação absoluta
- Limita a 8 itens por coluna (calibrado para 1080p)

**Estrutura:**
- Título da categoria (header fixo)
- Linhas de produtos: Nome | Preço | Seta + Delta

**Cores:**
- Verde (#00E676) alta (↑)
- Vermelho (#FF1744) queda (↓)
- Laranja (#F59E0B) neutro (=)

**Fonte:** JetBrains Mono para preços e deltas

**Features:**
- Integração com `PriceFlash` para micro-highlights
- Hover states para interatividade

#### `PriceFlash.tsx`
**Função:** Detecta mudanças de preço e aplica flash visual temporário

**Comportamento:**
- Compara `currentValue` com `previousValue`
- Aplica classe `flash-up` (verde) ou `flash-down` (vermelho)
- Duração: 350ms com fade-out suave
- Micro-pulse no valor do preço (zoom 1x → 1.05x)

**Opacidade:** 25% para sutileza (não distrai)

#### `MarketRanking.tsx`
**Função:** Rankings em 3 painéis side-by-side

**Painéis:**
1. Maiores Altas (top 3, ordenado por `priceChange`)
2. Maiores Quedas (top 3, ordenado por `priceChange` negativo)
3. Mais Negociados (top 3, proxy por `currentPriceCents`)

#### `PriceTicker.tsx`
**Status:** Substituído por `DrinkValueBoard` no telão atual  
**Uso futuro:** Pode ser reaproveitado no `/menu`

---

## Central de Operações (Admin)

### Layout Admin

#### `app/admin/_components/AdminLayout.tsx`

**Tipo:** Client Component  
**Função:** Layout wrapper para todas as páginas admin

**Elementos:**
- Header fixo com navegação (Dashboard, Produtos, Categorias, Pedidos)
- Logo "Admin Console" com ícone Activity
- Status "Mercado Ativo" com pulse verde
- Botão voltar para home

**Navegação:** Highlight da página ativa em laranja (#F59E0B)

**Itens de Navegação:**
- `/admin` - Dashboard
- `/admin/products` - Produtos
- `/admin/categories` - Categorias
- `/admin/pedidos` - Pedidos

---

### Dashboard Admin

#### `app/admin/page.tsx` → `/admin`

**Tipo:** Client Component  
**Rota:** `/admin`  
**Status:** ✅ Implementada

**Descrição:** Dashboard com estatísticas, rankings e botões de eventos de mercado.

**Componentes:**
- `StatCard` - Cards de estatísticas (produtos ativos, categorias, altas/quedas, tick)
- `RankingPanel` - Painéis de ranking (gainers/losers)
- `MarketTable` - Tabela geral de mercado com filtros

**Features:**
- Estatísticas em tempo real
- Rankings de maiores altas e quedas
- Botões de eventos de mercado (CRASH, PROMO, FREEZE)
- Tabela filtrada de produtos

---

### Gestão de Produtos

#### `app/admin/products/page.tsx` → `/admin/products`

**Tipo:** Server Component  
**Rota:** `/admin/products`  
**Status:** ✅ Implementada (integração com Prisma)

**Descrição:** Lista de produtos com filtros e ações.

**Funcionalidades:**
- Busca produtos do banco via Prisma
- Inclui `price_states` para preços atuais
- Formata dados para `ProductsTable`
- Calcula `priceChange` corretamente
- Botão "Novo Produto" no header

**Query Prisma:**
```typescript
await prisma.products.findMany({
  include: { price_states: true },
  orderBy: [
    { is_active: 'desc' },
    { category: 'asc' },
    { name: 'asc' },
  ],
});
```

**Componente:** `ProductsTable` (Client Component)

**Features:**
- Busca por nome/SKU
- Filtro por categoria e status (ativo/inativo)
- Colunas: Produto, Categoria, Base, Atual, Floor, Cap, Var (Δ), Status, Ações
- Ações: Editar (ícone Pencil), Ativar/Desativar (toggle)

---

#### `app/admin/products/new/page.tsx` → `/admin/products/new`

**Tipo:** Server Component  
**Rota:** `/admin/products/new`  
**Status:** ✅ Implementada (integração com Prisma)

**Descrição:** Página para criar novo produto.

**Funcionalidades:**
- Busca categorias do banco via `getAllCategoriesFromDB()`
- Fallback para categorias padrão se necessário
- Renderiza `ProductForm` com modo `create`

**Componente:** `ProductForm` (Client Component)

**Campos:**
- SKU (obrigatório, único)
- Ticker (obrigatório, único, formato bolsa)
- Ticker Source (AUTO | MANUAL)
- Nome (obrigatório)
- Categoria (obrigatório, select)
- Descrição (opcional, textarea)
- Preço Mínimo (Floor) - em centavos
- Preço Base - em centavos
- Preço Máximo (Cap) - em centavos
- Status (Ativo/Inativo, toggle)

**Validações:**
- Ticker: 3-7 caracteres, alfanumérico, termina com número
- Preços: `floor ≤ base ≤ cap` e `floor < cap`
- Unicidade: SKU e ticker verificados antes de salvar

**Preview:** Barra visual do intervalo de oscilação (floor → base → cap)

**Fluxo:**
1. Preenche formulário
2. Validações em tempo real
3. Submit → POST `/api/admin/products`
4. Sucesso → Redireciona para `/admin/products`

---

#### `app/admin/products/[id]/page.tsx` → `/admin/products/[id]`

**Tipo:** Server Component (planejado)  
**Rota:** `/admin/products/[id]`  
**Status:** 🚧 Pendente de implementação

**Descrição:** Página para editar produto existente.

**Planejado:**
- Busca produto por ID do banco
- Carrega dados no `ProductForm` com modo `edit`
- Submit → PATCH `/api/admin/products/[id]`

---

### Gestão de Categorias

#### `app/admin/categories/page.tsx` → `/admin/categories`

**Tipo:** Server Component  
**Rota:** `/admin/categories`  
**Status:** ✅ Implementada (usa mocks)

**Descrição:** Gestão de categorias de produtos.

**Funcionalidades:**
- Lista categorias com contagem de produtos
- Renderiza `CategoriesTable` (Client Component)

**Componente:** `CategoriesTable`

**Features:**
- Criar nova categoria (inline form)
- Editar nome inline (ativa campo de texto)
- Ações: Editar, Ativar/Desativar, Excluir
- Drag handle (GripVertical) para reordenação futura
- Proteção: não permite excluir categoria com produtos
- Contagem de produtos por categoria

**Nota:** Atualmente usa dados mock. Migração para banco pendente.

---

### Painel de Pedidos

#### `app/admin/pedidos/page.tsx` → `/admin/pedidos`

**Tipo:** Client Component  
**Rota:** `/admin/pedidos`  
**Status:** ✅ Implementada

**Descrição:** Painel operacional em tempo real para equipe de balcão, cozinha e garçons.

**Funcionalidades:**
- Polling a cada 3 segundos para atualização automática
- Filtros: mesa, área de preparo, entregues
- Atualização local otimista ao mudar status
- Contador de pedidos ativos

**Componentes:**

#### `OrdersKanban.tsx`
**Função:** Board Kanban com 4 colunas por status

**Layout:** 4 colunas (responsivo: 1 col mobile → 4 cols desktop)

| Coluna | Status | Ícone | Cor |
|--------|--------|-------|-----|
| Novos | NEW | Clock | Âmbar (#F59E0B) |
| Em Preparo | IN_PROGRESS | Play | Azul (#2563EB) |
| Prontos | READY | CheckCircle | Verde (#00E676) |
| Entregues | DELIVERED | Truck | Cinza (#6B7280) |

**Features:**
- Contagem de pedidos por coluna
- Scroll interno por coluna
- Toggle para esconder/mostrar entregues
- Pedidos cancelados sempre ocultos

#### `OrdersFilters.tsx`
**Função:** Filtros e controles

**Filtros disponíveis:**
1. **Busca por mesa** - Input de texto
2. **Área de preparo** - Segmented: Todos | Bar | Cozinha
3. **Toggle entregues** - Mostrar/esconder coluna de entregues
4. **Contador ativo** - Total de pedidos ativos (NEW + IN_PROGRESS + READY)
5. **Botão Atualizar** - Refresh manual com indicador de loading

#### `OrderCard.tsx`
**Função:** Card individual de pedido com ações

**Exibe:**
- Mesa em destaque (ex: `M12`) - fonte grande
- Tempo relativo ("há 3 min", "agora")
- Lista de itens: `qty × nome` + preço
- Badge de área: 🍷 BAR (âmbar) ou 👨‍🍳 COZINHA (roxo)
- Total do pedido

**Ações contextuais:**

| Status | Botão Principal | Cor |
|--------|-----------------|-----|
| NEW | "Iniciar Preparo" | Azul |
| IN_PROGRESS | "Marcar Pronto" | Verde |
| READY | "Entregar" | Roxo |
| DELIVERED | — (estado final) | Cinza |

**Cancelar:** Disponível para NEW e IN_PROGRESS (ícone X vermelho)

**Transições de Status:**
- NEW → IN_PROGRESS (Iniciar Preparo)
- IN_PROGRESS → READY (Marcar Pronto)
- READY → DELIVERED (Entregar)
- READY → IN_PROGRESS (Voltar para preparo, se necessário)
- NEW | IN_PROGRESS → CANCELED (Cancelar)

---

## Componentes Compartilhados

### Admin Components (`app/admin/_components/`)

#### `AdminLayout.tsx`
Layout wrapper para todas as páginas admin (já documentado acima)

#### `StatCard.tsx`
Card de estatística com ícone

**Props:**
- `title`: string
- `value`: string | number
- `icon`: Lucide icon
- `color`: string (cor do ícone)
- `subtitle?`: string (opcional)

**Uso:** Dashboard para KPIs

#### `RankingPanel.tsx`
Painel de ranking (gainers/losers)

**Props:**
- `title`: string
- `products`: ProductWithPrice[]
- `type`: 'gainers' | 'losers'
- `maxItems`: number

**Layout:** Lista ordenada com posição (#1, #2, #3...), nome, categoria, preço, variação  
**Border:** Borda lateral colorida (verde para gainers, vermelho para losers)

#### `MarketTable.tsx`
Tabela geral de mercado com filtros

**Features:**
- Busca por nome/SKU
- Filtro por categoria (dropdown)
- Colunas: Produto, Categoria, Base, Atual, Variação, Status
- Contador de resultados no footer

**Uso:** Dashboard para visão geral

#### `ProductsTable.tsx`
Tabela completa de gestão de produtos

**Features:**
- Busca, filtro por categoria e status (ativo/inativo)
- Colunas: Produto, Categoria, Base, Atual, Floor, Cap, Var (Δ), Status, Ações
- Ações: Editar (ícone Pencil), Ativar/Desativar (toggle)
- Botão "Novo Produto" no header

**Uso:** `/admin/products`

#### `ProductForm.tsx`
Formulário de criar/editar produto

**Props:**
- `categories`: string[]
- `initialData?`: objeto com dados do produto (para edição)
- `mode`: 'create' | 'edit'

**Campos:** (já documentados acima em `/admin/products/new`)

**Validações:**
- floor ≤ base ≤ cap
- floor < cap
- Campos obrigatórios
- Ticker único e válido

**Preview:** Barra visual do intervalo de oscilação (floor → base → cap)

#### `CategoriesTable.tsx`
Tabela de gestão de categorias

**Features:** (já documentadas acima em `/admin/categories`)

---

## Padrões de Arquitetura

### Server Components vs Client Components

**Server Components (padrão):**
- Páginas (`page.tsx`)
- Layouts (`layout.tsx`)
- Componentes que não precisam de interatividade

**Client Components (`'use client'`):**
- Componentes com estado (`useState`, `useEffect`)
- Componentes com hooks (`useRouter`, `useSearchParams`)
- Componentes com eventos (onClick, onChange)
- Componentes que consomem Context API

### Organização de Componentes

**Componentes privados:** `_components/`
- Componentes usados apenas dentro de uma rota específica
- Exemplo: `app/menu/_components/` → usado apenas em `/menu`

**Componentes compartilhados:** `_components/` no nível da seção
- Componentes compartilhados dentro de uma seção
- Exemplo: `app/admin/_components/` → usado em todas as páginas admin

### Barrel Exports

Cada pasta `_components/` tem um `index.ts` para barrel exports:

```typescript
// app/menu/_components/index.ts
export { MenuClient } from './MenuClient';
export { MenuHeader } from './MenuHeader';
// ...
```

**Uso:**
```typescript
import { MenuClient, MenuHeader } from './_components';
```

---

## Integração com Banco de Dados

### Páginas que usam Prisma

#### Server Components com Prisma

1. **`/admin/products`** - Lista produtos do banco
2. **`/admin/products/new`** - Busca categorias do banco

**Padrão:**
```typescript
export default async function ProductsPage() {
  const products = await prisma.products.findMany({
    include: { price_states: true },
  });
  
  return <ProductsTable products={products} />;
}
```

### Páginas que ainda usam Mocks

1. **`/admin`** - Dashboard (usa `MOCK_PRODUCTS`)
2. **`/admin/categories`** - Categorias (usa `MOCK_PRODUCTS`)
3. **`/telao`** - Telão (usa `getProductsWithPrices()` de mocks)
4. **`/menu`** - Menu (usa `MarketStreamProvider` que pode usar mocks)

**Migração pendente:** Essas páginas devem migrar para Prisma no futuro.

---

## Rotas e Navegação

### Rotas Públicas

| Rota | Página | Tipo | Status |
|------|--------|------|--------|
| `/` | Home | Server | ✅ |
| `/menu` | Menu Interativo | Server (wrapper) | ✅ |
| `/telao` | Telão ao Vivo | Server | ✅ |

### Rotas Admin

| Rota | Página | Tipo | Status |
|------|--------|------|--------|
| `/admin` | Dashboard | Client | ✅ |
| `/admin/products` | Lista Produtos | Server | ✅ |
| `/admin/products/new` | Criar Produto | Server | ✅ |
| `/admin/products/[id]` | Editar Produto | Server | 🚧 |
| `/admin/categories` | Categorias | Server | ✅ |
| `/admin/pedidos` | Pedidos | Client | ✅ |

### Query Parameters

**`/menu?table=M12`**
- Identifica a mesa do cliente
- Exibido no `MenuHeader` como badge
- Enviado em todos os pedidos

---

## Estado Atual das Páginas

### ✅ Implementadas e Funcionais

- [x] Página inicial (`/`)
- [x] Menu Interativo (`/menu`) - completo com fluxo de compra
- [x] Telão ao Vivo (`/telao`) - display público completo
- [x] Dashboard Admin (`/admin`)
- [x] Lista de Produtos (`/admin/products`) - **integração com Prisma**
- [x] Criar Produto (`/admin/products/new`) - **integração com Prisma**
- [x] Categorias (`/admin/categories`)
- [x] Pedidos (`/admin/pedidos`) - Kanban operacional

### 🚧 Pendentes de Implementação

- [ ] Editar Produto (`/admin/products/[id]`) - página existe mas vazia
- [ ] Histórico de Pedidos do Cliente
- [ ] Página de Detalhes do Produto

### 🔄 Migração Pendente (Mock → Prisma)

- [ ] Dashboard Admin (`/admin`) - migrar para Prisma
- [ ] Categorias (`/admin/categories`) - migrar para Prisma
- [ ] Telão (`/telao`) - migrar para Prisma
- [ ] Menu (`/menu`) - migrar para Prisma (via MarketStreamProvider)

---

## Metadados e SEO

### Metadados por Página

**Layout Global (`app/layout.tsx`):**
```typescript
{
  title: "Bar Market",
  description: "Bebidas com preços dinâmicos em tempo real",
  icons: { icon: "/logo_bar_market.svg" }
}
```

**Menu (`app/menu/page.tsx`):**
```typescript
{
  title: "Cardápio | Bar Market",
  description: "Cardápio de bebidas com preços em tempo real"
}
```

**Outras páginas:** Herdam metadados do layout global.

---

## Responsividade

### Breakpoints (Tailwind)

- **Mobile:** `< 768px` (1 coluna)
- **Tablet:** `≥ 768px` (2-3 colunas)
- **Desktop:** `≥ 1024px` (3-4 colunas)

### Páginas com Layout Especial

**Telão (`/telao`):**
- Layout fixo `h-screen` (sem scroll)
- Otimizado para displays públicos (1080p)
- Grid responsivo por categoria

**Menu (`/menu`):**
- Grid responsivo de produtos
- Scroll horizontal em tabs de categoria
- Modal full-screen em mobile

**Admin (`/admin/*`):**
- Layout com sidebar fixo
- Tabelas com scroll horizontal em mobile
- Cards responsivos no dashboard

---

## Performance

### Otimizações Implementadas

1. **Server Components:** Maioria das páginas são Server Components
2. **Memoização:** `ProductCard` memoizado para evitar re-renders
3. **Lazy Loading:** `Suspense` no Menu para loading states
4. **Singleton Prisma:** Prisma Client cacheado em `globalThis` (dev)
5. **Barrel Exports:** Imports otimizados via `index.ts`

### Melhorias Futuras

- [ ] Code splitting por rota
- [ ] Imagens otimizadas (Next.js Image)
- [ ] Cache de produtos no Redis
- [ ] SSR com ISR para telão

---

## Referências

- [Next.js App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Arquitetura do Projeto](./Arquitetura%20do%20Projeto.md)
- [Funcionamento da API](./Funcionamento%20da%20API.md)

