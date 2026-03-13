# Résumé des modifications - Intégration Dolibarr

## Problème initial

Les listes de clients, factures et devis n'affichaient pas les données de Dolibarr mais des données de démonstration en dur.

## Cause

Les pages Next.js appelaient directement l'API Dolibarr depuis le navigateur (côté client), ce qui causait :
- Problèmes CORS (Cross-Origin Resource Sharing)
- Exposition de la clé API dans le navigateur
- Fallback automatique vers des données de démo en cas d'erreur

## Solution implémentée

### 1. Routes API côté serveur

Création de routes API Next.js qui font le pont entre le frontend et Dolibarr :

- **`/api/clients`** (GET, POST) - Liste et création de clients
- **`/api/clients/[id]`** (GET, PUT) - Détails et modification d'un client
- **`/api/factures`** (GET, POST) - Liste et création de factures
- **`/api/devis`** (GET, POST) - Liste et création de devis
- **`/api/produits`** (GET, POST) - Liste et création de produits

### 2. Mise à jour des pages

Les pages suivantes ont été modifiées pour utiliser les nouvelles routes API :

- **`src/app/clients/page.tsx`** - Liste des clients
- **`src/app/clients/[id]/page.tsx`** - Détail d'un client
- **`src/app/clients/nouveau/page.tsx`** - Création de client
- **`src/app/factures/page.tsx`** - Liste des factures et devis
- **`src/app/stock/page.tsx`** - Liste des produits
- **`src/app/reparations/nouveau/page.tsx`** - Nouvelle réparation (charge les clients)

### 3. Affichage des erreurs

Ajout d'un affichage d'erreur élégant dans toutes les pages au lieu du fallback vers des données de démo :
- Message d'erreur clair
- Instructions pour vérifier la configuration
- Bouton "Réessayer"

### 4. Corrections TypeScript

- Ajout du typage `any` pour les paramètres de fonctions map/reduce dans les routes API
- Correction des catch blocks avec `error: any`
- Protection contre les valeurs undefined (`montant_final || 0`)
- Correction de la corruption de code dans `reparations/[id]/page.tsx`

## Avantages

✅ **Sécurité** : La clé API Dolibarr reste côté serveur  
✅ **CORS** : Plus de problèmes de cross-origin  
✅ **Fiabilité** : Affichage d'erreurs explicites au lieu de données factices  
✅ **Maintenabilité** : Centralisation de la logique API  
✅ **Traçabilité** : Logs serveur des erreurs Dolibarr  

## Architecture

```
┌─────────────────┐
│  Page Next.js   │ (Client)
│  (navigateur)   │
└────────┬────────┘
         │ fetch('/api/...')
         ▼
┌─────────────────┐
│  Route API      │ (Serveur Next.js)
│  /api/...       │
└────────┬────────┘
         │ dolibarrAPI.get...()
         ▼
┌─────────────────┐
│ API Dolibarr    │ (Serveur externe)
│ /api/index.php  │
└─────────────────┘
```

## Documentation ajoutée

- **`GUIDE_DOLIBARR.md`** - Guide complet de configuration Dolibarr avec :
  - Activation du module API REST
  - Génération de clé API
  - Configuration des permissions
  - Résolution des problèmes courants
  - Test de connexion

## Problème Dolibarr actuel

L'API Dolibarr renvoie une erreur 503 : **"Unknown column 'name' in 'ORDER BY'"**

### Cause possible

Le champ de tri `name` n'existe peut-être pas ou n'est pas le bon nom de colonne dans la version de Dolibarr utilisée.

### Solution

Modifier le paramètre `sortfield` dans les routes API :
- Essayer `rowid` au lieu de `name` pour les clients
- Essayer `nom` au lieu de `name`
- Ou retirer temporairement le paramètre sortfield

### Fichiers à modifier

**`src/app/api/clients/route.ts`** ligne 12 :
```typescript
const sortfield = searchParams.get('sortfield') || 'rowid'; // Au lieu de 'name'
```

## Test de la connexion

Pour tester manuellement l'API Dolibarr :

```bash
curl -X GET "https://dolibarr.nathanvernet.com/dolibarr/api/index.php/thirdparties?limit=5" \
  -H "DOLAPIKEY: votre_cle_api_dolibarr"
```

Si l'erreur persiste, consulter la documentation Dolibarr ou les logs du serveur.

## Prochaines étapes recommandées

1. Résoudre l'erreur de tri dans l'API Dolibarr
2. Tester toutes les fonctionnalités (création, modification, suppression)
3. Ajuster les affichages selon les données réelles de Dolibarr
4. Implémenter la synchronisation bidirectionnelle (si nécessaire)
5. Ajouter la gestion du cache pour améliorer les performances

## Fichiers modifiés

### Créés
- `src/app/api/clients/route.ts`
- `src/app/api/clients/[id]/route.ts`
- `src/app/api/factures/route.ts`
- `src/app/api/devis/route.ts`
- `src/app/api/produits/route.ts`
- `GUIDE_DOLIBARR.md`
- `MODIFICATIONS.md` (ce fichier)

### Modifiés
- `src/app/clients/page.tsx`
- `src/app/clients/[id]/page.tsx`
- `src/app/clients/nouveau/page.tsx`
- `src/app/factures/page.tsx`
- `src/app/stock/page.tsx`
- `src/app/reparations/nouveau/page.tsx`
- `src/app/reparations/[id]/page.tsx`
- Corrections TypeScript dans plusieurs routes API

## État actuel

✅ **Compilation** : Succès, aucune erreur TypeScript  
❌ **Connexion Dolibarr** : Erreur 503 sur le tri des clients  
📝 **Documentation** : Guide complet de configuration Dolibarr créé  
🔧 **Action requise** : Ajuster le champ de tri dans l'API Dolibarr  
