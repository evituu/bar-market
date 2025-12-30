# Página Menu (/menu)

## Visão Geral

A página `/menu` é a interface principal do sistema para os clientes do bar. Ela exibe um cardápio digital com preços em tempo real, permitindo que os usuários visualizem produtos, filtrem por categoria, busquem itens específicos e façam pedidos com preços "travados" temporariamente.

## Estrutura da Página

### Arquitetura de Componentes

```
app/menu/page.tsx
├── app/menu/_components/
│   ├── MenuClient.tsx (Principal)
│   ├── MenuHeader.tsx (Cabeçalho fixo)
│   ├── CategoryTabs.tsx (Abas de categoria)
│   ├── ProductList.tsx (Lista de produtos)
│   ├── ProductCard.tsx (Cartão individual do produto)
│   ├── BuyModal.tsx (Modal de confirmação de compra)
│   └── index.ts (Exports)
```

### Arquivo Principal: `page.tsx`

```tsx
export default function MenuPage() {
  return (
    <MarketStreamProvider fallbackToPolling>
      <Suspense fallback={...}>
        <MenuClient />
      </Suspense>
    </MarketStreamProvider>
  );
}
```

**Características principais:**
- Usa `MarketStreamProvider` para receber atualizações em tempo real
- `fallbackToPolling` garante funcionamento mesmo sem WebSocket
- `Suspense` para loading states

## Componentes Detalhados

### 1. MenuClient (`MenuClient.tsx`)

**Responsabilidades:**
- Gerenciamento de estado principal da página
- Controle do fluxo de compra (lock → modal → confirmação)
- Gerenciamento de sessão do usuário
- Coordenação entre componentes filhos

**Estados gerenciados:**
- `selectedCategory`: Categoria atualmente selecionada
- `searchQuery`: Termo de busca
- `loadingProductId`: ID do produto sendo processado
- `isModalOpen`: Controle do modal de compra
- `lockData`: Dados do lock de preço
- `sessionId`: Identificador único da sessão

**Fluxo de compra:**
1. Usuário clica "Comprar" em um produto
2. `handleBuy()` chama `/api/orders/lock`
3. Sistema "trava" o preço por 30 segundos
4. Modal abre mostrando contador regressivo
5. Usuário confirma dentro do tempo limite
6. Sistema processa o pedido via `/api/orders/confirm`

### 2. MenuHeader (`MenuHeader.tsx`)

**Funcionalidades:**
- **Logo e identificação da mesa:** Exibe "Bar Market" + ID da mesa (se fornecido)
- **Status de conexão:** Mostra estado do WebSocket (conectado/reconectando/offline)
- **Contador de ticks:** Número do tick atual do mercado
- **Busca em tempo real:** Campo de busca para filtrar produtos por nome

**Parâmetros da URL:**
- `?table=mesa-01`: Identifica a mesa do cliente

### 3. CategoryTabs (`CategoryTabs.tsx`)

**Características:**
- **Dinâmico:** Categorias extraídas automaticamente dos produtos disponíveis
- **Contador:** Mostra quantidade de produtos por categoria
- **Sticky:** Fica fixo no topo durante scroll
- **Responsivo:** Scroll horizontal em dispositivos móveis

**Comportamento:**
- "Todos" mostra todos os produtos
- Outras abas filtram por categoria específica
- Destaque visual para categoria selecionada

### 4. ProductList (`ProductList.tsx`)

**Funcionalidades:**
- **Filtragem:** Por categoria e termo de busca
- **Ordenação:** Produtos ativos primeiro, depois por variação de preço
- **Estados:** Loading inicial, lista vazia, produtos filtrados

**Lógica de filtragem:**
```tsx
// Filtra por categoria
if (selectedCategory !== 'Todos') {
  products = products.filter(p => p.category === selectedCategory);
}

// Filtra por busca
if (searchQuery.trim()) {
  products = products.filter(p =>
    p.name.toLowerCase().includes(query)
  );
}
```

### 5. ProductCard (`ProductCard.tsx`)

**Elementos visuais:**
- **Ticker:** Código do produto (ex: "HEIN3") com cor baseada na variação
- **Nome do produto:** Nome completo, truncado se necessário
- **Preço atual:** Valor atual formatado em reais
- **Variação:** Seta + diferença em reais (se houve mudança)
- **Botão "Comprar":** Com loading state durante processamento

**Estados visuais:**
- Verde: Preço subiu
- Vermelho: Preço desceu
- Amarelo: Preço estável

### 6. BuyModal (`BuyModal.tsx`)

**Estados do modal:**
1. **countdown:** Mostra contador regressivo (30s) + botão confirmar
2. **confirming:** Loading durante processamento da confirmação
3. **success:** Confirmação bem-sucedida
4. **expired:** Tempo esgotado (lock expirado)
5. **error:** Erro na confirmação

**Funcionalidades:**
- **Lock de preço:** Preço garantido por 30 segundos
- **Contador visual:** Mostra tempo restante
- **Validação:** Evita confirmação após expiração
- **Feedback:** Estados visuais claros para cada situação

## Fluxo de Dados

### 1. Recebimento de Dados

**MarketStreamProvider** fornece dados em tempo real via:
- **WebSocket/SSE:** Atualizações instantâneas
- **Fallback polling:** Atualizações periódicas se WebSocket falhar

**Interface de dados:**
```typescript
interface MarketSnapshot {
  tick: number;
  timestamp: string;
  products: ProductWithPrice[];
  activeEvent?: string | null;
}
```

### 2. Gerenciamento de Sessão

**Session ID único:**
- Gerado automaticamente: `session_${timestamp}_${random}`
- Armazenado em `sessionStorage`
- Vincula pedidos à mesma sessão do usuário

### 3. Processo de Compra

**Passo 1: Lock de Preço**
```
POST /api/orders/lock
{
  productId: string,
  qty: 1,
  sessionId: string,
  tableId?: string
}
```

**Passo 2: Confirmação**
```
POST /api/orders/confirm
{
  orderId: string,
  lockId: string,
  sessionId: string
}
```

## Estados de Interface

### Estados de Loading
- **Inicial:** Spinner enquanto carrega dados do mercado
- **Compra:** Spinner no botão durante lock
- **Confirmação:** Spinner no modal durante processamento

### Estados de Erro
- **Conexão:** Modal offline com indicador visual
- **Compra:** Toast/modal de erro
- **Lock expirado:** Modal específico para timeout

### Estados de Sucesso
- **Compra confirmada:** Modal verde com checkmark
- **Auto-fechamento:** Modal fecha automaticamente após 2s

## Responsividade

### Mobile-First Design
- **Header sticky:** Fica fixo no topo
- **Tabs scrollable:** Scroll horizontal para categorias
- **Modal bottom-sheet:** Surge de baixo em mobile
- **Safe areas:** Respeita notches e áreas seguras

### Breakpoints
- **Mobile:** < 640px (interface otimizada para toque)
- **Desktop:** ≥ 640px (interface expandida)

## Recursos Técnicos

### Performance
- **Memoização:** `React.memo` nos componentes que re-renderizam frequentemente
- **Debounced search:** Busca não dispara requests excessivos
- **Virtual scrolling:** Preparado para listas grandes (futuro)

### Acessibilidade
- **ARIA labels:** Botões e inputs com labels adequados
- **Keyboard navigation:** Navegação por teclado suportada
- **Focus management:** Foco adequado nos modais

### Segurança
- **Session-based:** Pedidos vinculados a sessões únicas
- **Price locking:** Preços garantidos por tempo limitado
- **Validation:** Validações client e server-side

## Integrações

### Com o Sistema de Mercado
- Recebe atualizações de preços em tempo real
- Respeita eventos de mercado (CRASH, FREEZE, etc.)
- Mostra variações de preço visuais

### Com o Sistema de Pedidos
- Cria locks temporários de preço
- Confirma pedidos com preços garantidos
- Integra com mesas e sessões

### Com o Admin
- Produtos gerenciados via painel admin
- Categorias dinâmicas baseadas no cadastro
- Status ativo/inativo respeitado

## Considerações de UX

### Experiência do Cliente
- **Preços em tempo real:** Atualizações instantâneas
- **Compra segura:** Lock de preço evita "surpresas"
- **Interface intuitiva:** Busca, filtros e navegação clara
- **Feedback imediato:** Estados visuais para todas as ações

### Otimização para Bar
- **Interface limpa:** Foco nos produtos e preços
- **Ações rápidas:** Compra em poucos toques
- **Informações essenciais:** Nome, preço e variação
- **Responsiva:** Funciona bem em tablets e celulares
