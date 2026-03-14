# Wiki.js Docker - Documentation d'exploitation (Template)

> Version du template: 1.0  
> Dernière mise à jour: 2026-03-14  
> Auteur: [A_COMPLETER]

---

## 1. Informations générales

### 1.1 Objectif du service
Décrire ici l'objectif de ce Wiki.js (base de connaissances interne, documentation client, procédures, etc.).

### 1.2 Périmètre
- Environnement: [DEV / PREPROD / PROD]
- Audience: [Equipe IT / Equipe métier / Clients]
- Données sensibles: [Oui/Non + détails]

### 1.3 Références
- Nom du projet: [A_COMPLETER]
- Responsable technique: [Nom + contact]
- Responsable métier: [Nom + contact]
- URL publique: [https://wiki.exemple.fr]
- URL interne (optionnel): [http://wiki-internal:3000]

---

## 2. Architecture

### 2.1 Vue d'ensemble
- Service applicatif: Wiki.js
- Base de données: PostgreSQL
- Reverse proxy: [Nginx / Traefik / Caddy / autre]
- Certificats TLS: [Let's Encrypt / Certificats internes]
- Hébergement: [VPS / VM / Bare metal / Cloud]

### 2.2 Schéma logique (texte)
- Utilisateur -> Reverse Proxy (443)
- Reverse Proxy -> Container Wiki.js (3000)
- Wiki.js -> PostgreSQL (5432)

### 2.3 Ressources allouées
- CPU: [A_COMPLETER]
- RAM: [A_COMPLETER]
- Stockage applicatif: [A_COMPLETER]
- Stockage DB: [A_COMPLETER]

---

## 3. Déploiement Docker

### 3.1 Prérequis
- Docker version: [A_COMPLETER]
- Docker Compose version: [A_COMPLETER]
- Ports ouverts: [80/443 + autres]
- DNS configuré: [Oui/Non]

### 3.2 Arborescence recommandée
- /opt/wikijs/
  - docker-compose.yml
  - .env
  - backups/
  - logs/

### 3.3 Exemple docker-compose.yml
Copier ce bloc et adapter les variables.

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

### 3.4 Exemple de fichier .env
```env
WIKI_DB_NAME=wikijs
WIKI_DB_USER=wikijs_user
WIKI_DB_PASSWORD=CHANGER_CE_MOT_DE_PASSE
```

### 3.5 Commandes de cycle de vie
```bash
# Démarrage
docker compose up -d

# Vérification
docker compose ps
docker compose logs -f wiki

# Mise à jour image
docker compose pull
docker compose up -d

# Arrêt
docker compose down
```

---

## 4. Configuration applicative Wiki.js

### 4.1 Configuration initiale
- Compte administrateur créé: [Oui/Non]
- Nom du site: [A_COMPLETER]
- URL canonique: [A_COMPLETER]
- Langue par défaut: [fr]

### 4.2 Authentification
- Mode actif: [Local / LDAP / OIDC / SAML / autre]
- Fournisseur: [A_COMPLETER]
- MFA activé: [Oui/Non]

### 4.3 Gestion des permissions
- Groupes définis: [Admins, Editeurs, Lecteurs, ...]
- Politique d'accès: [Principe du moindre privilège]
- Pages restreintes: [A_COMPLETER]

### 4.4 Sauvegardes de contenu Wiki
- Méthode: [Git sync / Export / Snapshot VM / autre]
- Fréquence: [A_COMPLETER]
- Rétention: [A_COMPLETER]

---

## 5. Reverse proxy et TLS

### 5.1 Reverse proxy utilisé
- Type: [Nginx / Traefik / Caddy]
- Hôte: [A_COMPLETER]

### 5.2 Exigences de sécurité
- TLS minimum: 1.2
- Redirection HTTP -> HTTPS: activée
- HSTS: [Oui/Non]
- Headers sécurité: [CSP, X-Frame-Options, X-Content-Type-Options]

### 5.3 Santé et disponibilité
- Endpoint de vérification: [URL ou méthode]
- Supervision externe: [Uptime Kuma / Pingdom / autre]

---

## 6. Sauvegardes et restauration

### 6.1 Stratégie de sauvegarde
- Sauvegarde DB PostgreSQL: [quotidienne]
- Sauvegarde config Docker: [quotidienne/hebdomadaire]
- Sauvegarde contenu lié (uploads, assets): [A_COMPLETER]

### 6.2 Exemple script backup PostgreSQL
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

### 6.3 Procédure de restauration
1. Arrêter l'application Wiki.js.
2. Restaurer la base PostgreSQL depuis le dump.
3. Redémarrer la stack Docker.
4. Vérifier l'accès web et l'intégrité des pages.
5. Documenter l'opération dans le journal d'exploitation.

---

## 7. Supervision et logs

### 7.1 Logs à surveiller
- Logs application Wiki.js
- Logs PostgreSQL
- Logs reverse proxy
- Logs système (CPU, RAM, disque)

### 7.2 Indicateurs clés
- Disponibilité du service
- Temps de réponse moyen
- Taux d'erreurs HTTP 4xx/5xx
- Espace disque restant

### 7.3 Alerting
- Canal: [Email / Slack / Teams / autre]
- Seuil CPU: [A_COMPLETER]
- Seuil RAM: [A_COMPLETER]
- Seuil disque: [A_COMPLETER]

---

## 8. Sécurité

### 8.1 Durcissement minimal
- Mots de passe forts obligatoires
- Rotation des secrets planifiée
- Accès admin limité à des comptes nominatifs
- Exposition réseau minimale

### 8.2 Gestion des secrets
- Emplacement: [.env chiffré / Vault / Secret Manager]
- Rotation: [trimestrielle / semestrielle]
- Responsable: [A_COMPLETER]

### 8.3 Journalisation sécurité
- Tentatives de connexion échouées
- Changements de permissions
- Actions administrateur sensibles

---

## 9. Procédures d'exploitation

### 9.1 Mise à jour standard
1. Sauvegarder DB et configuration.
2. Télécharger les nouvelles images.
3. Redémarrer les services.
4. Vérifier les logs et la page de santé.
5. Valider la connexion et l'édition d'une page test.

### 9.2 Rollback
1. Revenir à l'image précédente.
2. Restaurer la DB si nécessaire.
3. Vérifier cohérence des données.
4. Ouvrir un incident post-mortem.

### 9.3 Incident critique
- Priorité: [P1/P2/P3]
- Astreinte: [A_COMPLETER]
- Escalade: [A_COMPLETER]
- RTO cible: [A_COMPLETER]
- RPO cible: [A_COMPLETER]

---

## 10. Plan de tests post-déploiement

- Accès HTTPS OK
- Authentification OK
- Création/édition/suppression page OK
- Recherche de contenu OK
- Droits lecteurs/éditeurs/admins OK
- Sauvegarde testée OK
- Restauration testée OK

Résultat global: [OK / KO]  
Date de validation: [A_COMPLETER]  
Validé par: [A_COMPLETER]

---

## 11. Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Création du template |

---

## 12. Annexe - Checklist de mise en production

- DNS configuré
- Certificat TLS valide
- Ports strictement nécessaires ouverts
- Sauvegarde automatique active
- Monitoring actif
- Comptes administrateurs vérifiés
- Documentation exploitant validée
- Test de restauration effectué

---

## 13. Bloc rapide à compléter avant import

- Nom du wiki: [A_COMPLETER]
- URL finale: [A_COMPLETER]
- Type d'auth: [A_COMPLETER]
- Responsable technique: [A_COMPLETER]
- Emplacement des sauvegardes: [A_COMPLETER]
- Fréquence de backup: [A_COMPLETER]
- Rétention: [A_COMPLETER]

Quand tous les champs sont remplis, importer ce fichier Markdown dans Wiki.js.
