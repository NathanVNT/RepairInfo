import { prisma } from '@/lib/prisma';

let ensured = false;

export async function ensureReparationSchema(): Promise<void> {
  if (ensured) return;

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Reparation" (
      "id" TEXT PRIMARY KEY,
      "ref" TEXT NOT NULL UNIQUE,
      "client_id" TEXT NOT NULL,
      "client_name" TEXT NOT NULL,
      "appareil" TEXT NOT NULL,
      "marque" TEXT,
      "modele" TEXT,
      "numero_serie" TEXT,
      "description_panne" TEXT NOT NULL,
      "date_depot" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "date_prevue" DATETIME,
      "date_fin" DATETIME,
      "statut" TEXT NOT NULL DEFAULT 'en_attente',
      "priorite" TEXT NOT NULL DEFAULT 'normale',
      "montant_estime" REAL,
      "montant_final" REAL,
      "technicien" TEXT,
      "facture_id" TEXT,
      "devis_id" TEXT,
      "note_interne" TEXT,
      "note_client" TEXT,
      "notification_statut" BOOLEAN NOT NULL DEFAULT 0,
      "notification_documents" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReparationHistorique" (
      "id" TEXT PRIMARY KEY,
      "reparation_id" TEXT NOT NULL,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "action" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "auteur" TEXT NOT NULL,
      "visible_client" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("reparation_id") REFERENCES "Reparation"("id") ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PieceUtilisee" (
      "id" TEXT PRIMARY KEY,
      "reparation_id" TEXT NOT NULL,
      "product_id" TEXT NOT NULL,
      "product_ref" TEXT NOT NULL,
      "product_label" TEXT NOT NULL,
      "quantite" INTEGER NOT NULL,
      "prix_unitaire" REAL NOT NULL,
      "total" REAL NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY("reparation_id") REFERENCES "Reparation"("id") ON DELETE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Reparation_client_id_idx" ON "Reparation"("client_id")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Reparation_statut_idx" ON "Reparation"("statut")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Reparation_date_depot_idx" ON "Reparation"("date_depot")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "ReparationHistorique_reparation_id_idx" ON "ReparationHistorique"("reparation_id")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "PieceUtilisee_reparation_id_idx" ON "PieceUtilisee"("reparation_id")');

  ensured = true;
}
