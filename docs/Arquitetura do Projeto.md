# Arquitetura do Projeto Bar Market

## Arquitetura das Páginas

### Estrutura de Rotas (Next.js App Router)

**1. Página Inicial (`/`)**
- Arquivo: `app/page.tsx`
- Status: Página template padrão do Next.js, sem implementação personalizada
- Conteúdo: Interface de boas-vindas com links para documentação

**2. Página Menu (`/menu`)**
- Arquivo: `app/menu/page.tsx`
- Status: **Arquivo vazio** - Rota criada mas sem implementação
- Pasta de componentes: `app/menu/_components/` (vazia)
- Finalidade: Interface para clientes visualizarem e comprarem bebidas

**3. Página Telão (`/telao`)**
- Arquivo: `app/telao/page.tsx`
- Status: **Arquivo vazio** - Rota criada mas sem implementação
- Pasta de componentes: `app/telao/_components/` (vazia)
- Finalidade: Display público mostrando cotações em tempo real

**4. API Routes (`/api`)**
- Pasta: `app/api/`
- Status: **Pasta vazia** - Sem endpoints implementados
- Rotas planejadas (não implementadas):
  - `/api/ordens/confirmar` - Confirmação de pedidos
  - `/api/ordens/look` - Consulta de ordens
  - `/api/stream/precos` - Stream de preços em tempo real

**5. Layout Global**
- Arquivo: `app/layout.tsx`
- Funcionalidades:
  - Define metadados (title, description)
  - Carrega fontes Geist Sans e Geist Mono
  - Aplica classes CSS globais

---

## Tecnologias Utilizadas

### Core Framework
- **Next.js 16.1.1** (App Router) - Framework React com SSR/SSG
- **React 19.2.3** - Biblioteca UI com Server Components
- **TypeScript 5.x** - Tipagem estática para maior segurança de código

### Estilização
- **Tailwind CSS 4.x** - Framework CSS utility-first
- **@tailwindcss/postcss** - Processador CSS para Tailwind
- **PostCSS** - Transformação e otimização de CSS

### Desenvolvimento
- **ESLint 9.x** - Linter de código para qualidade
- **eslint-config-next** - Configuração ESLint específica para Next.js

### Fontes
- **Geist Sans** - Fonte principal do projeto (Google Fonts)
- **Geist Mono** - Fonte monoespaçada para código (Google Fonts)

---

## Padrões de Arquitetura

### Organização de Arquivos
- **App Router**: Roteamento baseado em sistema de arquivos (`app/`)
- **Server Components**: Padrão por padrão no Next.js 16
- **Colocação de Componentes**: Componentes privados em pastas `_components/`

### Convenções de Código
- TypeScript para todo o código
- Componentes React funcionais com hooks
- CSS Modules através do Tailwind CSS
- Server Components para páginas (Client Components quando necessário)

---

## Estado Atual do Projeto

### ✅ Implementado
- Estrutura básica do Next.js 16 com App Router
- Configuração de TypeScript
- Setup do Tailwind CSS 4
- Layout global com fontes personalizadas
- Estrutura de pastas para rotas principais

### ❌ Pendente de Implementação
- **Página Menu**: Interface de compra de bebidas
- **Página Telão**: Display de cotações em tempo real
- **APIs**: Endpoints para pedidos e streaming de preços
- **Motor de Precificação**: Lógica de variação dinâmica de preços
- **Banco de Dados**: Armazenamento de produtos, pedidos e histórico
- **Sistema de Autenticação**: Se necessário para clientes/admin
- **WebSockets/SSE**: Para atualização de preços em tempo real
- **Componentes UI**: Todos os componentes personalizados do projeto

---

## Próximos Passos Sugeridos

1. **Definir Modelo de Dados**: Estrutura de produtos, pedidos e preços
2. **Implementar Motor de Precificação**: Algoritmo de variação de preços
3. **Criar API Routes**: Endpoints para operações de pedidos e consultas
4. **Desenvolver Página Menu**: Interface interativa para clientes
5. **Desenvolver Página Telão**: Display público com atualizações em tempo real
6. **Configurar Banco de Dados**: PostgreSQL, MongoDB ou similar
7. **Implementar Streaming**: WebSockets ou Server-Sent Events para preços
