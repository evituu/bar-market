import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

/**
 * Singleton Prisma Client com Driver Adapter
 * Evita múltiplas instâncias do Prisma Client em desenvolvimento (hot reload)
 * 
 * Prisma 7.x requer um adapter (ou accelerateUrl) para funcionar corretamente
 */

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __prismaAdapter: PrismaPg | undefined;
  // eslint-disable-next-line no-var
  var __prismaPool: Pool | undefined;
}

// Valida DATABASE_URL
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não está definida nas variáveis de ambiente. ' +
    'Por favor, configure a variável DATABASE_URL no arquivo .env'
  );
}

// Cria Pool do PostgreSQL (singleton)
const pool = global.__prismaPool || new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configurações opcionais do pool
  max: 10, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Cria adapter do Prisma (singleton)
const adapter = global.__prismaAdapter || new PrismaPg(pool);

// Configuração do Prisma Client
const prismaClientOptions = {
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
} as const;

// Cria instância do Prisma Client (singleton)
const prismaInstance = global.__prisma || new PrismaClient(prismaClientOptions);

export const prisma = prismaInstance;

// Cache em globalThis para desenvolvimento (evita múltiplas instâncias em HMR)
if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
  global.__prismaAdapter = adapter;
  global.__prismaPool = pool;
}

export default prisma;

