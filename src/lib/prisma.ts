import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { existsSync } from 'fs';

// Resolve DATABASE_URL safely across local/dev/prod environments.
const existingDatabaseUrl = String(process.env.DATABASE_URL || '').trim();

if (!existingDatabaseUrl) {
  const possiblePaths = [
    join(process.cwd(), 'prisma', 'dev.db'),
    join(__dirname, '..', '..', 'prisma', 'dev.db'),
    join(__dirname, '..', 'prisma', 'dev.db'),
    join(__dirname, 'prisma', 'dev.db'),
  ];

  const resolvedPath = possiblePaths.find((path) => existsSync(path)) || join(process.cwd(), 'prisma', 'dev.db');
  process.env.DATABASE_URL = `file:${resolvedPath}`;
  console.log('[Prisma Init] DATABASE_URL set to local SQLite file:', resolvedPath);
} else {
  console.log('[Prisma Init] Using DATABASE_URL from environment');
}

// PrismaClient est attaché à l'objet global en développement pour éviter
// d'épuiser les connexions lors des rechargements à chaud (HMR)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuration Prisma pour SQLite - version stable
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
