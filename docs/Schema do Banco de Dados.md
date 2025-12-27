# Schema do Banco de Dados - Bar Market

Este documento descreve o esquema completo do banco de dados PostgreSQL para o sistema Bar Market (Bolsa de Bebidas).

## 📊 Visão Geral

O sistema é composto por 11 tabelas principais que gerenciam:
- **Produtos e Categorias**: Catálogo de bebidas
- **Precificação Dinâmica**: Estado de preços em tempo real
- **Pedidos e Vendas**: Fluxo completo de compras
- **Sessões e Mesas**: Controle de atendimento
- **Configurações**: Parâmetros do sistema

---

## 🗂️ Tabelas

### 1. `products` - Produtos (Bebidas)

Armazena o catálogo completo de produtos do bar.

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) NOT NULL UNIQUE,
  ticker VARCHAR(7) NOT NULL UNIQUE,
  ticker_source VARCHAR(10) NOT NULL CHECK (ticker_source IN ('AUTO', 'MANUAL')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
  price_floor_cents INTEGER NOT NULL CHECK (price_floor_cents > 0),
  price_cap_cents INTEGER NOT NULL CHECK (price_cap_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_price_range CHECK (
    price_floor_cents <= base_price_cents AND 
    base_price_cents <= price_cap_cents
  )
);

-- Índices
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_ticker ON products(ticker);
CREATE INDEX idx_products_sku ON products(sku);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE products IS 'Catálogo de produtos (bebidas) do bar';
COMMENT ON COLUMN products.ticker IS 'Símbolo de bolsa (ex: GINT3, CHOP4) - exibido no telão';
COMMENT ON COLUMN products.ticker_source IS 'Origem do ticker: AUTO (gerado) ou MANUAL (editado pelo admin)';
COMMENT ON COLUMN products.base_price_cents IS 'Preço base em centavos (ponto de equilíbrio)';
COMMENT ON COLUMN products.price_floor_cents IS 'Preço mínimo permitido em centavos';
COMMENT ON COLUMN products.price_cap_cents IS 'Preço máximo permitido em centavos';
```

**Campos:**
- `id`: Identificador único (UUID)
- `sku`: Código único do produto (Stock Keeping Unit)
- `ticker`: Símbolo de bolsa (3-7 caracteres, ex: GINT3, CHOP4) - **único no sistema**
- `ticker_source`: Origem do ticker (AUTO = gerado automaticamente, MANUAL = editado pelo admin)
- `name`: Nome do produto
- `description`: Descrição detalhada (opcional)
- `category`: Categoria (Chopes, Cervejas, Drinks, Shots, etc.)
- `is_active`: Se o produto está ativo para venda
- `base_price_cents`: Preço base em centavos
- `price_floor_cents`: Preço mínimo permitido (floor)
- `price_cap_cents`: Preço máximo permitido (cap)
- `created_at`: Data de criação
- `updated_at`: Data de última atualização

**Constraints:**
- Ticker único no sistema
- SKU único no sistema
- Floor ≤ Base ≤ Cap

---

### 2. `price_states` - Estado Atual de Preços

Armazena o preço atual de cada produto (atualizado a cada tick do mercado).

```sql
CREATE TABLE price_states (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  prev_price_cents INTEGER NOT NULL CHECK (prev_price_cents > 0),
  tick_seq BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_price_states_tick_seq ON price_states(tick_seq);
CREATE INDEX idx_price_states_updated_at ON price_states(updated_at);

-- Comentários
COMMENT ON TABLE price_states IS 'Estado atual de preços de cada produto (atualizado em tempo real)';
COMMENT ON COLUMN price_states.price_cents IS 'Preço atual em centavos';
COMMENT ON COLUMN price_states.prev_price_cents IS 'Preço anterior em centavos (para mostrar variação)';
COMMENT ON COLUMN price_states.tick_seq IS 'Sequência do tick de mercado (incrementa a cada atualização)';
```

**Campos:**
- `product_id`: FK para products (PK)
- `price_cents`: Preço atual em centavos
- `prev_price_cents`: Preço anterior (para calcular variação ↑↓)
- `tick_seq`: Sequência do tick de mercado (incrementa a cada atualização)
- `updated_at`: Timestamp da última atualização

**Relacionamentos:**
- 1:1 com `products`

---

### 3. `price_history` - Histórico de Preços

Armazena snapshots históricos dos preços para análises e gráficos.

```sql
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  tick_seq BIGINT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);
CREATE INDEX idx_price_history_product_recorded ON price_history(product_id, recorded_at DESC);

-- Particionamento por data (recomendado para produção)
-- CREATE TABLE price_history_2025_01 PARTITION OF price_history
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

COMMENT ON TABLE price_history IS 'Histórico de variação de preços ao longo do tempo';
COMMENT ON COLUMN price_history.tick_seq IS 'Sequência do tick quando o preço foi registrado';
```

**Campos:**
- `id`: Identificador sequencial
- `product_id`: FK para products
- `price_cents`: Preço em centavos no momento
- `tick_seq`: Sequência do tick
- `recorded_at`: Timestamp do registro

**Relacionamentos:**
- N:1 com `products`

**Observações:**
- Considerar particionamento por data para performance
- Útil para gráficos de evolução de preços

---

### 4. `trade_events` - Eventos de Negociação

Registra todas as transações de compra (trades) realizadas.

```sql
CREATE TABLE trade_events (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_trade_events_product_id ON trade_events(product_id);
CREATE INDEX idx_trade_events_order_id ON trade_events(order_id);
CREATE INDEX idx_trade_events_created_at ON trade_events(created_at DESC);
CREATE INDEX idx_trade_events_product_created ON trade_events(product_id, created_at DESC);

COMMENT ON TABLE trade_events IS 'Histórico de todas as transações (compras) realizadas';
COMMENT ON COLUMN trade_events.qty IS 'Quantidade vendida';
COMMENT ON COLUMN trade_events.price_cents IS 'Preço unitário no momento da venda';
```

**Campos:**
- `id`: Identificador sequencial
- `product_id`: FK para products
- `order_id`: FK para orders (pode ser NULL)
- `qty`: Quantidade vendida
- `price_cents`: Preço unitário no momento da venda
- `created_at`: Timestamp da transação

**Relacionamentos:**
- N:1 com `products`
- N:1 com `orders` (opcional)

**Uso:**
- Alimenta o algoritmo de precificação dinâmica
- Base para relatórios de vendas

---

### 5. `tables` - Mesas do Bar

Cadastro de mesas físicas do estabelecimento.

```sql
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_tables_code ON tables(code);
CREATE INDEX idx_tables_is_active ON tables(is_active);

COMMENT ON TABLE tables IS 'Mesas físicas do bar';
COMMENT ON COLUMN tables.code IS 'Código/número da mesa (ex: M01, MESA-05)';
```

**Campos:**
- `id`: Identificador único (UUID)
- `code`: Código da mesa (ex: "M01", "MESA-10")
- `is_active`: Se a mesa está ativa
- `created_at`: Data de cadastro

**Constraints:**
- Código único

---

### 6. `sessions` - Sessões de Atendimento

Representa uma sessão de consumo (abertura até fechamento da conta).

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_sessions_table_id ON sessions(table_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_opened_at ON sessions(opened_at DESC);

COMMENT ON TABLE sessions IS 'Sessões de atendimento (do início ao fechamento da conta)';
COMMENT ON COLUMN sessions.status IS 'Status: ACTIVE (em andamento) ou CLOSED (conta fechada)';
```

**Campos:**
- `id`: Identificador único (UUID)
- `table_id`: FK para tables (opcional, para consumo no balcão)
- `status`: ACTIVE | CLOSED
- `opened_at`: Timestamp de abertura
- `closed_at`: Timestamp de fechamento (NULL se ACTIVE)

**Relacionamentos:**
- N:1 com `tables` (opcional)

---

### 7. `orders` - Pedidos

Pedidos realizados pelos clientes.

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'CONFIRMED', 'CANCELED', 'EXPIRED')
  ),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_session_status ON orders(session_id, status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE orders IS 'Pedidos realizados pelos clientes';
COMMENT ON COLUMN orders.status IS 'PENDING (aguardando), CONFIRMED (confirmado), CANCELED (cancelado), EXPIRED (expirado)';
COMMENT ON COLUMN orders.total_cents IS 'Valor total do pedido em centavos';
```

**Campos:**
- `id`: Identificador único (UUID)
- `session_id`: FK para sessions (opcional)
- `status`: PENDING | CONFIRMED | CANCELED | EXPIRED
- `total_cents`: Valor total em centavos
- `currency`: Moeda (padrão BRL)
- `created_at`: Data de criação
- `confirmed_at`: Data de confirmação
- `canceled_at`: Data de cancelamento
- `updated_at`: Data de última atualização

**Relacionamentos:**
- N:1 com `sessions` (opcional)

**Status Flow:**
```
PENDING → CONFIRMED (sucesso)
PENDING → CANCELED (cancelado pelo usuário)
PENDING → EXPIRED (timeout do lock)
```

---

### 8. `order_items` - Itens do Pedido

Produtos incluídos em cada pedido.

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  locked_price_cents INTEGER NOT NULL CHECK (locked_price_cents > 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

COMMENT ON TABLE order_items IS 'Itens (produtos) de cada pedido';
COMMENT ON COLUMN order_items.locked_price_cents IS 'Preço unitário travado no momento da compra';
COMMENT ON COLUMN order_items.line_total_cents IS 'Total da linha (qty × locked_price_cents)';
```

**Campos:**
- `id`: Identificador único (UUID)
- `order_id`: FK para orders
- `product_id`: FK para products
- `qty`: Quantidade
- `locked_price_cents`: Preço unitário travado
- `line_total_cents`: Total da linha (qty × locked_price_cents)
- `created_at`: Data de criação

**Relacionamentos:**
- N:1 com `orders`
- N:1 com `products`

---

### 9. `price_locks` - Travamento de Preços

Gerencia os locks de preço durante o checkout (3 minutos para confirmar).

```sql
CREATE TABLE price_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  locked_price_cents INTEGER NOT NULL CHECK (locked_price_cents > 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
    status IN ('ACTIVE', 'USED', 'EXPIRED', 'CANCELED')
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_price_locks_order_id ON price_locks(order_id);
CREATE INDEX idx_price_locks_product_id ON price_locks(product_id);
CREATE INDEX idx_price_locks_status ON price_locks(status);
CREATE INDEX idx_price_locks_expires_at ON price_locks(expires_at);

COMMENT ON TABLE price_locks IS 'Travamentos de preço durante checkout (3 minutos para confirmar)';
COMMENT ON COLUMN price_locks.status IS 'ACTIVE (válido), USED (usado), EXPIRED (expirado), CANCELED (cancelado)';
COMMENT ON COLUMN price_locks.expires_at IS 'Data/hora de expiração do lock (normalmente +3 minutos)';
```

**Campos:**
- `id`: Identificador único (UUID)
- `order_id`: FK para orders
- `product_id`: FK para products
- `qty`: Quantidade travada
- `locked_price_cents`: Preço travado
- `expires_at`: Data/hora de expiração
- `status`: ACTIVE | USED | EXPIRED | CANCELED
- `created_at`: Data de criação do lock
- `used_at`: Data de uso (quando confirmado)

**Relacionamentos:**
- N:1 com `orders`
- N:1 com `products`

**Observações:**
- Lock tem validade de 3 minutos (TTL)
- Deve haver job que expira locks automaticamente

---

### 10. `pricing_config` - Configuração de Precificação

Parâmetros do algoritmo de precificação dinâmica.

```sql
CREATE TABLE pricing_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  tick_seconds INTEGER NOT NULL DEFAULT 3 CHECK (tick_seconds > 0),
  decay DECIMAL(5,4) NOT NULL DEFAULT 0.95 CHECK (decay > 0 AND decay <= 1),
  sensitivity_k DECIMAL(6,4) NOT NULL DEFAULT 0.02 CHECK (sensitivity_k >= 0),
  baseline DECIMAL(6,4) NOT NULL DEFAULT 0.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT single_row_config CHECK (id = 1)
);

-- Inserir configuração padrão
INSERT INTO pricing_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE pricing_config IS 'Configuração global do algoritmo de precificação dinâmica';
COMMENT ON COLUMN pricing_config.tick_seconds IS 'Intervalo de atualização de preços (segundos)';
COMMENT ON COLUMN pricing_config.decay IS 'Fator de decaimento (0-1) - quanto menor, mais rápido volta ao baseline';
COMMENT ON COLUMN pricing_config.sensitivity_k IS 'Sensibilidade do algoritmo (>0) - quanto maior, mais reage a vendas';
COMMENT ON COLUMN pricing_config.baseline IS 'Linha de base de demanda (normalmente 0)';
```

**Campos:**
- `id`: Sempre 1 (tabela singleton)
- `tick_seconds`: Intervalo entre updates (segundos)
- `decay`: Fator de decaimento (0-1)
- `sensitivity_k`: Sensibilidade a vendas
- `baseline`: Linha de base
- `updated_at`: Data de última atualização

**Observações:**
- Tabela singleton (apenas 1 linha)
- Parâmetros do algoritmo de precificação

---

### 11. `market_events` - Eventos de Mercado

Eventos especiais que afetam o mercado (Crash, Promoções, etc).

```sql
CREATE TABLE market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('CRASH', 'PROMO', 'FREEZE', 'HAPPY_HOUR')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_event_period CHECK (ends_at > starts_at)
);

-- Índices
CREATE INDEX idx_market_events_type ON market_events(type);
CREATE INDEX idx_market_events_starts_at ON market_events(starts_at);
CREATE INDEX idx_market_events_ends_at ON market_events(ends_at);
CREATE INDEX idx_market_events_active ON market_events(is_active);
CREATE INDEX idx_market_events_payload ON market_events USING gin(payload);

COMMENT ON TABLE market_events IS 'Eventos especiais de mercado (crash, promoções, happy hour)';
COMMENT ON COLUMN market_events.type IS 'Tipo: CRASH (quebra), PROMO (promoção), FREEZE (congelamento), HAPPY_HOUR';
COMMENT ON COLUMN market_events.payload IS 'Dados JSON específicos do evento (ex: desconto, categorias afetadas)';
```

**Campos:**
- `id`: Identificador único (UUID)
- `type`: CRASH | PROMO | FREEZE | HAPPY_HOUR
- `starts_at`: Data/hora de início
- `ends_at`: Data/hora de término
- `payload`: JSON com parâmetros do evento
- `is_active`: Se o evento está ativo
- `created_at`: Data de criação

**Exemplos de Payload:**
```json
// PROMO
{
  "discount": 0.15,
  "categories": ["Chopes", "Cervejas"]
}

// CRASH
{
  "impact_factor": 0.5,
  "affected_products": ["prod-1", "prod-2"]
}

// HAPPY_HOUR
{
  "discount": 0.30,
  "categories": ["Drinks"]
}
```

---

## 🔄 Relacionamentos Entre Tabelas

```
products (1) ←→ (1) price_states
products (1) ←→ (N) price_history
products (1) ←→ (N) trade_events
products (1) ←→ (N) order_items
products (1) ←→ (N) price_locks

tables (1) ←→ (N) sessions

sessions (1) ←→ (N) orders

orders (1) ←→ (N) order_items
orders (1) ←→ (N) price_locks
orders (1) ←→ (N) trade_events

pricing_config (singleton) - tabela de configuração única
market_events (independente) - eventos globais
```

---

## 🚀 Script Completo de Criação

Para facilitar, aqui está o script completo de criação do banco:

```sql
-- ============================================================
-- BAR MARKET - SCHEMA COMPLETO DO BANCO DE DADOS
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca textual

-- ============================================================
-- 1. TABELA: products
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(100) NOT NULL UNIQUE,
  ticker VARCHAR(7) NOT NULL UNIQUE,
  ticker_source VARCHAR(10) NOT NULL CHECK (ticker_source IN ('AUTO', 'MANUAL')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
  price_floor_cents INTEGER NOT NULL CHECK (price_floor_cents > 0),
  price_cap_cents INTEGER NOT NULL CHECK (price_cap_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT check_price_range CHECK (
    price_floor_cents <= base_price_cents AND 
    base_price_cents <= price_cap_cents
  )
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_ticker ON products(ticker);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- ============================================================
-- 2. TABELA: price_states
-- ============================================================

CREATE TABLE price_states (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  prev_price_cents INTEGER NOT NULL CHECK (prev_price_cents > 0),
  tick_seq BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_states_tick_seq ON price_states(tick_seq);
CREATE INDEX idx_price_states_updated_at ON price_states(updated_at);

-- ============================================================
-- 3. TABELA: price_history
-- ============================================================

CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  tick_seq BIGINT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history(recorded_at);
CREATE INDEX idx_price_history_product_recorded ON price_history(product_id, recorded_at DESC);

-- ============================================================
-- 4. TABELA: trade_events
-- ============================================================

CREATE TABLE trade_events (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_events_product_id ON trade_events(product_id);
CREATE INDEX idx_trade_events_order_id ON trade_events(order_id);
CREATE INDEX idx_trade_events_created_at ON trade_events(created_at DESC);
CREATE INDEX idx_trade_events_product_created ON trade_events(product_id, created_at DESC);

-- ============================================================
-- 5. TABELA: tables
-- ============================================================

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tables_code ON tables(code);
CREATE INDEX idx_tables_is_active ON tables(is_active);

-- ============================================================
-- 6. TABELA: sessions
-- ============================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CLOSED')),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sessions_table_id ON sessions(table_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_opened_at ON sessions(opened_at DESC);

-- ============================================================
-- 7. TABELA: orders
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'CONFIRMED', 'CANCELED', 'EXPIRED')
  ),
  total_cents INTEGER NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_session_id ON orders(session_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_session_status ON orders(session_id, status);

-- ============================================================
-- 8. TABELA: order_items
-- ============================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  locked_price_cents INTEGER NOT NULL CHECK (locked_price_cents > 0),
  line_total_cents INTEGER NOT NULL CHECK (line_total_cents > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================
-- 9. TABELA: price_locks
-- ============================================================

CREATE TABLE price_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty INTEGER NOT NULL CHECK (qty > 0),
  locked_price_cents INTEGER NOT NULL CHECK (locked_price_cents > 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (
    status IN ('ACTIVE', 'USED', 'EXPIRED', 'CANCELED')
  ),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_price_locks_order_id ON price_locks(order_id);
CREATE INDEX idx_price_locks_product_id ON price_locks(product_id);
CREATE INDEX idx_price_locks_status ON price_locks(status);
CREATE INDEX idx_price_locks_expires_at ON price_locks(expires_at);

-- ============================================================
-- 10. TABELA: pricing_config
-- ============================================================

CREATE TABLE pricing_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  tick_seconds INTEGER NOT NULL DEFAULT 3 CHECK (tick_seconds > 0),
  decay DECIMAL(5,4) NOT NULL DEFAULT 0.95 CHECK (decay > 0 AND decay <= 1),
  sensitivity_k DECIMAL(6,4) NOT NULL DEFAULT 0.02 CHECK (sensitivity_k >= 0),
  baseline DECIMAL(6,4) NOT NULL DEFAULT 0.0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT single_row_config CHECK (id = 1)
);

INSERT INTO pricing_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. TABELA: market_events
-- ============================================================

CREATE TABLE market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('CRASH', 'PROMO', 'FREEZE', 'HAPPY_HOUR')),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_event_period CHECK (ends_at > starts_at)
);

CREATE INDEX idx_market_events_type ON market_events(type);
CREATE INDEX idx_market_events_starts_at ON market_events(starts_at);
CREATE INDEX idx_market_events_ends_at ON market_events(ends_at);
CREATE INDEX idx_market_events_active ON market_events(is_active);
CREATE INDEX idx_market_events_payload ON market_events USING gin(payload);

-- ============================================================
-- TRIGGERS E FUNÇÕES
-- ============================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at
  BEFORE UPDATE ON pricing_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMENTÁRIOS
-- ============================================================

COMMENT ON TABLE products IS 'Catálogo de produtos (bebidas) do bar';
COMMENT ON TABLE price_states IS 'Estado atual de preços (atualizado em tempo real)';
COMMENT ON TABLE price_history IS 'Histórico de variação de preços';
COMMENT ON TABLE trade_events IS 'Histórico de transações (vendas)';
COMMENT ON TABLE tables IS 'Mesas físicas do bar';
COMMENT ON TABLE sessions IS 'Sessões de atendimento (abertura até fechamento)';
COMMENT ON TABLE orders IS 'Pedidos realizados';
COMMENT ON TABLE order_items IS 'Itens de cada pedido';
COMMENT ON TABLE price_locks IS 'Travamentos de preço durante checkout';
COMMENT ON TABLE pricing_config IS 'Configuração do algoritmo de precificação';
COMMENT ON TABLE market_events IS 'Eventos especiais de mercado';

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
```

---

## 📝 Notas de Implementação

### Performance e Otimização

1. **Índices**: Todos os índices recomendados estão incluídos
2. **Particionamento**: Considerar para `price_history` e `trade_events` em produção
3. **Vacuum/Analyze**: Configurar autovacuum adequadamente
4. **Connection Pool**: Usar PgBouncer ou similar

### Segurança

1. **Permissões**: Criar roles específicos (app_user, readonly_user, admin_user)
2. **Row Level Security**: Considerar para tabelas sensíveis
3. **Audit**: Adicionar tabela de auditoria se necessário

### Migrações

1. Use uma ferramenta de migração (ex: Prisma, TypeORM, node-pg-migrate)
2. Mantenha scripts de rollback
3. Teste migrações em staging primeiro

### Backup

1. Configure backup automático diário
2. Retenção de 30 dias mínimo
3. Teste restauração regularmente

---

## 🔗 Próximos Passos

1. **Criar banco de dados**: `createdb bar_market`
2. **Executar script**: `psql bar_market < schema.sql`
3. **Popular dados iniciais**: Migrar dados de `data/*.mock.ts`
4. **Configurar ORM**: Conectar aplicação Next.js ao PostgreSQL
5. **Implementar migrations**: Sistema de versionamento do schema

---

## 📚 Referências

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Best Practices for Database Schema Design](https://www.postgresql.org/docs/current/ddl.html)
- [UUID vs SERIAL](https://www.postgresql.org/docs/current/datatype-uuid.html)
