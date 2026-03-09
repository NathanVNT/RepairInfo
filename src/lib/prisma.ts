import { PrismaClient } from '@prisma/client';
import { join } from 'path';
import { existsSync } from 'fs';

// Régler le chemin de la base de données pour Prisma
// Essayer plusieurs chemins possibles depuis différents répertoires compilés
let dbPath = '';
const possiblePaths = [
  join(__dirname, '..', '..', 'prisma', 'dev.db'),
  join(__dirname, '..', 'prisma', 'dev.db'),
  join(__dirname, 'prisma', 'dev.db'),
  join(process.cwd(), 'prisma', 'dev.db'),
];

for (const path of possiblePaths) {
  if (existsSync(path)) {
    dbPath = path;
    break;
  }
}

// Si aucun chemin ne fonctionne, utiliser le chemin absolu final
if (!dbPath) {
  dbPath = 'C:\\Users\\Nathan\\Documents\\Dev\\App_Atelier_Informatique\\prisma\\dev.db';
}

console.log('[Prisma Init] Database path:', dbPath);
process.env.DATABASE_URL = `file:${dbPath}`;

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
