# 03 - Installation Docker

## Objectif

Deployer Wiki.js et PostgreSQL avec Docker Compose de maniere reproductible.

## Prerequis

- Docker installe sur l'hote
- Docker Compose actif
- DNS du domaine configure
- Reverse proxy pret (si exposition web)

## Arborescence recommandee

- /opt/wikijs/
  - docker-compose.yml
  - .env
  - backups/
  - logs/

## Fichier docker-compose.yml

```yaml
services:
  wiki:
    image: ghcr.io/requarks/wiki:2
    container_name: wikijs
    restart: unless-stopped
    depends_on:
      - db
    ports:
      - "3000:3000"
    environment:
      DB_TYPE: postgres
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: ${WIKI_DB_USER}
      DB_PASS: ${WIKI_DB_PASSWORD}
      DB_NAME: ${WIKI_DB_NAME}
    volumes:
      - ./logs:/wiki/logs

  db:
    image: postgres:15
    container_name: wikijs-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${WIKI_DB_NAME}
      POSTGRES_USER: ${WIKI_DB_USER}
      POSTGRES_PASSWORD: ${WIKI_DB_PASSWORD}
    volumes:
      - wikijs_pgdata:/var/lib/postgresql/data

volumes:
  wikijs_pgdata:
```

## Fichier .env

```env
WIKI_DB_NAME=wikijs
WIKI_DB_USER=wikijs_user
WIKI_DB_PASSWORD=CHANGER_CE_MOT_DE_PASSE
```

## Commandes d'installation

```bash
cd /opt/wikijs
docker compose pull
docker compose up -d
docker compose ps
docker compose logs -f wiki
```

## Verification post-install

- Container wikijs: Up
- Container wikijs-db: Up
- URL web accessible
- Ecran setup initial visible

## Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Creation de la page |
