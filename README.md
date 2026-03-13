# Application Atelier Informatique

Application web moderne de gestion d'atelier informatique connectée à l'API Dolibarr.

## 🚀 Fonctionnalités

### ⚙️ Configuration Initiale
- **Page d'installation** - Interface de configuration pour lier Dolibarr
- Test de connexion API intégré
- Guide pas à pas pour activer l'API Dolibarr
- Génération automatique du fichier .env.local

### 🔗 Intégration Dolibarr Complète
- **Clients synchronisés** - Créés automatiquement dans Dolibarr
- **Devis automatiques** - Générés depuis les réparations avec pièces
- **Factures automatiques** - Créées avec lignes détaillées
- **Liens bidirectionnels** - Entre réparations et documents Dolibarr
- **Ouverture directe** - Liens vers les documents dans Dolibarr
- Voir [INTEGRATION_DOLIBARR.md](INTEGRATION_DOLIBARR.md) et [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md)

### ✅ Gestion des Réparations
- **Création de réparation** avec formulaire complet
- Recherche et sélection de client intégrée
- **Scanner QR code / code-barres** pour numéro de série
- Suivi complet des réparations avec états (en attente, diagnostic, en cours, terminée, etc.)
- Historique détaillé visible côté atelier et client
- Gestion des priorités (basse, normale, haute, urgente)
- Association de pièces utilisées
- Lien avec les factures et devis
- Vue détaillée avec changement de statut

### 📦 Gestion du Stock
- Inventaire complet synchronisé avec Dolibarr
- Alertes de stock bas et rupture de stock
- Suivi des mouvements de stock
- Valorisation du stock
- Code-barres et références produits

### 📄 Factures et Devis
- Création et modification de factures
- Gestion des devis (propositions commerciales)
- États multiples (brouillon, validé, payé, signé, etc.)
- Lignes de facturation détaillées
- Intégration complète avec Dolibarr

### 👥 Gestion des Clients
- **Création de client** (particulier ou entreprise)
- **Fiche client détaillée** avec onglets
- Base de données clients synchronisée avec Dolibarr
- Historique complet des réparations par client
- Coordonnées complètes avec lien direct (email, téléphone)
- Statistiques par client (nombre de réparations, CA total)
- Recherche et filtrage avancé

### 📊 Tableau de Bord
- Vue d'ensemble des activités
- Statistiques en temps réel
- Alertes et notifications
- Activité récente
- Indicateurs de performance

## 🛠 Technologies Utilisées

- **Next.js 14** - Framework React avec App Router
- **TypeScript** - Typage statique
- **Prisma ORM** - Gestion de la base de données
- **SQLite** - Base de données locale (migration vers PostgreSQL/MySQL possible)
- **html5-qrcode** - Scanner QR code et code-barres
- **Tailwind CSS** - Framework CSS utilitaire
- **Axios** - Client HTTP pour l'API Dolibarr
- **Lucide React** - Icônes modernes
- **Zustand** - Gestion d'état (si nécessaire)

## 💾 Base de Données

L'application utilise **SQLite** avec **Prisma ORM** pour stocker les réparations localement :

- ✅ **Aucun serveur** de base de données supplémentaire requis
- ✅ **Persistance** des réparations, historiques et pièces utilisées
- ✅ **API REST complète** pour gérer les réparations
- ✅ **Backups faciles** (simple fichier)
- ✅ **Migration possible** vers PostgreSQL/MySQL pour grande échelle

**Tables :**
- `Reparation` - Toutes les réparations avec détails complets
- `ReparationHistorique` - Historique de chaque réparation
- `PieceUtilisee` - Pièces et produits utilisés

📚 Voir [DATABASE.md](DATABASE.md) pour la documentation complète

## 📋 Prérequis

- Node.js 18+ et npm/yarn/pnpm
- Une instance Dolibarr fonctionnelle avec l'API activée
- Clé API Dolibarr (générée depuis Dolibarr)

## 🔧 Installation

1. **Cloner le projet**
   ```bash
   cd App_Atelier_Informatique
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Configurer les variables d'environnement**
   
   Copier le fichier `.env.local.example` vers `.env.local` :
   ```bash
   copy .env.local.example .env.local
   ```

   Puis éditer `.env.local` avec vos informations :
   ```env
   NEXT_PUBLIC_DOLIBARR_URL=https://votre-dolibarr.com
   NEXT_PUBLIC_DOLIBARR_API_KEY=votre_cle_api_dolibarr
   NEXT_PUBLIC_APP_NAME=Atelier Informatique
   ```

   **OU** utilisez la page d'installation graphique (étape 5)

4. **Initialiser la base de données**
   
   La base de données et le client Prisma sont automatiquement configurés :
   ```bash
   # Le postinstall génère automatiquement le client Prisma
   # La migration a déjà été appliquée lors du développement
   ```
   
   La base de données SQLite sera créée à `prisma/dev.db`

5. **Lancer le serveur de développement**
   ```bash
   npm run dev
   # ou
   yarn dev
   # ou
   pnpm dev
   ```

6. **Ouvrir l'application**
   
   Naviguer vers [http://localhost:3000](http://localhost:3000)

7. **Configuration initiale**
   
   Au premier lancement, accédez à [http://localhost:3000/setup](http://localhost:3000/setup) pour configurer la connexion à Dolibarr via l'interface graphique.

## 🐧 Installation Auto Ubuntu (daemon systemd)

Un script d'installation automatique est disponible pour Ubuntu. Il :
- installe les dépendances système (curl, git, build-essential, sqlite3)
- installe Node.js 20 si nécessaire
- installe les dépendances npm
- exécute Prisma generate + migration deploy
- build l'application
- crée et active un service systemd

Commande :

```bash
sudo bash scripts/install-ubuntu-daemon.sh \
   --app-dir /opt/App_Atelier_Informatique \
   --app-user www-data \
   --port 3000 \
   --service-name app-atelier
```

Mode one-liner (clone/pull + install daemon):

```bash
sudo bash scripts/install-ubuntu-quick.sh \
   --repo-url https://github.com/OWNER/REPO.git \
   --branch main \
   --app-dir /opt/App_Atelier_Informatique \
   --app-user www-data \
   --port 3000 \
   --service-name app-atelier
```

Mode one-liner distant (sans clone manuel préalable):

```bash
curl -fsSL https://raw.githubusercontent.com/OWNER/REPO/main/scripts/install-ubuntu-quick.sh | sudo bash -s -- \
   --repo-url https://github.com/OWNER/REPO.git \
   --branch main \
   --app-dir /opt/App_Atelier_Informatique \
   --app-user www-data \
   --port 3000 \
   --service-name app-atelier
```

Vérification :

```bash
systemctl status app-atelier
journalctl -u app-atelier -f
```

## 🔑 Configuration Dolibarr

### Activer l'API REST

1. Se connecter à Dolibarr en tant qu'administrateur
2. Aller dans **Configuration → Modules/Applications**
3. Activer le module **API/Webservices**
4. Dans **Configuration → API/Webservices**, cocher "REST API"

### Générer une clé API

1. Aller dans votre profil utilisateur
2. Onglet **Token API**
3. Générer un nouveau token
4. Copier la clé générée dans `.env.local`

### Permissions nécessaires

L'utilisateur associé à la clé API doit avoir les permissions suivantes :
- Lecture/Écriture sur les Produits/Services
- Lecture/Écriture sur les Tiers (Clients)
- Lecture/Écriture sur les Factures
- Lecture/Écriture sur les Propositions commerciales

### Champs personnalisés (optionnel)

Pour les réparations, vous pouvez créer des champs personnalisés dans Dolibarr :

**Module Factures ou Propositions :**
- `reparation_appareil` (text) - Type d'appareil
- `reparation_marque` (text) - Marque
- `reparation_modele` (text) - Modèle
- `reparation_serie` (text) - Numéro de série
- `reparation_statut` (select) - Statut de réparation
- `reparation_priorite` (select) - Priorité

## 📁 Structure du Projet

```
App_Atelier_Informatique/
├── src/
│   ├── app/                        # Pages Next.js (App Router)
│   │   ├── page.tsx                # Page d'accueil
│   │   ├── layout.tsx              # Layout principal
│   │   ├── globals.css             # Styles globaux
│   │   ├── api/                    # API Routes (Next.js)
│   │   │   └── reparations/       # API réparations
│   │   │       ├── route.ts       # CRUD réparations
│   │   │       ├── [id]/          # Opérations par ID
│   │   │       └── stats/         # Statistiques
│   │   ├── setup/                  # Page d'installation
│   │   ├── reparations/            # Module réparations
│   │   │   ├── page.tsx           # Liste
│   │   │   ├── nouveau/           # Création
│   │   │   └── [id]/              # Détail
│   │   ├── stock/                  # Module stock
│   │   ├── factures/               # Module factures
│   │   ├── clients/                # Module clients
│   │   │   ├── page.tsx           # Liste
│   │   │   ├── nouveau/           # Création
│   │   │   └── [id]/              # Détail
│   │   └── dashboard/              # Tableau de bord
│   ├── components/                  # Composants réutilisables
│   │   ├── ui.tsx                  # Composants UI de base
│   │   └── BarcodeScanner.tsx     # Scanner QR/code-barres
│   ├── lib/                        # Services et utilitaires
│   │   ├── dolibarr-api.ts        # Client API Dolibarr
│   │   ├── reparation-service.ts  # Service réparations (API wrapper)
│   │   └── prisma.ts              # Client Prisma
│   └── types/                      # Types TypeScript
│       └── index.ts                # Définitions de types
├── prisma/                         # Base de données Prisma
│   ├── schema.prisma              # Schéma de base de données
│   ├── migrations/                # Migrations
│   └── dev.db                     # Base de données SQLite
├── public/                         # Fichiers statiques
├── .env.local.example             # Exemple de configuration
├── README.md                       # Documentation principale
├── DATABASE.md                     # Documentation base de données
├── DOLIBARR_CONFIG.md             # Guide config Dolibarr
├── GUIDE_UTILISATION.md           # Guide utilisateur
├── TODO.md                         # Feuille de route
├── next.config.js                 # Configuration Next.js
├── tailwind.config.js             # Configuration Tailwind
├── tsconfig.json                  # Configuration TypeScript
└── package.json                    # Dépendances
```

## 🎨 Personnalisation

### Couleurs

Les couleurs principales sont définies dans `tailwind.config.js` :

```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    // ... autres nuances
    900: '#0c4a6e',
  },
}
```

### Logo et Nom

Modifier dans `.env.local` :
```env
NEXT_PUBLIC_APP_NAME=Votre Nom d'Atelier
```

## 🚀 Déploiement

### Build de production

```bash
npm run build
npm start
```

### Déploiement sur Vercel

1. Pusher le code sur GitHub
2. Importer le projet sur [Vercel](https://vercel.com)
3. Configurer les variables d'environnement
4. Déployer

### Déploiement sur serveur classique

```bash
npm run build
```

Puis servir le dossier `.next` avec un serveur Node.js ou via un reverse proxy (nginx, Apache).

## 📝 API Dolibarr - Endpoints Utilisés

- `GET /products` - Liste des produits
- `GET /products/{id}` - Détails d'un produit
- `POST /products` - Créer un produit
- `PUT /products/{id}` - Modifier un produit
- `GET /thirdparties` - Liste des clients
- `POST /thirdparties` - Créer un client
- `GET /invoices` - Liste des factures
- Utilisez la page `/setup` pour tester la connexion
- `POST /invoices` - Créer une facture
- `GET /proposals` - Liste des devis
- `POST /proposals` - Créer un devis

Documentation complète : [Dolibarr REST API](https://wiki.dolibarr.org/index.php/API_REST)

## 🔒 Sécurité

- Les clés API ne doivent **JAMAIS** être commitées dans Git
- Utiliser HTTPS en production

### Scanner de code-barres
Le scanner nécessite l'accès à la caméra. Assurez-vous d'accorder les permissions dans votre navigateur. Si vous n'avez pas de caméra, utilisez la saisie manuelle intégrée au scanner.
- Configurer CORS correctement sur Dolibarr
- Limiter les permissions de la clé API au strict nécessaire
- Mettre à jour régulièrement les dépendances

## 🐛 Dépannage

### L'API ne répond pas
- Vérifier que le module API est activé dans Dolibarr
- Vérifier l'URL dans `.env.local`
- Vérifier que la clé API est valide
- Consulter les logs du navigateur (F12)

### Erreurs de CORS
- Configurer CORS dans Dolibarr : Configuration → API → Autoriser les domaines
- Ajouter votre domaine dans la liste blanche

### Données de démonstration
L'application fonctionne avec des données de démonstration si l'API n'est pas accessible. Les vraies données seront chargées une fois la connexion établie.

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Dolibarr API](https://wiki.dolibarr.org/index.php/API_REST)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation TypeScript](https://www.typescriptlang.org/docs)

## 📄 Licence

Ce projet est fourni "tel quel" pour usage personnel ou commercial.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir des issues ou proposer des pull requests.

## 📧 Support

Pour toute question ou problème, consultez la documentation Dolibarr ou créez une issue.

---

**Développé avec ❤️ pour les ateliers informatiques**
