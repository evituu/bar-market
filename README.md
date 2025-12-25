# Bar Market 🍺📈

Sistema de precificação dinâmica para bebidas inspirado em bolsa de valores. Os preços variam em tempo real conforme a demanda, criando uma experiência interativa onde clientes podem acompanhar cotações como em um pregão financeiro.

## 🎯 Conceito

O Bar Market transforma o ato de pedir uma bebida em uma experiência de mercado financeiro. Quanto mais uma bebida é pedida, maior tende a ser seu preço; quando a procura diminui, o valor recua. Telões espalhados pelo ambiente exibem as cotações atualizadas com indicadores visuais de alta e baixa.

## 🛠️ Stack Tecnológica

### Core
- **Next.js 16.1.1** (App Router) - Framework React com SSR
- **React 19.2.3** - Biblioteca UI com Server Components
- **TypeScript 5.x** - Tipagem estática
- **Tailwind CSS 4.x** - Framework CSS utility-first

### Design System
- **Fonte**: JetBrains Mono (monoespaçada para dados numéricos)
- **Paleta**: Terminal financeiro escuro (#0B0F14, #111827)
- **Cores Funcionais**:
  - Alta: `#00E676` (verde vibrante)
  - Queda: `#FF1744` (vermelho vibrante)
  - Neutro: `#F59E0B` (âmbar)
  - Ação: `#2563EB` (azul)

### Desenvolvimento
- **ESLint 9.x** + **eslint-config-next**
- **lucide-react** - Ícones

## 📁 Estrutura do Projeto

```
bar-market/
├── app/
│   ├── page.tsx                 # Página inicial com cards de navegação
│   ├── layout.tsx               # Layout global com JetBrains Mono
│   ├── globals.css              # Estilos globais + animações
│   ├── menu/
│   │   ├── page.tsx            # [TODO] Interface de compra
│   │   └── _components/        # Componentes do menu
│   └── telao/
│       ├── page.tsx            # Telão com cotações em tempo real
│       └── _components/
│           ├── DrinkValueBoard.tsx  # Grid tabular por categoria
│           ├── MarketHeader.tsx     # Header compacto estilo terminal
│           ├── TickerTape.tsx       # Faixa animada de cotações
│           ├── MarketRanking.tsx    # Top altas/quedas/negociados
│           └── PriceTicker.tsx      # Card individual de produto
├── data/
│   ├── index.ts                # Barrel export + helpers
│   ├── products.mock.ts        # 30 produtos (Chopes, Cervejas, Drinks, Shots)
│   ├── priceState.mock.ts      # Estado atual de preços
│   ├── pricingConfig.mock.ts   # Configuração do motor
│   └── tradeEvents.mock.ts     # Eventos de mercado + pedidos
├── docs/
│   ├── Resumo do Projeto.md
│   ├── Arquitetura do Projeto.md
│   ├── Front-end Expert.md
│   └── Funcionamento da API.md
└── public/
    └── JetBrains_Mono/         # Fonte local (400, 500, 600, 700)
```

## 🎨 Páginas Implementadas

### **Página Inicial (`/`)**
Landing page com dois cards principais:
- **Menu Interativo** → `/menu` (em desenvolvimento)
- **Telão ao Vivo** → `/telao` (implementado)

Design escuro profissional com cores funcionais e hover states refinados.

### **Telão (`/telao`)**
Display público estilo bolsa de valores (sem scroll, layout fixo `h-screen`):

**Componentes:**
1. **MarketHeader** - Header compacto com:
   - Logo + "Market Open"
   - Contadores (↑ altas, ↓ quedas, – estáveis)
   - Hora e Tick atual
   
2. **TickerTape** - Faixa animada horizontal com:
   - Nome + Preço + Variação de todas as bebidas
   - Animação infinita (pausa no hover)
   
3. **DrinkValueBoard** - Grid tabular principal:
   - Colunas por categoria (Chopes, Cervejas, Drinks, Shots)
   - Linhas compactas: Nome | Preço | Seta + Delta
   - Cores vibrantes para alta/queda
   - Limite de 8 itens por coluna (calibrado para 1080p)
   - Prioriza produtos com maior variação

**Design Principles:**
- Fonte JetBrains Mono para todos os dados numéricos
- Alinhamento à direita de preços (efeito "placar")
- Alto contraste para leitura à distância
- Layout fixo sem rolagem (experiência de TV)

### **Menu (`/menu`)** 
🚧 Em desenvolvimento - Interface para clientes comprarem bebidas

## 🗂️ Sistema de Dados (Mocks)

### Tipos TypeScript
- `Product` - Catálogo com limites de preço (floor, base, cap)
- `PriceState` - Snapshot atual do mercado
- `PriceHistory` - Histórico de cotações
- `Order`, `OrderItem` - Sistema de pedidos
- `PriceLock` - Travamento temporário de preços
- `TradeEvent` - Eventos de demanda
- `PricingConfig` - Parâmetros do algoritmo (tick, decay, sensitivity)

### Helpers
- `getProductsWithPrices()` - Enriquece produtos com cotação atual
- `formatCurrency()` - Formatação BRL
- `formatPriceChange()` - Formatação de variação percentual

## 🚀 Getting Started

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

Acesse:
- Home: [http://localhost:3000](http://localhost:3000)
- Telão: [http://localhost:3000/telao](http://localhost:3000/telao)

## 📋 Roadmap

### ✅ Implementado
- [x] Página inicial com navegação
- [x] Telão com cotações em tempo real (mock)
- [x] Sistema de tipos TypeScript completo
- [x] Design system (cores, fontes, animações)
- [x] Componentes do telão (Board, Header, Ticker)
- [x] 30 produtos mock em 4 categorias

### 🚧 Em Desenvolvimento
- [ ] Página Menu (`/menu`)
- [ ] Motor de precificação real
- [ ] API Routes (`/api/ordens/*`, `/api/stream/precos`)
- [ ] Banco de dados (Postgres/Redis)
- [ ] WebSockets/SSE para atualização em tempo real
- [ ] Sistema de pedidos com lock de preços
- [ ] Autenticação (mesas/comandas via QR)

## 📖 Documentação

Documentação detalhada em `/docs`:
- **Resumo do Projeto.md** - Conceito e visão geral
- **Arquitetura do Projeto.md** - Estrutura técnica atualizada
- **Front-end Expert.md** - Guia de design e UI
- **Funcionamento da API.md** - Especificação das APIs

## 🎯 Conceitos-Chave

**Experiência do Cliente:**
- Olhar para o telão e em 2 segundos identificar oportunidades
- Preços dinâmicos criam gamificação ("comprar na baixa")
- Ambiente visual de mercado financeiro (terminal, não marketing)

**Design Principles:**
- Densidade de informação > decoração
- Legibilidade à distância (3-5 metros)
- JetBrains Mono para todos os números
- Layout fixo sem scroll no telão
- Cores funcionais (não emocionais)

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para transformar bares em mercados financeiros.**
