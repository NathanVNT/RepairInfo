# 🗄️ Configuration de la Base de Données

## Vue d'ensemble

L'application utilise **Prisma ORM** avec **SQLite** pour gérer les réparations de manière persistante.

### Pourquoi SQLite ?

- ✅ **Aucun serveur** à installer (fichier local)
- ✅ **Léger et rapide** pour les petites/moyennes entreprises
- ✅ **Facile à sauvegarder** (simple fichier)
- ✅ **Idéal pour débuter** sans configuration complexe
- ⚠️ Pour une grande échelle, migrer vers PostgreSQL/MySQL est possible

## Architecture

```
┌─────────────────────┐
│   Pages Next.js     │  (Interface utilisateur)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    API Routes       │  (/api/reparations/*)
│    (Next.js)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Prisma Client     │  (ORM)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  SQLite Database    │  (prisma/dev.db)
│  - Reparation       │
│  - Historique       │
│  - PieceUtilisee    │
└─────────────────────┘
```

## Structure de la Base de Données

### Table `Reparation`

Stocke toutes les réparations avec leurs informations principales.

| Champ              | Type      | Description                           |
|--------------------|-----------|---------------------------------------|
| `id`               | String    | ID unique (CUID)                      |
| `ref`              | String    | Référence (REP-2026-00001)            |
| `client_id`        | String    | ID du client dans Dolibarr            |
| `client_name`      | String    | Nom du client                         |
| `appareil`         | String    | Type d'appareil                       |
| `marque`           | String?   | Marque de l'appareil                  |
| `modele`           | String?   | Modèle de l'appareil                  |
| `numero_serie`     | String?   | Numéro de série                       |
| `description_panne`| String    | Description de la panne               |
| `date_depot`       | DateTime  | Date de dépôt                         |
| `date_prevue`      | DateTime? | Date de fin prévue                    |
| `date_fin`         | DateTime? | Date de fin réelle                    |
| `statut`           | String    | Statut actuel                         |
| `priorite`         | String    | Priorité (basse/normale/haute/urgente)|
| `montant_estime`   | Float?    | Montant estimé                        |
| `montant_final`    | Float?    | Montant final                         |
| `technicien`       | String?   | Nom du technicien                     |
| `facture_id`       | String?   | Lien vers facture Dolibarr            |
| `devis_id`         | String?   | Lien vers devis Dolibarr              |
| `note_interne`     | String?   | Notes internes                        |
| `note_client`      | String?   | Notes visibles client                 |

**Relations :**
- Une réparation a plusieurs entrées d'historique
- Une réparation a plusieurs pièces utilisées

### Table `ReparationHistorique`

Historique complet de chaque réparation avec traçabilité.

| Champ              | Type      | Description                           |
|--------------------|-----------|---------------------------------------|
| `id`               | String    | ID unique                             |
| `reparation_id`    | String    | ID de la réparation parente           |
| `date`             | DateTime  | Date de l'événement                   |
| `action`           | String    | Type d'action                         |
| `description`      | String    | Description de l'action               |
| `auteur`           | String    | Qui a fait l'action                   |
| `visible_client`   | Boolean   | Visible par le client ?               |

**Actions courantes :**
- Création
- Changement de statut
- Ajout de pièce
- Commentaire technicien
- Modification

### Table `PieceUtilisee`

Pièces/produits utilisés pour chaque réparation.

| Champ              | Type      | Description                           |
|--------------------|-----------|---------------------------------------|
| `id`               | String    | ID unique                             |
| `reparation_id`    | String    | ID de la réparation                   |
| `product_id`       | String    | ID du produit dans Dolibarr           |
| `product_ref`      | String    | Référence produit                     |
| `product_label`    | String    | Nom du produit                        |
| `quantite`         | Int       | Quantité utilisée                     |
| `prix_unitaire`    | Float     | Prix unitaire                         |
| `total`            | Float     | Montant total (quantité × prix)       |

## API Routes

### Réparations

#### `GET /api/reparations`
Récupérer toutes les réparations avec filtres optionnels.

**Query params :**
- `statut` - Filtrer par statut
- `client_id` - Filtrer par client
- `technicien` - Filtrer par technicien

**Réponse :** Array de `Reparation` avec historique et pièces

---

#### `POST /api/reparations`
Créer une nouvelle réparation.

**Body :**
```json
{
  "client_id": "123",
  "client_name": "Dupont Jean",
  "appareil": "Ordinateur portable",
  "marque": "Dell",
  "modele": "XPS 15",
  "numero_serie": "ABC123",
  "description_panne": "Écran noir au démarrage",
  "date_depot": "2026-03-05T10:00:00Z",
  "statut": "en_attente",
  "priorite": "normale",
  "montant_estime": 150,
  "technicien": "Pierre Martin",
  "note_interne": "Vérifier carte graphique",
  "note_client": "Client pressé"
}
```

**Réponse :** `Reparation` créée avec `id` et `ref` générés

---

#### `GET /api/reparations/[id]`
Récupérer une réparation spécifique.

**Réponse :** `Reparation` avec historique et pièces

---

#### `PUT /api/reparations/[id]`
Mettre à jour une réparation.

**Body :** Champs à modifier (partiel)

**Réponse :** `Reparation` mise à jour

---

#### `DELETE /api/reparations/[id]`
Supprimer une réparation (et historique/pièces en cascade).

**Réponse :** `{ success: true }`

---

### Historique

#### `POST /api/reparations/[id]/historique`
Ajouter une entrée à l'historique.

**Body :**
```json
{
  "action": "Commentaire",
  "description": "Carte mère vérifiée, RAM défectueuse",
  "auteur": "Pierre Martin",
  "visible_client": false
}
```

**Réponse :** Entrée d'historique créée

---

### Statut

#### `POST /api/reparations/[id]/statut`
Changer le statut d'une réparation (ajoute automatiquement à l'historique).

**Body :**
```json
{
  "statut": "en_reparation",
  "auteur": "Pierre Martin",
  "commentaire": "Commande de RAM passée"
}
```

**Réponse :** `Reparation` mise à jour avec nouvel historique

---

### Pièces

#### `POST /api/reparations/[id]/pieces`
Ajouter une pièce utilisée.

**Body :**
```json
{
  "product_id": "456",
  "product_ref": "RAM-DDR4-16",
  "product_label": "RAM DDR4 16GB Kingston",
  "quantite": 1,
  "prix_unitaire": 75.00,
  "auteur": "Pierre Martin"
}
```

**Réponse :** `PieceUtilisee` créée

---

#### `DELETE /api/reparations/[id]/pieces?pieceId=[pieceId]`
Supprimer une pièce utilisée.

**Réponse :** `{ success: true }`

---

### Statistiques

#### `GET /api/reparations/stats`
Récupérer les statistiques globales.

**Réponse :**
```json
{
  "total": 45,
  "en_cours": 12,
  "semaine": 5,
  "ca_mois": 3250.00
}
```

## Commandes Prisma

### Développement

```bash
# Générer le client Prisma après modification du schéma
npx prisma generate

# Créer une nouvelle migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations
npx prisma migrate deploy

# Réinitialiser la base de données (⚠️ PERTE DE DONNÉES)
npx prisma migrate reset

# Ouvrir Prisma Studio (interface graphique)
npx prisma studio
```

### Production

```bash
# Générer le client (automatique via postinstall)
npm install

# Appliquer les migrations
npx prisma migrate deploy
```

## Prisma Studio

Interface graphique pour gérer la base de données :

```bash
npx prisma studio
```

Ouvre http://localhost:5555 avec :
- Vue des tables
- Ajout/modification/suppression de données
- Recherche et filtres
- Exports

## Sauvegarde et Restauration

### Sauvegarde

**Option 1 : Copie simple**
```bash
# Copier le fichier de base de données
copy prisma\dev.db backup\dev-2026-03-05.db
```

**Option 2 : Export SQL (recommandé)**
```bash
# Installer SQLite command-line
# Puis exporter
sqlite3 prisma\dev.db .dump > backup\reparations-2026-03-05.sql
```

### Restauration

**Depuis fichier .db :**
```bash
copy backup\dev-2026-03-05.db prisma\dev.db
```

**Depuis dump SQL :**
```bash
sqlite3 prisma\dev.db < backup\reparations-2026-03-05.sql
```

## Migration vers PostgreSQL/MySQL

Si vous souhaitez migrer vers une base de données plus robuste :

### 1. Modifier `prisma/schema.prisma`

```prisma
datasource db {
  provider = "postgresql"  // ou "mysql"
}
```

### 2. Configurer l'URL de connexion

Dans `.env.local` :

```bash
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/atelier_db"

# MySQL
DATABASE_URL="mysql://username:password@localhost:3306/atelier_db"
```

### 3. Migrer les données

```bash
# Créer la nouvelle base de données
npx prisma migrate dev --name init

# Exporter depuis SQLite
sqlite3 prisma/dev.db .dump > export.sql

# Importer dans PostgreSQL/MySQL (adapter le SQL)
# Utiliser pgloader ou des outils de migration
```

## Bonnes Pratiques

### Sauvegardes Régulières

Créer une tâche planifiée (cron/Task Scheduler) :

**Windows (PowerShell) :**
```powershell
# backup-db.ps1
$date = Get-Date -Format "yyyy-MM-dd-HHmm"
Copy-Item "prisma\dev.db" "backup\dev-$date.db"
```

**Linux/Mac (cron) :**
```bash
# Ajouter à crontab -e (chaque jour à 2h du matin)
0 2 * * * cp /path/to/prisma/dev.db /path/to/backup/dev-$(date +\%Y\%m\%d).db
```

### Index et Performance

Le schéma inclut déjà des index sur :
- `client_id` (recherche par client rapide)
- `statut` (filtrage par statut rapide)
- `date_depot` (tri chronologique rapide)

Pour de meilleures performances sur de gros volumes :
- Ajouter des index sur les champs fréquemment recherchés
- Utiliser `take` et `skip` pour la pagination
- Activer le query logging en développement

### Sécurité

- ✅ Le fichier `.db` est dans `.gitignore` (non versionné)
- ✅ Les API routes valident les requêtes
- ⚠️ Ajouter un système d'authentification pour la production
- ⚠️ Valider toutes les entrées utilisateur

## Dépannage

### Erreur "Client not generated"

```bash
npx prisma generate
```

### Erreur de migration

```bash
# Réinitialiser (⚠️ perte de données)
npx prisma migrate reset

# Ou forcer
npx prisma migrate resolve --applied "20260305222657_init"
```

### Base de données verrouillée

Fermer tous les processus qui utilisent la DB :
- Arrêter le serveur de développement
- Fermer Prisma Studio
- Vérifier les connexions actives

### Perte de données

Importer depuis la dernière sauvegarde :
```bash
copy backup\dev-2026-03-05.db prisma\dev.db
npm run dev
```

## Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
