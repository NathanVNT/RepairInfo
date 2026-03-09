-- CreateTable
CREATE TABLE "Reparation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ref" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReparationHistorique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reparation_id" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "visible_client" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReparationHistorique_reparation_id_fkey" FOREIGN KEY ("reparation_id") REFERENCES "Reparation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PieceUtilisee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reparation_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_ref" TEXT NOT NULL,
    "product_label" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" REAL NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PieceUtilisee_reparation_id_fkey" FOREIGN KEY ("reparation_id") REFERENCES "Reparation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Reparation_ref_key" ON "Reparation"("ref");

-- CreateIndex
CREATE INDEX "Reparation_client_id_idx" ON "Reparation"("client_id");

-- CreateIndex
CREATE INDEX "Reparation_statut_idx" ON "Reparation"("statut");

-- CreateIndex
CREATE INDEX "Reparation_date_depot_idx" ON "Reparation"("date_depot");

-- CreateIndex
CREATE INDEX "ReparationHistorique_reparation_id_idx" ON "ReparationHistorique"("reparation_id");

-- CreateIndex
CREATE INDEX "PieceUtilisee_reparation_id_idx" ON "PieceUtilisee"("reparation_id");
