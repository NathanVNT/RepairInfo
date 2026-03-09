-- Add client notification preferences for repairs
ALTER TABLE "Reparation" ADD COLUMN "notification_statut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reparation" ADD COLUMN "notification_documents" BOOLEAN NOT NULL DEFAULT false;
