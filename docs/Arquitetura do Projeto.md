# Arquitetura do Projeto Bar Market

## Visão Geral

Sistema de precificação dinâmica para bebidas inspirado em bolsa de valores, onde os preços variam em tempo real conforme a demanda. O projeto utiliza Next.js 16 com App Router, React 19, TypeScript e Tailwind CSS 4, priorizando uma experiência visual de terminal financeiro.

---

## Arquitetura das Páginas

### Estrutura de Rotas (Next.js App Router)

**1. Página Inicial (`/`)**
- **Arquivo**: `app/page.tsx`
- **Status**: ✅ Implementada
- **Descrição**: Landing page com três cards de navegação
  - Card "Menu Interativo" → `/menu` (azul, ícone TrendingUp)
  - Card "Telão ao Vivo" → `/telao` (verde, ícone Monitor)
  - Card "Admin Console" → `/admin` (âmbar, ícone Settings)
- **Design**: Fundo escuro (#0B0F14), cards com hover states, indicador "sistema ativo" com pulse

**2. Página Menu (`/menu`)**
- **Arquivo**: `app/menu/page.tsx`
- **Status**: ✅ Implementada
- **Pasta de componentes**: `app/menu/_components/`
- **Finalidade**: Interface para clientes visualizarem produtos e realizarem pedidos
- **Componentes**:
  - `MenuClient.tsx` - Client wrapper com state management
  - `MenuHeader.tsx` - Header fixo com busca e status de conexão
  - `CategoryTabs.tsx` - Tabs horizontais com categorias
  - `ProductList.tsx` - Grid de produtos com filtros
  - `ProductCard.tsx` - Card individual (memoizado)
  - `BuyModal.tsx` - Modal com fluxo de lock e confirmação
  - `index.ts` - Barrel exports
- **Features implementadas**:
  - Catálogo de produtos por categoria
  - Preços em tempo real via SSE
  - Sistema de lock de preços (15s TTL)
  - Fluxo completo de confirmação de pedido
  - Suporte a query param `?table=M12` para identificação de mesa
  - SessionId gerado via sessionStorage

**3. Página Telão (`/telao`)**
- **Arquivo**: `app/telao/page.tsx`
- **Status**: ✅ Implementada
- **Pasta de componentes**: `app/telao/_components/`
- **Finalidade**: Display público mostrando cotações em tempo real (estilo bolsa de valores)
- **Layout**: `h-screen overflow-hidden` (sem scroll, layout fixo)
- **Componentes**:
  - `MarketHeader.tsx` - Header compacto estilo terminal
  - `TickerTape.tsx` - Faixa animada de cotações
  - `DrinkValueBoard.tsx` - Grid tabular por categoria (componente principal)
  - `PriceFlash.tsx` - Wrapper para micro-highlight de atualização (flash verde/vermelho)
  - `MarketRanking.tsx` - Top altas, quedas e mais negociados
  - `PriceTicker.tsx` - Card individual de produto

**4. Admin Console (`/admin`)**
- **Arquivos**: `app/admin/page.tsx` e subpastas
- **Status**: ✅ Implementado
- **Pasta de componentes**: `app/admin/_components/`
- **Finalidade**: Backoffice para gestão do mercado (produtos, categorias, pedidos, monitoramento)
- **Subpáginas**:
  - `/admin` - Dashboard com estatísticas, rankings e botões de eventos de mercado
  - `/admin/products` - Lista de produtos com filtros
  - `/admin/products/new` - Criar novo produto
  - `/admin/products/[id]` - Editar produto existente
  - `/admin/categories` - Gestão de categorias
  - `/admin/pedidos` - **Painel operacional de pedidos em tempo real (Kanban)**

**5. API Routes (`/api`)**
- **Pasta**: `app/api/`
- **Status**: 🚧 Parcialmente implementadas
- **Rotas implementadas**:
  - `/api/admin/products` - GET (listar), POST (criar)
  - `/api/admin/products/:id` - GET (detalhe), PATCH (editar), DELETE (remover)
  - `/api/admin/products/:id/status` - PATCH (ativar/desativar)
  - `/api/admin/categories` - GET (listar), POST (criar)
  - `/api/admin/categories/:id` - PATCH (editar), DELETE (remover)
  - `/api/stream/precos` - GET com SSE ou fallback polling (3s tick)
  - `/api/orders/lock` - POST (cria price lock com 15s TTL)
  - `/api/orders/confirm` - POST (confirma pedido se lock válido + salva em ordersStore)
  - `/api/admin/orders` - GET (listar pedidos com filtros: status, área, mesa)
  - `/api/admin/orders/:id/status` - PATCH (atualizar status: NEW → IN_PROGRESS → READY → DELIVERED)
- **Rotas planejadas**:
  - `/api/orders/history` - Histórico de pedidos do cliente
  - `/api/admin/orders/stream` - SSE para pedidos em tempo real

**6. Layout Global**
- **Arquivo**: `app/layout.tsx`
- **Funcionalidades**:
  - Carrega JetBrains Mono local (pesos 400, 500, 600, 700)
  - Define metadados (title: "Bar Market", description, lang: "pt-BR")
  - Aplica variável CSS `--font-jetbrains-mono`

---

## Componentes do Telão (Detalhamento)

### MarketHeader
- **Tipo**: Client Component
- **Função**: Header compacto com indicadores de mercado
- **Elementos**:
  - Logo + "Market Open" (JetBrains Mono)
  - Contadores inline: ↑ Altas | ↓ Quedas | – Estáveis
  - Hora atual (HH:MM:SS) e Tick #
  - Indicador pulse verde "sistema ativo"
- **Altura**: Fixa, compacta (~48px)

### TickerTape
- **Tipo**: Client Component
- **Função**: Faixa horizontal com cotações animadas
- **Animação**: Loop infinito (CSS keyframes), pausa no hover
- **Conteúdo**: Nome | Preço | Ícone seta | Variação %
- **Velocidade**: 30s por ciclo completo
- **Posição**: Entre header e board principal

### DrinkValueBoard
- **Tipo**: Client Component
- **Função**: Grid tabular principal (substituiu cards)
- **Layout**: Grid dinâmico com colunas por categoria
- **Lógica**:
  - Agrupa produtos por `category`
  - Ordena por maior variação absoluta
  - Limita a 8 itens por coluna (calibrado para 1080p)
- **Estrutura**:
  - Título da categoria (header fixo)
  - Linhas de produtos: Nome | Preço | Seta + Delta
- **Cores**: 
  - Verde (#00E676) alta (↑)
  - Vermelho (#FF1744) queda (↓)
  - Laranja (#F59E0B) neutro (=)
- **Fonte**: JetBrains Mono para preços e deltas
- **Features**:
  - Integração com `PriceFlash` para micro-highlights
  - Hover states para interatividade

### PriceFlash
- **Tipo**: Client Component (Wrapper)
- **Função**: Detecta mudanças de preço e aplica flash visual temporário
- **Comportamento**:
  - Compara `currentValue` com `previousValue`
  - Aplica classe `flash-up` (verde) ou `flash-down` (vermelho)
  - Duração: 350ms com fade-out suave
  - Micro-pulse no valor do preço (zoom 1x → 1.05x)
- **Uso**: Envolve célula de preço no `DrinkValueBoard`
- **Opacidade**: 25% para sutileza (não distrai)
- **Objetivo**: Feedback visual de "tempo real" sem ser chamativo

### MarketRanking
- **Tipo**: Client Component
- **Função**: Rankings em 3 painéis side-by-side
- **Painéis**:
  1. Maiores Altas (top 3, ordenado por `priceChange`)
  2. Maiores Quedas (top 3, ordenado por `priceChange` negativo)
  3. Mais Negociados (top 3, proxy por `currentPriceCents`)

### PriceTicker
- **Tipo**: Client Component
- **Função**: Card individual de produto (usado no protótipo inicial)
- **Status**: Substituído por `DrinkValueBoard` no telão atual
- **Uso futuro**: Pode ser reaproveitado no `/menu`

---

## Componentes do Menu (Detalhamento)

### MenuClient
- **Tipo**: Client Component
- **Função**: Orquestrador principal da página menu
- **Responsabilidades**:
  - Gerencia estado: categoria selecionada, busca, estado do modal de compra
  - Geração/persistência de sessionId via sessionStorage
  - Extração de `?table=M12` dos query params
  - Orquestração do fluxo de compra (lock → modal → confirm)
- **Props**: Nenhuma (consome query params via `useSearchParams`)
- **State**:
  - `selectedCategory`: string (seleção atual)
  - `searchQuery`: string (termo de busca)
  - `loadingProductId`: string | null (estado de carregamento)
  - `lockData`: LockData | null (dados do lock criado)
  - `sessionId`: string (ID da sessão)

### MenuHeader
- **Tipo**: Client Component
- **Função**: Header fixo com branding e status
- **Elementos**:
  - Logo "Bar Market" em JetBrains Mono
  - Badge de mesa (`?table=M12`)
  - Indicador de conexão:
    - Verde (conectado): "Tick #X"
    - Âmbar (reconectando): "Reconectando..."
    - Vermelho (offline): "Offline"
  - Input de busca (debounce)
- **Props**: `tableId`, `searchQuery`, `onSearchChange`

### CategoryTabs
- **Tipo**: Client Component
- **Função**: Navegação por categorias
- **Elementos**:
  - Tab "Todos" (count total)
  - Tab para cada categoria com contagem de produtos
  - Scroll horizontal em mobile
  - Selected state com cor âmbar (#F59E0B)
- **Props**: `selectedCategory`, `onSelectCategory`

### ProductList
- **Tipo**: Client Component
- **Função**: Grid de produtos filtrado e ordenado
- **Lógica**:
  - Filtra por categoria selecionada
  - Filtra por termo de busca
  - Ordena: ativos primeiro, depois por variação absoluta
  - Mostra skeleton em carregamento
  - Mensagem quando nenhum resultado
- **Props**: `selectedCategory`, `searchQuery`, `loadingProductId`, `onBuy`
- **Layout**: 1 col mobile, 2+ cols em telas maiores

### ProductCard
- **Tipo**: Client Component (Memoizado)
- **Função**: Card individual com preço e ação de compra
- **Elementos**:
  - Nome do produto
  - Preço atual (JetBrains Mono, bold)
  - Indicador de variação (↑ verde, ↓ vermelho, = âmbar)
  - Botão "Comprar" com loading state
- **Props**: `product`, `isLoading`, `onBuy`
- **Performance**: Memoizado para evitar re-renders desnecessários

### BuyModal
- **Tipo**: Client Component (Modal)
- **Função**: Fluxo completo de compra com lock
- **Estados da Máquina**:
  1. `countdown` - Lock criado, aguardando confirmação com countdown
  2. `confirming` - Enviando confirmação
  3. `success` - Pedido confirmado
  4. `expired` - Lock expirou (15s)
  5. `error` - Erro na confirmação
- **Elementos**:
  - Resumo: produto, quantidade (fixa 1), preço, total
  - Contador regressivo (segundos restantes)
  - Botão "Confirmar Pedido"
  - Estados de erro com retry
- **Props**: `isOpen`, `lockData`, `sessionId`, `onClose`, `onConfirmSuccess`
- **Fluxo**:
  1. Modal abre quando `lockData` é definido
  2. Timer atualiza a cada segundo
  3. Se expira, muda para estado `expired`
  4. Confirmar dispara POST `/api/orders/confirm`
  5. Sucesso fecha modal e callback `onConfirmSuccess`

---

## Fluxo de Compra (Detalhado)

### 1. Cliente Clica "Comprar"
```
ProductCard.onBuy() 
  → MenuClient.handleBuy()
    → POST /api/orders/lock { productId, qty, sessionId, tableId }
      → Retorna { orderId, lockId, lockedPriceCents, expiresAt }
    → Abre BuyModal com lockData
```

### 2. Modal de Lock
```
BuyModal Estado: countdown
  - Exibe preço travado
  - Contador regressivo de 15s → 0s
  - Se chegar a 0: estado = expired (pode retry)
  - Botão "Confirmar Pedido"
```

### 3. Confirmação
```
BuyModal.handleConfirm()
  → Estado: confirming
  → POST /api/orders/confirm { orderId, lockId, sessionId }
    → API valida se lock ainda é válido
    → Se OK: cria Order, estado = success
    → Se expirado: estado = expired
    → Se erro: estado = error
  → Após 2s em success: fecha modal, callback onConfirmSuccess
```

### 4. SessionId e Rastreamento
```
MenuClient.getSessionId()
  → Procura em sessionStorage[bar-market-session-id]
  → Se não existe: gera `session_${timestamp}_${random}`
  → Persiste em sessionStorage (vive enquanto aba aberta)
  → Enviado em todos os lock/confirm para rastreamento
```

---

### 4. SessionId e Rastreamento
```
MenuClient.getSessionId()
  → Procura em sessionStorage[bar-market-session-id]
  → Se não existe: gera `session_${timestamp}_${random}`
  → Persiste em sessionStorage (vive enquanto aba aberta)
  → Enviado em todos os lock/confirm para rastreamento
```

---

## Sistema de Streaming em Tempo Real (SSE)

### MarketStreamProvider Context

**Localização**: `lib/context/MarketStreamContext.tsx`

**Interface**:
```typescript
interface MarketStreamContextValue {
  snapshot: MarketSnapshot | null;      // Último snapshot recebido
  isConnected: boolean;                 // SSE ativo
  isReconnecting: boolean;              // Em processo de reconexão
  error: string | null;                 // Última mensagem de erro
  lastUpdate: Date | null;              // Timestamp do último update
}

interface MarketSnapshot {
  tick: number;                         // Número do tick
  timestamp: string;                    // ISO 8601
  products: ProductWithPrice[];         // Estado de todos os produtos
}
```

**Hooks Exportados**:
- `useMarketStream()` - Acesso ao contexto completo
- `useProduct(id)` - Hook para um produto específico (future optimization)
- `useProductsByCategory(category)` - Hook para filtrar por categoria

**Comportamento**:
1. **Tentativa SSE** (EventSource)
   - Conecta a `/api/stream/precos`
   - Ouve evento `message` com JSON snapshot
   - Reconecta com backoff exponencial (max 30s)
   - Estados: `connecting` → `connected` → `reconnecting`

2. **Fallback Polling**
   - Se SSE falhar ou browser não suporta
   - Polling a cada 3 segundos para `/api/stream/precos?poll=true`
   - Mesmo JSON structure que SSE
   - Validação de mudanças antes de update state

3. **Tratamento de Erros**
   - Guarda mensagem de erro
   - Continua tentando reconectar
   - UI pode mostrar estado offline/error

### Endpoint SSE `/api/stream/precos`

**Localização**: `app/api/stream/precos/route.ts`

**Comportamento**:
```
GET /api/stream/precos
  ├─ Se header Accept: text/event-stream → SSE mode
  │    └─ Envia snapshots a cada 3s indefinidamente
  └─ Se query ?poll=true → HTTP polling mode
       └─ Retorna snapshot uma única vez com status 200
```

**Response (SSE)**:
```
data: {
  "tick": 42,
  "timestamp": "2025-12-25T14:30:00.000Z",
  "products": [
    {
      "id": "heineken-chopp",
      "name": "Chopp Heineken 300ml",
      "category": "Chopes",
      "basePriceCents": 1500,
      "currentPriceCents": 1530,
      "prevPriceCents": 1500,
      "priceChange": 2,
      "priceChangePercent": 2.0,
      "priceState": "up",
      "isActive": true
    },
    ...
  ]
}
```

**Intervalo**: 3 segundos (simulando sistema de trade com ticks)

**Simulação de Preços**:
- Variação aleatória: ±2% por tick
- Usa função `getRandomPriceVariation()` para cada produto
- Estado (`up`/`down`/`neutral`) baseado em `currentPrice vs prevPrice`

---

## Sistema de Lock de Preços

### POST `/api/orders/lock`

**Propósito**: Travamento de preço para compra segura

**Request**:
```json
{
  "productId": "heineken-chopp",
  "productName": "Chopp Heineken 300ml",
  "qty": 1,
  "currentPriceCents": 1530,
  "sessionId": "session_1703069400000_abc123xyz",
  "tableId": "M12"
}
```

**Response (200 OK)**:
```json
{
  "orderId": "order_20251225_001",
  "lockId": "lock_abc123xyz789",
  "productId": "heineken-chopp",
  "productName": "Chopp Heineken 300ml",
  "qty": 1,
  "lockedPriceCents": 1530,
  "totalCents": 1530,
  "expiresAt": "2025-12-25T14:30:15.000Z",
  "ttlSeconds": 15
}
```

**TTL**: 15 segundos (ajustável em const `TTL_SECONDS`)

**Implementação**:
- Armazena em `Map<string, PriceLock>` (em-memory, precisa Redis em prod)
- Chave: `lockId`
- Limpeza de locks expirados a cada nova requisição

---

### POST `/api/orders/confirm`

**Propósito**: Confirmar pedido se lock ainda válido

**Request**:
```json
{
  "orderId": "order_20251225_001",
  "lockId": "lock_abc123xyz789",
  "sessionId": "session_1703069400000_abc123xyz"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "orderId": "order_20251225_001",
  "message": "Pedido confirmado"
}
```

**Validações**:
1. Lock existe (`lockId` encontrado)
2. Lock não expirou (`expiresAt > now`)
3. SessionId corresponde (rastreamento)

**Response (400 Bad Request)**:
- `code: 'LOCK_EXPIRED'` - 15s já passaram
- `code: 'LOCK_NOT_FOUND'` - lockId inválido
- `code: 'INVALID_SESSION'` - sessionId mismatch

**Implementação**:
- Remove lock após sucesso (one-time use)
- Cria registro de Order via `createOrder()` do ordersStore
- Pedido fica disponível em `/admin/pedidos` automaticamente

---

## Sistema de Pedidos Operacional (Kanban)

### Página `/admin/pedidos`

**Arquivo**: `app/admin/pedidos/page.tsx`

**Propósito**: Painel operacional em tempo real para equipe de balcão, cozinha e garçons

**Componentes**:
- `OrderCard.tsx` - Card individual de pedido com ações
- `OrdersKanban.tsx` - Board Kanban com 4 colunas por status
- `OrdersFilters.tsx` - Filtros (mesa, área de preparo, entregues)
- `index.ts` - Barrel exports

### Modelo de Status (OrderStatus)

```typescript
type OrderStatus = 'NEW' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'CANCELED';
```

**Transições Válidas**:
```
NEW → IN_PROGRESS (Iniciar Preparo)
IN_PROGRESS → READY (Marcar Pronto)
READY → DELIVERED (Entregar)
READY → IN_PROGRESS (Voltar para preparo, se necessário)
NEW | IN_PROGRESS → CANCELED (Cancelar)
```

### Área de Preparo (PrepArea)

```typescript
type PrepArea = 'BAR' | 'KITCHEN';
```

**Mapeamento automático**:
- BAR: Chopes, Cervejas, Drinks, Shots (default)
- KITCHEN: Petiscos, Porções, Lanches (futuro)

Definido pela categoria do produto via `getPrepArea(category)`.

### OrderCard

**Exibe**:
- Mesa em destaque (ex: `M12`) - fonte grande
- Tempo relativo ("há 3 min", "agora")
- Lista de itens: `qty × nome` + preço
- Badge de área: 🍷 BAR (âmbar) ou 👨‍🍳 COZINHA (roxo)
- Total do pedido

**Ações contextuais**:
| Status | Botão Principal | Cor |
|--------|-----------------|-----|
| NEW | "Iniciar Preparo" | Azul |
| IN_PROGRESS | "Marcar Pronto" | Verde |
| READY | "Entregar" | Roxo |
| DELIVERED | — (estado final) | Cinza |

**Cancelar**: Disponível para NEW e IN_PROGRESS (ícone X vermelho)

### OrdersKanban

**Layout**: 4 colunas (responsivo: 1 col mobile → 4 cols desktop)

| Coluna | Status | Ícone | Cor |
|--------|--------|-------|-----|
| Novos | NEW | Clock | Âmbar (#F59E0B) |
| Em Preparo | IN_PROGRESS | Play | Azul (#2563EB) |
| Prontos | READY | CheckCircle | Verde (#00E676) |
| Entregues | DELIVERED | Truck | Cinza (#6B7280) |

**Features**:
- Contagem de pedidos por coluna
- Scroll interno por coluna
- Toggle para esconder/mostrar entregues
- Pedidos cancelados sempre ocultos

### OrdersFilters

**Filtros disponíveis**:
1. **Busca por mesa** - Input de texto
2. **Área de preparo** - Segmented: Todos | Bar | Cozinha
3. **Toggle entregues** - Mostrar/esconder coluna de entregues
4. **Contador ativo** - Total de pedidos ativos (NEW + IN_PROGRESS + READY)
5. **Botão Atualizar** - Refresh manual com indicador de loading

### Atualização em Tempo Real

**Implementação atual**: Polling a cada 3 segundos
```javascript
const POLLING_INTERVAL = 3000;
useEffect(() => {
  fetchOrders();
  const interval = setInterval(() => fetchOrders(), POLLING_INTERVAL);
  return () => clearInterval(interval);
}, [fetchOrders]);
```

**Atualização local otimista**: Ao mudar status, atualiza UI imediatamente antes da resposta da API.

**Futuro**: SSE via `/api/admin/orders/stream` para eventos:
- `ORDER_CREATED` - Novo pedido
- `ORDER_UPDATED` - Mudança de status

---

### GET `/api/admin/orders`

**Propósito**: Listar pedidos com filtros

**Query Params**:
- `status` - Filtrar por status (pode ser múltiplo: `NEW,IN_PROGRESS`)
- `prepArea` - Filtrar por área: `BAR` | `KITCHEN`
- `tableId` - Buscar por mesa (parcial)
- `countsOnly` - Se `true`, retorna apenas contagens

**Response (200 OK)**:
```json
{
  "orders": [...],
  "counts": {
    "NEW": 3,
    "IN_PROGRESS": 2,
    "READY": 1,
    "DELIVERED": 10,
    "CANCELED": 0
  },
  "total": 16
}
```

---

### PATCH `/api/admin/orders/:id/status`

**Propósito**: Avançar status do pedido

**Request**:
```json
{
  "status": "IN_PROGRESS"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "order": { ... },
  "message": "Status atualizado para IN_PROGRESS"
}
```

**Validações**:
- Pedido deve existir
- Transição de status deve ser válida (ver tabela acima)

**Response (400 Bad Request)**:
```json
{
  "error": "Transição inválida: DELIVERED → NEW",
  "currentStatus": "DELIVERED",
  "allowedTransitions": []
}
```

---

### Orders Store (`lib/stores/ordersStore.ts`)

**Propósito**: Persistência em memória de pedidos (substituir por Redis/Postgres em produção)

**Interfaces**:
```typescript
interface Order {
  id: string;              // Ex: "ORD-20251225-0001"
  sessionId: string;
  tableId: string | null;  // Ex: "M12"
  status: OrderStatus;
  items: OrderItem[];
  totalCents: number;
  createdAt: string;       // ISO 8601
  updatedAt: string;
  confirmedAt: string | null;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  priceCents: number;
  lineTotalCents: number;
  category: string;
  prepArea: PrepArea;
}
```

**Funções exportadas**:
- `createOrder(data)` - Cria pedido com ID único
- `getOrders(filters)` - Lista com filtros opcionais
- `getOrderById(id)` - Busca por ID
- `updateOrderStatus(id, status)` - Atualiza status
- `getOrderCounts()` - Contagem por status
- `cleanOldOrders()` - Limpa pedidos > 24h
- `getPrepArea(category)` - Mapeia categoria → área

---

## Componentes do Admin Console

### AdminLayout
- **Tipo**: Client Component
- **Função**: Layout wrapper para todas as páginas admin
- **Elementos**:
  - Header fixo com navegação (Dashboard, Produtos, Categorias)
  - Logo "Admin Console" com ícone Activity
  - Status "Mercado Ativo" com pulse verde
  - Botão voltar para home
- **Navegação**: Highlight da página ativa em laranja (#F59E0B)

### StatCard
- **Tipo**: Client Component
- **Função**: Card de estatística com ícone
- **Props**: title, value, icon (Lucide), color, subtitle (opcional)
- **Uso**: Dashboard para KPIs (produtos ativos, categorias, altas/quedas, tick)

### RankingPanel
- **Tipo**: Client Component
- **Função**: Painel de ranking (gainers/losers)
- **Props**: title, products, type ('gainers' | 'losers'), maxItems
- **Layout**: Lista ordenada com posição (#1, #2, #3...), nome, categoria, preço, variação
- **Border**: Borda lateral colorida (verde para gainers, vermelho para losers)

### MarketTable
- **Tipo**: Client Component
- **Função**: Tabela geral de mercado com filtros
- **Features**:
  - Busca por nome/SKU
  - Filtro por categoria (dropdown)
  - Colunas: Produto, Categoria, Base, Atual, Variação, Status
  - Contador de resultados no footer
- **Uso**: Dashboard para visão geral

### ProductsTable
- **Tipo**: Client Component
- **Função**: Tabela completa de gestão de produtos
- **Features**:
  - Busca, filtro por categoria e status (ativo/inativo)
  - Colunas: Produto, Categoria, Base, Atual, Floor, Cap, Var (Δ), Status, Ações
  - Ações: Editar (ícone Pencil), Ativar/Desativar (toggle)
  - Botão "Novo Produto" no header
- **Uso**: `/admin/products`

### ProductForm
- **Tipo**: Client Component
- **Função**: Formulário de criar/editar produto
- **Campos**:
  - Nome, SKU, Categoria (select), Descrição (textarea)
  - Preço Base, Floor (mínimo), Cap (máximo) - com R$ prefix
  - Status (toggle Ativo/Inativo)
- **Validações**:
  - floor ≤ base ≤ cap
  - floor < cap
  - Campos obrigatórios
- **Preview**: Barra visual do intervalo de oscilação (floor → base → cap)
- **Uso**: `/admin/products/new` e `/admin/products/[id]`

### CategoriesTable
- **Tipo**: Client Component
- **Função**: Tabela de gestão de categorias
- **Features**:
  - Criar nova categoria (inline form)
  - Editar nome inline (ativa campo de texto)
  - Ações: Editar, Ativar/Desativar, Excluir
  - Drag handle (GripVertical) para reordenação futura
  - Proteção: não permite excluir categoria com produtos
  - Contagem de produtos por categoria
- **Uso**: `/admin/categories`

---

## Tecnologias Utilizadas

### Core Framework
- **Next.js 16.1.1** (App Router) - SSR, Server Components
- **React 19.2.3** - Biblioteca UI
- **TypeScript 5.x** - Tipagem estática

### Estilização
- **Tailwind CSS 4.x** - Utility-first CSS
- **@tailwindcss/postcss** - Processador
- **PostCSS** - Transformação de CSS

### UI e Ícones
- **lucide-react** - Ícones (Activity, Clock, TrendingUp, TrendingDown, etc.)
- **JetBrains Mono** - Fonte monoespaçada local (terminal financeiro)

### Desenvolvimento
- **ESLint 9.x** - Linter
- **eslint-config-next** - Configuração Next.js

---

## Design System

### Paleta de Cores

**Base (Terminal Financeiro)**
- Background principal: `#0B0F14` (preto grafite)
- Background secundário: `#111827` (cinza escuro)
- Borders: `#1F2937`, `#374151`

**Texto**
- Primary: `#E5E7EB` (branco suave)
- Secondary: `#9CA3AF` (cinza claro)

**Cores Funcionais (Estado do Mercado)**
- Alta (UP): `#00E676` (verde vibrante)
- Queda (DOWN): `#FF1744` (vermelho vibrante)
- Neutro: `#F59E0B` (âmbar)
- Ação (CTA): `#2563EB` (azul financeiro)
- Sucesso: `#22C55E`
- Erro: `#EF4444`
- Disabled: `#374151`

### Tipografia

**Fonte Principal**: JetBrains Mono
- **Uso**: Todos os dados numéricos, preços, variações, hora, tick
- **Pesos disponíveis**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Classes utilitárias**:
  - `.font-market` - Base + tabular-nums
  - `.font-market-medium` - Peso 500
  - `.font-market-semibold` - Peso 600

**Hierarquia no Telão**:
- Preços principais: font-weight 600 (semibold)
- Variações e deltas: font-weight 500 (medium)
- Hora, tick, labels: font-weight 400 (regular)

**Alinhamento**:
- Preços: Sempre à direita (`text-right`)
- Números: `tabular-nums` para alinhamento consistente

### Animações

**Ticker Tape**
```css
@keyframes ticker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

**Flash de Mudança de Preço (Micro-Highlight)**
```css
@keyframes flash-up {
  0% { background-color: rgba(0, 230, 118, 0.25); }
  100% { background-color: transparent; }
}

@keyframes flash-down {
  0% { background-color: rgba(255, 23, 68, 0.25); }
  100% { background-color: transparent; }
}

@keyframes pulse-price {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 1; }
}
```

**Aplicação**:
- `.flash-up` - 350ms ease-out (verde, alta)
- `.flash-down` - 350ms ease-out (vermelho, queda)
- `.pulse-price` - 300ms ease-in-out (zoom no preço)

---

## Sistema de Dados (Mocks)

### Estrutura de Arquivos

```
data/
├── index.ts                 # Barrel export + helpers
├── products.mock.ts         # 30 produtos em 4 categorias
├── priceState.mock.ts       # Estado atual de preços
├── pricingConfig.mock.ts    # Config do motor + eventos
└── tradeEvents.mock.ts      # Ordens, locks, eventos
```

### Interfaces TypeScript

**Produtos e Preços**
```typescript
Product              // Catálogo com floor/base/cap
PriceState          // Snapshot atual (priceCents, prevPriceCents, tickSeq)
PriceHistory        // Histórico de cotações
ProductWithPrice    // Product + preço atual + variação
```

**Pedidos e Mercado**
```typescript
Order, OrderItem    // Sistema de pedidos
PriceLock          // Travamento temporário
TradeEvent         // Eventos de demanda
Table, Session     // Gestão de mesas/comandas
```

**Configuração**
```typescript
PricingConfig      // tick, decay, sensitivity, baseline
MarketEvent        // CRASH | PROMO | FREEZE
```

### Produtos Mock (35 itens)

- **Chopes**: 8 produtos (Pilsen 300ml, Chopp Colorado, Chopp Baden Baden, Chopp Eisenbahn, Chopp Brahma, Chopp Heineken, Chopp Budweiser, Pilsen 500ml)
- **Cervejas**: 8 produtos (IPA Lata, Heineken, Stella Artois, Corona, Budweiser, Brahma Duplo Malte, Eisenbahn Pilsen, Skol Beats)
- **Drinks**: 8 produtos (Gin Tônica, Caipirinha de Limão, Mojito, Cuba Libre, Caipirinha de Morango, Aperol Spritz, Margarita, Vodka Red Bull)
- **Shots**: 8 produtos (Tequila Shot, Jägermeister, Vodka Shot, Cachaça Shot, Whisky Shot, Sambuca, Absinto, Licor Beirão)
- **Promoções**: 3 produtos (combo examples - categoria legacy)

### Helpers Utilitários

```typescript
getProductsWithPrices()       // Enriquece produtos com cotação
getProductById(id)            // Busca por ID
getProductBySku(sku)          // Busca por SKU
getProductsByCategory(cat)    // Filtra por categoria
formatCurrency(cents)         // Formata para BRL
formatPriceChange(change)     // Formata variação %
```

---

## Padrões de Arquitetura

### Organização de Arquivos
- **App Router**: Roteamento por sistema de arquivos (`app/`)
- **Server Components**: Padrão (páginas)
- **Client Components**: Explícito com `'use client'` (componentes interativos)
- **Colocação**: Componentes privados em `_components/`

### Convenções de Código
- TypeScript em 100% do código
- Componentes React funcionais
- Hooks para estado (useState, useMemo)
- Props tipadas com interfaces
- Barrel exports (`index.ts`) para módulos

### CSS e Estilização
- Tailwind utility classes
- Classes customizadas em `globals.css` para animações
- Variáveis CSS para cores (`--font-jetbrains-mono`)
- Evita CSS inline complexo

---

## Estado Atual do Projeto

### ✅ Implementado

**Interface**
- [x] Página inicial com navegação (3 cards: Menu, Telão, Admin)
- [x] Telão completo com cotações em tempo real (mock)
- [x] **Página Menu** com catálogo, busca, categorias e compra
- [x] Design system (cores, fontes, animações)
- [x] Layout fixo sem scroll (h-screen)
- [x] Componentes Telão: MarketHeader, TickerTape, DrinkValueBoard, PriceFlash, MarketRanking
- [x] Componentes Menu:
  - [x] MenuClient (orquestrador)
  - [x] MenuHeader (header com status)
  - [x] CategoryTabs (navegação por categorias)
  - [x] ProductList (grid de produtos)
  - [x] ProductCard (card memoizado)
  - [x] BuyModal (fluxo de lock e confirmação)
  - [x] Index barrel exports
- [x] Admin Console completo:
  - [x] Dashboard com estatísticas, rankings e botões de eventos de mercado
  - [x] Gestão de produtos (listar, criar, editar)
  - [x] Gestão de categorias
  - [x] **Página de Pedidos** (`/admin/pedidos`) - Kanban operacional em tempo real
  - [x] Componentes admin: AdminLayout, StatCard, RankingPanel, MarketTable, ProductsTable, ProductForm, CategoriesTable
  - [x] Componentes pedidos: OrderCard, OrdersKanban, OrdersFilters

**Dados**
- [x] 35 produtos mock em 5 categorias
- [x] Sistema de tipos TypeScript completo
- [x] Helpers de formatação e consulta
- [x] Mock de price state (35 entradas), config, eventos
- [x] Indicadores de variação: ↑ (alta), ↓ (queda), = (neutro)

**Backend/API**
- [x] API Routes para admin:
  - [x] `/api/admin/products` - GET (listar), POST (criar)
  - [x] `/api/admin/products/:id` - GET, PATCH, DELETE
  - [x] `/api/admin/products/:id/status` - PATCH
  - [x] `/api/admin/categories` - GET, POST
  - [x] Validações: floor ≤ base ≤ cap
- [x] **API Routes para streaming e pedidos:**
  - [x] `/api/stream/precos` - SSE com fallback polling (3s tick)
  - [x] `/api/orders/lock` - POST (cria price lock com 15s TTL)
  - [x] `/api/orders/confirm` - POST (confirma pedido se lock válido)
  - [x] `/api/admin/orders` - GET (listar pedidos com filtros)
  - [x] `/api/admin/orders/:id/status` - PATCH (atualizar status)
- [x] **Orders Store** (`lib/stores/ordersStore.ts`):
  - [x] Persistência em memória de pedidos
  - [x] CRUD de pedidos e itens
  - [x] Mapeamento automático de área de preparo (BAR/KITCHEN)
  - [x] Funções de contagem e limpeza
- [x] **MarketStreamProvider Context**:
  - [x] SSE com reconexão automática
  - [x] Fallback para polling se SSE indisponível
  - [x] Hooks: useMarketStream(), useProduct(), useProductsByCategory()
- [x] **Session Management**:
  - [x] SessionId gerado via sessionStorage
  - [x] Persistência durante sessão (aba aberta)
  - [x] Rastreamento em lock/confirm

**Infraestrutura**
- [x] Next.js 16 + React 19 + TypeScript
- [x] Tailwind CSS 4
- [x] JetBrains Mono local (4 pesos)
- [x] ESLint configurado
- [x] Micro-highlight system (PriceFlash)

### 🚧 Pendente de Implementação

**Interface**
- [ ] Histórico de pedidos do cliente
- [ ] Toast notifications (sucesso/erro)
- [ ] Modo offline completo
- [ ] Responsividade avançada (landscape, tablets)

**Backend**
- [ ] Motor de precificação real (algoritmo de variação)
- [ ] Banco de dados (Postgres + Redis)
- [ ] API de histórico de pedidos
- [ ] Webhook de eventos de mercado
- [ ] Sistema de autenticação (mesas/QR codes)

**Features**
- [ ] Eventos de mercado (crash, promo, freeze)
- [ ] Histórico de preços para gráficos
- [ ] Persistência real (atualmente apenas mock)
- [ ] Autenticação admin (Basic Auth ou NextAuth)
- [ ] Análise de preços em tempo real

---

## Próximos Passos Técnicos

### Fase 1: Refinamento do Menu ✅ (Completo)
- [x] Implementar componentes do menu
- [x] Criar fluxo de compra com lock
- [x] Integração com SSE para preços em tempo real
- [x] Session management
- [x] Query params (?table=M12) para identificação de mesa

### Fase 1.5: Painel de Pedidos ✅ (Completo)
- [x] Criar `/admin/pedidos` com Kanban board
- [x] Implementar OrderCard, OrdersKanban, OrdersFilters
- [x] API GET `/api/admin/orders` com filtros
- [x] API PATCH `/api/admin/orders/:id/status` para transições
- [x] Orders Store em memória
- [x] Polling a cada 3s para atualização automática
- [x] Transições de status: NEW → IN_PROGRESS → READY → DELIVERED
- [x] Filtros por área (BAR/KITCHEN), mesa e status

### Fase 2: Toasts e UX Detalhes
1. Implementar Toast notification system (sucesso/erro)
   - Sucesso em compra confirmada
   - Erro em lock expirado
   - Erro em falha de conexão
2. Melhorar feedback visual
   - Estados de carregamento
   - Mensagens de erro mais descritivas
   - Indicador de reconexão em tempo real

### Fase 3: Histórico e Análise
1. Criar `/api/orders/history` para consulta de pedidos
2. Implementar página de histórico do cliente
3. Análise visual de tendências de preço
4. Gráficos de histórico por produto

### Fase 4: Motor de Precificação Real
1. Implementar algoritmo de variação (decay, sensitivity)
2. Processamento de trade events (demanda)
3. Cálculo de tick a cada X segundos
4. Integração com PriceFlash no telão
5. Limites min/max (floor/cap) por produto

### Fase 5: Persistência
1. Configurar Postgres (schema SQL)
2. Configurar Redis para locks e cache
3. Migrar APIs admin para persistência real
4. Migrar sistema de lock para Redis com TTL

### Fase 6: Autenticação
1. Autenticação de mesas (QR codes → table ID)
2. Autenticação admin (Basic Auth ou NextAuth)
3. Validação de sessão no backend
4. Rate limiting por sessão

### Fase 7: Produção
1. Deploy (Vercel + Supabase/Railway)
2. Logs e auditoria
3. Monitoramento de performance
4. Validação de fluxo end-to-end

---

## Decisões de Design (Rationale)

### Por que JetBrains Mono?
- Monoespaçada: alinhamento perfeito de números
- Legibilidade à distância (3-5 metros)
- Reforça estética de terminal financeiro
- Tabular nums nativo

### Por que layout fixo (h-screen) no telão?
- Experiência de TV/display público
- Cliente precisa escanear informação em 2 segundos
- Evita distrações de scroll
- Maximiza densidade de informação visível

### Por que cores vibrantes (#00E676, #FF1744)?
- Alto contraste em ambiente escuro (bar)
- Diferenciação instantânea alta/queda
- Estética de mercado financeiro (não cassino)
- Legibilidade à distância

### Por que grid tabular em vez de cards?
- Maior densidade de informação
- Leitura mais rápida (placar)
- Escala melhor para 35+ produtos
- Mais próximo de terminal real

### Por que micro-highlight (PriceFlash)?
- Feedback visual de "tempo real" sem distrair
- Durações curtas (300-350ms) evitam cansaço visual
- Opacidade baixa (25%) mantém legibilidade
- Reforça sensação de mercado vivo para clientes

### Por que Admin Console separado?
- Backoffice não deve competir visualmente com telão
- Permite scroll (gestão precisa de mais espaço)
- Funcionalidades complexas (CRUD, validações)
- Preparado para autenticação futura

### Por que validação floor ≤ base ≤ cap?
- Garante integridade dos limites de oscilação
- Evita configurações inválidas no motor de preços
- Previne bugs em produção (preços impossíveis)

---

## Referências de Design

O telão foi inspirado em:
- Bloomberg Terminal
- TradingView
- Pregões de bolsa de valores (NYSE, B3)
- "Drink Value Board" de bares com preço dinâmico

Princípio: **Funcionalidade > Decoração**
