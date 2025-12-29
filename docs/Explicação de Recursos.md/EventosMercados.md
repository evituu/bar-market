# Eventos de Mercado - Bar Market

## Visão Geral

O sistema de **Eventos de Mercado** permite aos administradores controlar dinamicamente os preços dos produtos em tempo real através de eventos especiais. Esses eventos criam situações de mercado simuladas que afetam diretamente os preços exibidos no telão público, impactando a experiência dos clientes.

O sistema foi projetado para ser **profissional**, **responsivo** e **em tempo real**, garantindo que qualquer mudança nos eventos seja refletida instantaneamente no telão sem necessidade de recarregar a página.

---

## Funcionalidades Principais

### 4 Eventos de Mercado Disponíveis

#### 1. **CRASH** (Quebra de Mercado)
- **Ícone**: Raio (⚡)
- **Cor**: Vermelho (#FF1744)
- **Objetivo**: Simular uma queda generalizada nos preços
- **Duração**: Ativo até ser desativado manualmente (ou por outro evento)

#### 2. **RESET** (Restauração)
- **Ícone**: Refresh (🔄)
- **Cor**: Cinza neutro (#6B7280)
- **Objetivo**: Restaurar todos os preços para o valor base
- **Duração**: Aplicado instantaneamente

#### 3. **FREEZE** (Congelamento)
- **Ícone**: Floco de neve (❄️)
- **Cor**: Azul (#2563EB)
- **Objetivo**: Congelar preços temporariamente
- **Duração**: Ativo até ser desativado manualmente

#### 4. **MALUCO** (Oscilação Louca)
- **Ícone**: Raio animado (⚡)
- **Cor**: Roxo (#A855F7)
- **Objetivo**: Criar oscilações aleatórias e imprevisíveis
- **Duração**: Ativo até ser desativado manualmente

---

## Como Funcionam os Botões

### Interface do Usuário

Os botões estão localizados na seção **"Eventos de Mercado"** da página de administração (`/admin`).

#### Estados Visuais dos Botões

1. **Inativo**
   - Background: Cinza escuro (#1F2937)
   - Texto: Cor do evento
   - Borda: Colorida com transparência
   - Hover: Background colorido suave

2. **Ativo**
   - Background: Cor do evento
   - Texto: Branco (ou preto para eventos claros)
   - Sombra: Colorida com blur
   - Ring: Borda destacada
   - Badge: "ATIVO" no canto

3. **Carregando**
   - Opacidade reduzida (70%)
   - Cursor: `wait`
   - Ícone animado (pulse ou bounce)
   - Desabilitado temporariamente

### Interação do Usuário

#### Ativação de Evento
1. Clique no botão do evento desejado
2. Estado visual muda para "carregando"
3. Requisição HTTP é enviada para o backend
4. Estado muda para "ativo" se sucesso
5. Descrição do evento aparece abaixo dos botões

#### Desativação de Evento
1. Clique novamente no botão ativo
2. Estado visual muda para "carregando"
3. Requisição HTTP envia `event: null`
4. Estado volta para "inativo"
5. Descrição do evento desaparece

#### Regras de Exclusividade
- **Apenas um evento ativo por vez**
- Ativar um evento desativa automaticamente o anterior
- Todos os eventos são mutuamente exclusivos

---

## Recursos Técnicos Utilizados

### 1. **Banco de Dados**
- **Tabela**: `market_events`
- **Campos**:
  - `id`: UUID único
  - `type`: 'CRASH' | 'RESET' | 'FREEZE' | 'MALUCO'
  - `starts_at`: Timestamp de início
  - `ends_at`: Timestamp de término
  - `payload`: JSON com parâmetros adicionais
  - `is_active`: Boolean (apenas um pode ser true)
  - `created_at`: Timestamp de criação

### 2. **API Routes**
- **GET** `/api/admin/market-event`: Retorna evento ativo atual
- **POST** `/api/admin/market-event`: Ativa/desativa eventos

### 3. **Server-Sent Events (SSE)**
- **Endpoint**: `/api/stream/precos`
- **Função**: Stream em tempo real dos preços
- **Intervalos**:
  - **Padrão**: 3 segundos
  - **MALUCO**: 15 segundos (para oscilações dramáticas)

### 4. **React Context**
- **Provider**: `MarketStreamProvider`
- **Context**: `MarketStreamContext`
- **Hooks**: `useMarketStream()`, `useProduct()`

### 5. **Domínio de Negócios**
- **Arquivo**: `lib/domain/marketEvents.ts`
- **Funções**:
  - `getActiveMarketEvent()`: Busca evento ativo
  - `activateMarketEvent()`: Ativa evento
  - `deactivateMarketEvent()`: Desativa evento
  - `applyMarketEventToPrices()`: Aplica regras aos preços

---

## Requisitos para Funcionamento

### 1. **Banco de Dados**
- PostgreSQL conectado
- Tabela `market_events` criada via Prisma migrations
- Tabelas `products` e `price_states` populadas

### 2. **Servidor Next.js**
- App Router ativo
- API routes funcionais
- Prisma Client configurado

### 3. **Navegadores Suportados**
- SSE (Server-Sent Events) suportado
- WebSockets não necessário
- Fallback para polling HTTP se SSE falhar

### 4. **Permissões**
- Acesso à página `/admin`
- Conexão com banco de dados
- Permissões de escrita na tabela `market_events`

---

## Regras de Negócio por Evento

### CRASH (Quebra de Mercado)

#### Quando Aplicar
- Simular queda generalizada de preços
- Criar sensação de urgência nos clientes
- Testar reações do mercado

#### Como Funciona
```typescript
// Reduz preços em 20%, mas não abaixo do floor
newPrice = Math.max(product.priceFloorCents, currentPrice * 0.8)
```

#### Regras Específicas
- **Redução**: 20% do preço atual
- **Limite mínimo**: Nunca abaixo do `priceFloorCents`
- **Aplicação**: Imediata a todos os produtos ativos
- **Perspectiva**: Preços caem, mas mantêm rentabilidade mínima

#### Exemplo
- Preço atual: R$ 20,00
- Floor: R$ 15,00
- Novo preço: R$ 16,00 (20% de desconto, respeitando floor)

### RESET (Restauração)

#### Quando Aplicar
- Restaurar ordem no mercado
- Após eventos extremos (CRASH/MALUCO)
- Preparar para novo evento

#### Como Funciona
```typescript
// Restaura para preço base
newPrice = product.basePriceCents
```

#### Regras Específicas
- **Fonte**: Usa `basePriceCents` como referência
- **Aplicação**: Todos os produtos voltam ao preço original
- **Estado**: `prevPriceCents` = preço anterior ao reset
- **Perspectiva**: Retorno à estabilidade

#### Exemplo
- Preço atual: R$ 16,00 (após CRASH)
- Base: R$ 18,00
- Novo preço: R$ 18,00 (restaurado)

### FREEZE (Congelamento)

#### Quando Aplicar
- Pausar variações temporariamente
- Durante manutenção ou eventos especiais
- Manter preços estáveis por período

#### Como Funciona
```typescript
// Mantém preços inalterados
newPrice = currentPrice // sem mudanças
```

#### Regras Específicas
- **Efeito**: Nenhum - preços congelados
- **SSE**: Continua enviando snapshots, mas preços iguais
- **Duração**: Até ser desativado manualmente
- **Perspectiva**: Mercado parado no tempo

#### Exemplo
- Preço atual: R$ 18,00
- Durante FREEZE: permanece R$ 18,00
- Após desativar: variações normais continuam

### MALUCO (Oscilação Louca)

#### Quando Aplicar
- Criar agitação máxima no mercado
- Eventos promocionais especiais
- Testar sistema sob carga extrema
- Entretenimento para clientes

#### Como Funciona
```typescript
// Oscila aleatoriamente entre floor e cap a cada 15s
range = priceCapCents - priceFloorCents
randomFactor = Math.random() // 0.0 a 1.0
newPrice = priceFloorCents + (range * randomFactor)
```

#### Regras Específicas
- **Intervalo**: Mudanças a cada 15 segundos
- **Amplitude**: Entre `priceFloorCents` e `priceCapCents`
- **Aleatoriedade**: Distribuição uniforme (Math.random())
- **SSE**: Intervalo especial de 15 segundos
- **Perspectiva**: Caos total, imprevisibilidade máxima

#### Exemplo
- Floor: R$ 15,00
- Cap: R$ 30,00
- Possíveis preços: R$ 15,00, R$ 22,50, R$ 30,00, etc.

---

## Fluxo de Funcionamento Completo

### 1. Ativação de Evento (Frontend)

```typescript
// app/admin/page.tsx - handleEventClick
const handleEventClick = async (event: MarketEvent) => {
  // 1. Muda UI para "carregando"
  setEventLoading(event);

  // 2. Chama API
  const response = await fetch('/api/admin/market-event', {
    method: 'POST',
    body: JSON.stringify({ event, durationMinutes: 60 })
  });

  // 3. Atualiza UI baseada na resposta
  if (response.ok) {
    setActiveEvent(event);
  }
};
```

### 2. Persistência no Banco (API)

```typescript
// app/api/admin/market-event/route.ts - POST
export async function POST(request: NextRequest) {
  const { event } = await request.json();

  // 1. Desativa eventos anteriores
  await prisma.market_events.updateMany({
    where: { is_active: true },
    data: { is_active: false }
  });

  // 2. Cria novo evento ativo
  const newEvent = await prisma.market_events.create({
    data: {
      type: event,
      starts_at: new Date(),
      ends_at: new Date(Date.now() + 60 * 60 * 1000), // 1h
      is_active: true
    }
  });

  return NextResponse.json({ success: true });
}
```

### 3. Aplicação aos Preços (SSE)

```typescript
// app/api/stream/precos/route.ts
async function generateSnapshot() {
  // 1. Busca produtos do banco
  const products = await getProductsWithPricesFromDB();

  // 2. Busca evento ativo
  const activeEvent = await getActiveMarketEvent();

  // 3. Aplica evento aos preços
  const pricesWithEvent = applyMarketEventToPrices(products, activeEvent);

  // 4. Retorna snapshot modificado
  return {
    tick: tick,
    timestamp: new Date().toISOString(),
    products: productsWithEvent,
    activeEvent: activeEvent
  };
}
```

### 4. Atualização em Tempo Real (Telão)

```typescript
// app/telao/_components/TelaoClient.tsx
export function TelaoClient() {
  const { snapshot, isConnected } = useMarketStream();

  // Recebe atualizações automáticas via SSE
  // Preços mudam instantaneamente no telão
  return <DrinkValueBoard products={snapshot.products} />;
}
```

---

## Monitoramento e Debug

### Verificando Estado Atual

#### No Banco
```sql
-- Verificar evento ativo
SELECT * FROM market_events WHERE is_active = true;

-- Verificar preços atuais
SELECT name, price_cents, prev_price_cents FROM price_states ps
JOIN products p ON p.id = ps.product_id
WHERE p.is_active = true;
```

#### Na API
```bash
# Verificar evento ativo
curl http://localhost:3000/api/admin/market-event

# Verificar stream SSE
curl http://localhost:3000/api/stream/precos?poll=true
```

### Logs Importantes

#### Backend (Terminal)
```
[API] Evento CRASH ativado
[SSE] Enviando snapshot com evento ativo: CRASH
[MarketStream] SSE conectado - recebendo atualizações
```

#### Frontend (DevTools)
```javascript
// Verificar estado do context
console.log(useMarketStream().snapshot.activeEvent);
console.log(useMarketStream().snapshot.products[0].currentPriceCents);
```

---

## Troubleshooting

### Problema: Botões não funcionam

**Sintomas:**
- Clicar nos botões não muda visual
- Não aparece "ATIVO"
- Telão não atualiza

**Soluções:**
1. Verificar conexão com banco
2. Verificar se tabela `market_events` existe
3. Checar logs do servidor
4. Confirmar que API routes estão acessíveis

### Problema: Telão não atualiza

**Sintomas:**
- Botões mudam, mas telão fica igual
- SSE não conecta

**Soluções:**
1. Verificar se `MarketStreamProvider` está envolvido
2. Checar se SSE URL está correta (`/api/stream/precos`)
3. Confirmar que produtos existem no banco
4. Verificar CORS e permissões

### Problema: Preços não mudam

**Sintomas:**
- Botões funcionam, telão atualiza
- Mas preços permanecem iguais

**Soluções:**
1. Verificar se produtos têm `priceFloorCents` e `priceCapCents`
2. Checar se `price_states` existe para os produtos
3. Validar se evento está sendo aplicado corretamente
4. Debug: verificar retorno da função `applyMarketEventToPrices`

---

## Casos de Uso Práticos

### Cenário 1: Happy Hour
1. Administrador ativa **FREEZE** às 17:00
2. Preços ficam congelados durante o evento
3. Ativa **RESET** às 19:00 para restaurar normalidade

### Cenário 2: Evento Promocional
1. Ativa **CRASH** para criar urgência
2. Clientes correm para comprar
3. Ativa **RESET** quando estoque acaba

### Cenário 3: Entretenimento
1. Ativa **MALUCO** durante evento especial
2. Preços oscilam loucamente a cada 15 segundos
3. Cria buzz e engajamento

### Cenário 4: Manutenção
1. Ativa **FREEZE** antes de atualizar produtos
2. Realiza manutenção sem afetar clientes
3. Desativa **FREEZE** quando pronto

---

## Performance e Escalabilidade

### Otimizações Implementadas

1. **Banco**: Índices em `market_events.is_active`
2. **SSE**: Intervalos dinâmicos (3s ou 15s)
3. **Cache**: Singleton do Prisma Client
4. **Atomicidade**: Transações para eventos

### Limites e Recomendações

- **Eventos simultâneos**: Apenas 1 ativo por vez
- **Produtos**: Testado com até 50 produtos ativos
- **Conexões SSE**: Suporta múltiplas conexões simultâneas
- **Latência**: < 500ms para mudanças visuais

### Monitoramento Recomendado

- Tempo de resposta das APIs
- Número de conexões SSE ativas
- Taxa de erro de eventos
- Performance do banco durante picos

---

## Considerações de Segurança

### Validações Implementadas

1. **Tipos**: Validação de `MarketEventType`
2. **Permissões**: Acesso limitado à admin
3. **Duração**: Limitação de tempo (máx 60min)
4. **Atomicidade**: Transações impedem estados inconsistentes

### Riscos Potenciais

- **Abuso**: Eventos podem afetar vendas
- **Performance**: Múltiplos eventos simultâneos
- **Dados**: Inconsistência se transações falham

### Mitigações

- Logs completos de todas as ações
- Rollback automático em caso de erro
- Limites de tempo para eventos
- Validações em todos os endpoints

---

## Referências

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Prisma Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [React Context API](https://react.dev/reference/react/useContext)
