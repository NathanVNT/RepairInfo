# 🔑 Guide Rapide : Connexion API Dolibarr

## 📋 En résumé

Vous avez besoin de **2 choses** :
1. ✅ L'**URL** de votre Dolibarr
2. ✅ Une **clé API** (token)

---

## 🌐 Étape 1 : Trouver votre URL Dolibarr

C'est l'adresse où vous accédez à Dolibarr dans votre navigateur.

**Exemples :**
- `http://localhost/dolibarr` (installation locale)
- `https://mon-entreprise.dolibarr.com` (cloud)
- `https://erp.mon-site.fr` (serveur perso)

**À mettre dans `.env.local` :**
```env
NEXT_PUBLIC_DOLIBARR_URL=https://votre-adresse-dolibarr.com
```

⚠️ **Sans le `/htdocs` à la fin !**

---

## 🔐 Étape 2 : Activer l'API REST dans Dolibarr

### 2.1 Activer le module API

```
┌─────────────────────────────────────────┐
│  Dolibarr                               │
└─────────────────────────────────────────┘

1. Connectez-vous en tant qu'ADMINISTRATEUR

2. Cliquez sur "Configuration" (⚙️ en haut à droite)
   ↓
3. Cliquez sur "Modules/Applications"
   ↓
4. Dans la barre de recherche, tapez "API"
   ↓
5. Trouvez "API/WebServices"
   ↓
6. Cliquez sur le bouton ON/OFF pour l'activer
   
   ✅ Le module doit être en VERT
```

### 2.2 Activer l'API REST

```
1. Toujours dans "Configuration"
   ↓
2. Cliquez sur "API/WebServices" (dans le menu)
   ↓
3. Onglet "REST API"
   ↓
4. ☑️ Cochez "Activer l'API REST"
   ↓
5. Dans "Autorisations CORS", ajoutez :
   http://localhost:3000
   ↓
6. Cliquez sur "Enregistrer"
   
   ✅ L'API REST est maintenant active !
```

---

## 🔑 Étape 3 : Générer votre clé API

### Option A : Utiliser votre compte actuel (Simple)

```
1. Cliquez sur votre NOM (en haut à droite)
   ↓
2. Vous êtes sur votre fiche utilisateur
   ↓
3. Cliquez sur l'onglet "Token API"
   ↓
4. Cliquez sur "Générer un nouveau token"
   ↓
5. Une clé apparaît comme :
   
   ┌────────────────────────────────────────┐
   │  Token API généré :                    │
   │                                        │
   │  1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7    │
   │                                        │
   │  ⚠️ Copiez-le maintenant ! Il ne sera │
   │  plus jamais affiché.                 │
   └────────────────────────────────────────┘
   
6. COPIEZ immédiatement ce token !
```

**⚠️ IMPORTANT : Copiez le token immédiatement, vous ne pourrez plus le voir après !**

### Option B : Créer un utilisateur dédié API (Recommandé pour production)

```
1. Configuration → Utilisateurs & Groupes
   ↓
2. Cliquer "Nouvel utilisateur"
   ↓
3. Remplir :
   - Login : api_atelier
   - Nom : API Atelier
   - Email : votre-email@exemple.com
   - Mot de passe : (créer un mot de passe fort)
   ↓
4. Onglet "Permissions" :
   
   ☑️ Tiers → Lire, Créer/modifier
   ☑️ Produits → Lire, Créer/modifier
   ☑️ Factures → Lire, Créer/modifier, Valider
   ☑️ Propositions → Lire, Créer/modifier, Valider
   ☑️ Stocks → Lire, Gérer mouvements
   ↓
5. Cliquer "Créer"
   ↓
6. Sur la fiche du nouvel utilisateur :
   Onglet "Token API" → "Générer un nouveau token"
   ↓
7. COPIER le token généré
```

---

## 📝 Étape 4 : Configurer l'application

### 4.1 Modifier le fichier `.env.local`

Ouvrez le fichier `.env.local` à la racine du projet :

```env
# Configuration Dolibarr API
NEXT_PUBLIC_DOLIBARR_URL=https://votre-dolibarr.com
NEXT_PUBLIC_DOLIBARR_API_KEY=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7

# Configuration Application
NEXT_PUBLIC_APP_NAME=Atelier Informatique

# Configuration Base de Données
DATABASE_URL="file:./prisma/dev.db"
```

**Remplacez :**
- `https://votre-dolibarr.com` par votre VRAIE URL
- `1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7` par votre VRAI token

### 4.2 Redémarrer l'application

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)

# Relancer
npm run dev
```

---

## 🧪 Étape 5 : Tester la connexion

### Via l'interface de l'application

```
1. Ouvrez http://localhost:3000/setup
   ↓
2. Entrez votre URL Dolibarr
   ↓
3. Entrez votre clé API
   ↓
4. Cliquez sur "Tester la connexion"
   ↓
   
   ✅ Si tout est OK, vous verrez :
   
   ┌────────────────────────────────────┐
   │  ✓ URL accessible                 │
   │  ✓ API Key valide                 │
   │  ✓ Connexion réussie              │
   └────────────────────────────────────┘
```

### Via un outil externe (optionnel)

Vous pouvez tester avec **Postman** ou **cURL** :

```bash
curl -X GET "https://votre-dolibarr.com/api/index.php/thirdparties" \
  -H "DOLAPIKEY: votre_token_ici"
```

Si ça fonctionne, vous devriez voir une liste de clients (même vide).

---

## ❌ Problèmes fréquents

### Erreur : "API Key invalide"

**Causes possibles :**
- ✗ Le token est mal copié (espace en trop, caractère manquant)
- ✗ L'utilisateur n'a pas les permissions requises
- ✗ Le token a expiré ou a été supprimé

**Solution :**
1. Régénérer un nouveau token dans Dolibarr
2. Le copier EXACTEMENT (Ctrl+C / Ctrl+V)
3. Le coller dans `.env.local`
4. Redémarrer l'application

### Erreur : "URL non accessible"

**Causes possibles :**
- ✗ L'URL est incorrecte
- ✗ Dolibarr est éteint
- ✗ Problème réseau/firewall

**Solution :**
1. Vérifier que vous pouvez ouvrir Dolibarr dans votre navigateur
2. Vérifier l'URL dans `.env.local` (sans `/htdocs`)
3. Si Dolibarr est sur un serveur local, utiliser `http://localhost/dolibarr`

### Erreur : "CORS"

**Causes possibles :**
- ✗ Le domaine n'est pas autorisé dans Dolibarr

**Solution :**
1. Configuration → API/WebServices → REST API
2. Dans "Autorisations CORS", ajouter :
   ```
   http://localhost:3000
   ```
3. Sauvegarder

### L'application ne voit pas la clé

**Causes possibles :**
- ✗ Le fichier `.env.local` n'a pas été sauvegardé
- ✗ L'application n'a pas été redémarrée

**Solution :**
1. Sauvegarder `.env.local`
2. Arrêter le serveur (Ctrl+C)
3. Relancer `npm run dev`

---

## 📌 Récapitulatif

### Ce dont vous avez besoin :

1. ✅ **URL Dolibarr**
   - Exemple : `https://erp.mon-entreprise.fr`
   - Sans `/htdocs` à la fin

2. ✅ **Token API** (clé)
   - Généré dans Dolibarr
   - Dans votre profil → Onglet "Token API"
   - Format : `1a2b3c4d5e6f...` (environ 32-40 caractères)

3. ✅ **Permissions utilisateur**
   - Tiers (clients) : Lecture + Écriture
   - Produits : Lecture + Écriture
   - Factures : Lecture + Écriture + Validation
   - Propositions : Lecture + Écriture + Validation

### Dans `.env.local` :

```env
NEXT_PUBLIC_DOLIBARR_URL=https://votre-dolibarr.com
NEXT_PUBLIC_DOLIBARR_API_KEY=votre_token_32_caracteres
```

### Puis :

```bash
npm run dev
```

### Tester :

```
http://localhost:3000/setup
```

---

## 🆘 Besoin d'aide ?

**Si vous n'arrivez toujours pas à connecter :**

1. Vérifiez les **logs du navigateur** :
   - Ouvrir la Console (F12)
   - Onglet "Console"
   - Chercher les erreurs en rouge

2. Vérifiez les **logs du serveur** :
   - Dans le terminal où tourne `npm run dev`
   - Chercher les messages d'erreur

3. **Documents utiles :**
   - [DOLIBARR_CONFIG.md](DOLIBARR_CONFIG.md) - Configuration détaillée
   - [INTEGRATION_DOLIBARR.md](INTEGRATION_DOLIBARR.md) - Documentation technique
   - [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - Guide utilisateur

4. **Vérifier sur Dolibarr :**
   - Menu → API/WebServices → "TestAPI"
   - Tester directement les endpoints

---

**Bon courage ! Une fois configuré, tout fonctionne automatiquement ! 🎉**
