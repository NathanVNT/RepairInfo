# 05 - Sauvegardes et restauration

## Objectif

Garantir la recuperation du service en cas de perte de donnees ou incident majeur.

## Politique de sauvegarde

- Base PostgreSQL: quotidienne
- Config Docker (.env, compose): quotidienne
- Fichiers annexes (logs, exports): hebdomadaire
- Retention: [14/30/90 jours]

## Script exemple de backup DB

```bash
#!/usr/bin/env bash
set -euo pipefail

DATE=$(date +%F_%H-%M-%S)
BACKUP_DIR="/opt/wikijs/backups"
mkdir -p "$BACKUP_DIR"

docker exec wikijs-db pg_dump -U "$WIKI_DB_USER" "$WIKI_DB_NAME" \
  | gzip > "$BACKUP_DIR/wikijs_${DATE}.sql.gz"

find "$BACKUP_DIR" -type f -name "wikijs_*.sql.gz" -mtime +14 -delete
```

## Procedure de restauration

1. Stopper le service Wiki.js.
2. Restaurer la base PostgreSQL depuis le dump cible.
3. Redemarrer Docker Compose.
4. Verifier la connexion et la presence des pages critiques.
5. Noter l'operation dans le journal d'incident.

## Test de restauration (obligatoire)

- Frequence: trimestrielle minimum
- Environnement de test: [A_COMPLETER]
- Resultat attendu: service pleinement operationnel
- Compte-rendu: lien vers preuve de test

## Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Creation de la page |
