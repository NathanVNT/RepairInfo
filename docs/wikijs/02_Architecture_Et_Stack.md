# 02 - Architecture et stack

## Vue d'ensemble

- Application: Wiki.js
- Execution: Docker Compose
- Base de donnees: PostgreSQL
- Exposition web: reverse proxy [Nginx / Traefik / Caddy]
- TLS: [Let's Encrypt / PKI interne]

## Flux reseau

1. Utilisateur -> HTTPS 443 -> Reverse Proxy
2. Reverse Proxy -> HTTP 3000 -> Container Wiki.js
3. Wiki.js -> TCP 5432 -> PostgreSQL

## Dimensionnement

- CPU alloue: [A_COMPLETER]
- RAM allouee: [A_COMPLETER]
- Disque applicatif: [A_COMPLETER]
- Disque base de donnees: [A_COMPLETER]

## Topologie logique

- Hote Docker: [A_COMPLETER]
- Nom du container app: `wikijs`
- Nom du container DB: `wikijs-db`
- Reseau docker: [A_COMPLETER]

## Prerequis systeme

- Docker >= [A_COMPLETER]
- Docker Compose >= [A_COMPLETER]
- DNS operationnel
- Horloge systeme synchronisee (NTP)

## Risques techniques

- Saturation disque sur volume PostgreSQL
- Mauvaise rotation des logs
- Exposition internet sans durcissement proxy
- Non test du plan de restauration

## Mesures de mitigation

- Alertes disque >= 80%
- Rotation des logs hebdomadaire
- Headers de securite au proxy
- Exercice de restauration trimestriel

## Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Creation de la page |
