# Guide de Configuration Dolibarr

Ce guide vous explique comment connecter votre application à Dolibarr et résoudre les problèmes de connexion.

## Pré-requis

- Dolibarr installé et accessible (version 14.0 ou supérieure recommandée)
- Accès administrateur à Dolibarr
- Module API REST activé dans Dolibarr

## Étape 1 : Activer le module API REST dans Dolibarr

1. Connectez-vous à votre instance Dolibarr
2. Allez dans **Accueil → Modules/Applications**
3. Cherchez "**API/Services web REST (serveur)**"
4. Cliquez sur **Activer** si ce n'est pas déjà fait

## Étape 2 : Générer une clé API

### Pour un utilisateur existant :

1. Allez dans **Accueil → Utilisateurs & Groupes**
2. Cliquez sur votre utilisateur (ou créez un utilisateur dédié à l'API)
3. Cliquez sur l'onglet **Clé API**
4. Cliquez sur **Générer une nouvelle clé**
5. Copiez la clé générée (format : `abc123...`)

⚠️ **Important** : Cette clé ne sera affichée qu'une seule fois. Sauvegardez-la précieusement !

### Permissions requises :

L'utilisateur API doit avoir les permissions suivantes :
- **Tiers (clients)** : Lire, Créer, Modifier
- **Factures** : Lire, Créer, Modifier
- **Propositions commerciales (devis)** : Lire, Créer, Modifier
- **Produits/Services** : Lire, Créer, Modifier

## Étape 3 : Configurer votre application

1. Ouvrez le fichier `.env.local` à la racine du projet
2. Modifiez les valeurs suivantes :

```env
# Configuration Dolibarr API
NEXT_PUBLIC_DOLIBARR_URL=https://votre-dolibarr.com/dolibarr
NEXT_PUBLIC_DOLIBARR_API_KEY=votre_cle_api_ici

# Configuration Application
NEXT_PUBLIC_APP_NAME=Atelier Informatique

# Configuration Base de Données
DATABASE_URL="file:./prisma/dev.db"
```

### Exemple avec votre configuration actuelle :

```env
NEXT_PUBLIC_DOLIBARR_URL=https://dolibarr.nathanvernet.com/dolibarr
NEXT_PUBLIC_DOLIBARR_API_KEY=votre_cle_api_dolibarr
```

3. **Important** : L'URL doit pointer vers le dossier racine de Dolibarr (pas `/api/index.php`)
4. Sauvegardez le fichier

## Étape 4 : Redémarrer l'application

```bash
# Arrêtez le serveur (Ctrl+C dans le terminal)
# Puis relancez-le
npm run dev
```

## Étape 5 : Tester la connexion

1. Ouvrez votre application : http://localhost:3000
2. Allez dans la page **Clients**
3. Si la connexion fonctionne, vous devriez voir la liste de vos clients Dolibarr
4. De même pour **Factures & Devis** et **Stock**

## Vérification de la configuration

### Test manuel de l'API Dolibarr

Vous pouvez tester directement votre API avec curl ou Postman :

```bash
curl -X GET "https://dolibarr.nathanvernet.com/dolibarr/api/index.php/thirdparties?limit=5" \
  -H "DOLAPIKEY: votre_cle_api_dolibarr"
```

Si cela fonctionne, vous devriez recevoir une réponse JSON avec la liste des clients.

## Problèmes courants et solutions

### Erreur : "Configuration Dolibarr manquante"

**Cause** : Les variables d'environnement ne sont pas chargées

**Solution** :
1. Vérifiez que le fichier `.env.local` existe à la racine du projet
2. Vérifiez qu'il n'y a pas de fautes de frappe dans les noms des variables
3. Redémarrez le serveur de développement

### Erreur : "Erreur de connexion à Dolibarr" ou "Network Error"

**Causes possibles** :
- URL Dolibarr incorrecte
- Dolibarr non accessible depuis votre machine
- Problème CORS (Cross-Origin Resource Sharing)
- Pare-feu bloquant la connexion

**Solutions** :
1. Vérifiez que l'URL Dolibarr est accessible dans votre navigateur
2. Si Dolibarr est en HTTPS, vérifiez le certificat SSL
3. Pour les problèmes CORS, vérifiez la configuration de votre serveur web (Apache/Nginx)
4. Maintenant que l'application utilise des routes API côté serveur, les problèmes CORS devraient être résolus

### Erreur : "403 Forbidden" ou "401 Unauthorized"

**Causes possibles** :
- Clé API invalide ou expirée
- Permissions insuffisantes pour l'utilisateur API
- Module API REST non activé

**Solutions** :
1. Générez une nouvelle clé API dans Dolibarr
2. Vérifiez les permissions de l'utilisateur (voir Étape 2)
3. Vérifiez que le module API REST est bien activé

### Erreur : "404 Not Found"

**Cause** : URL de l'API incorrecte

**Solution** :
- Vérifiez l'URL dans `.env.local`
- L'URL doit être : `https://votre-domaine.com/dolibarr` (sans `/api/index.php`)

### Les données affichées ne sont pas à jour

**Cause** : Cache du navigateur

**Solution** :
1. Rafraîchissez la page avec Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)
2. Cliquez sur le bouton "Réessayer" dans les pages concernées

## Configuration CORS (pour les administrateurs serveur)

Si vous rencontrez toujours des problèmes CORS malgré l'utilisation des routes API, vous pouvez configurer les en-têtes CORS dans Dolibarr.

### Apache (.htaccess dans le dossier Dolibarr/api) :

```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, DOLAPIKEY"
```

### Nginx :

```nginx
location /dolibarr/api/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, DOLAPIKEY";
}
```

⚠️ **Note de sécurité** : Pour la production, remplacez `*` par l'URL spécifique de votre application.

## Support

Si vous rencontrez toujours des problèmes après avoir suivi ce guide :

1. Consultez les logs de votre serveur Dolibarr
2. Consultez la console du navigateur (F12) pour voir les erreurs détaillées
3. Vérifiez les logs du serveur Next.js dans le terminal
4. Consultez la documentation officielle Dolibarr : https://wiki.dolibarr.org/index.php/REST_API

## Architecture de l'intégration

L'application utilise maintenant une architecture à 3 niveaux :

1. **Pages Next.js (Client)** → Affichent les données
2. **Routes API Next.js (Serveur)** → `/api/clients`, `/api/factures`, `/api/devis`, `/api/produits`
3. **API Dolibarr (Serveur distant)** → Données source

Cette architecture évite les problèmes CORS et sécurise mieux votre clé API (qui reste côté serveur).

## Fonctionnalités disponibles

Une fois connecté à Dolibarr, vous pouvez :

✅ **Clients**
- Afficher la liste des clients depuis Dolibarr
- Créer de nouveaux clients dans Dolibarr
- Voir les détails d'un client

✅ **Factures & Devis**
- Afficher les factures depuis Dolibarr
- Afficher les devis (propositions commerciales) depuis Dolibarr
- Créer des factures/devis depuis une réparation

✅ **Stock**
- Afficher les produits depuis Dolibarr
- Voir les niveaux de stock
- Alertes de stock bas

✅ **Réparations**
- Créer des réparations liées à des clients Dolibarr
- Générer des factures/devis Dolibarr depuis une réparation
- Historique et suivi des réparations (stocké en base de données locale)

## Prochaines améliorations

- Synchronisation bidirectionnelle des clients
- Synchronisation des factures et devis en base locale
- Mise à jour automatique des stocks lors de l'ajout de pièces
- Webhooks pour synchronisation temps réel
