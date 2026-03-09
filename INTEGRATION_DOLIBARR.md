# 🔗 Intégration Dolibarr - Guide Complet

## Vue d'ensemble

L'application est maintenant **entièrement intégrée avec Dolibarr** pour :
- ✅ **Clients (Tiers)** - Créés et stockés dans Dolibarr
- ✅ **Factures** - Générées automatiquement depuis les réparations
- ✅ **Devis** - Créés automatiquement avec les pièces et montants
- ✅ **Réparations** - Stockées localement (SQLite) avec liens vers Dolibarr

## Architecture d'intégration

```
┌─────────────────────────────────────────┐
│      Application Atelier                │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │  Interface Web (Next.js)        │  │
│  └──────────────┬──────────────────┘  │
│                 │                      │
│  ┌──────────────┴──────────────────┐  │
│  │  API Routes                     │  │
│  │  - /api/reparations/*          │  │
│  │  - /api/clients/sync           │  │
│  └──────┬──────────────┬───────────┘  │
│         │              │              │
│  ┌──────▼─────┐ ┌─────▼──────────┐   │
│  │  Prisma    │ │ Dolibarr API   │   │
│  │  (SQLite)  │ │   Client       │   │
│  └────────────┘ └────────┬────────┘   │
└──────────────────────────│─────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   Dolibarr     │
                  │   REST API     │
                  │                │
                  │ - Tiers        │
                  │ - Factures     │
                  │ - Devis        │
                  │ - Produits     │
                  └────────────────┘
```

## Flux de données

### 1. Création de Client

**Workflow :**
```
1. Utilisateur remplit le formulaire (/clients/nouveau)
2. Clic sur "Créer le client"
3. API POST /api/clients/sync
4. dolibarrAPI.createThirdParty() → Dolibarr
5. Client créé dans Dolibarr avec ID unique
6. ID retourné et utilisé dans l'application
```

**Code :**
```typescript
// Dans /clients/nouveau/page.tsx
const newClient = await dolibarrAPI.createThirdParty({
  name: "Dupont Jean",
  email: "jean@example.com",
  phone: "0612345678",
  client: "1" // 1 = client
});
// Retourne l'ID Dolibarr
```

### 2. Création de Réparation

**Workflow :**
```
1. Utilisateur sélectionne un client (depuis Dolibarr)
2. Remplit les détails de la réparation
3. API POST /api/reparations
4. Réparation stockée dans SQLite avec client_id (Dolibarr)
5. Historique créé automatiquement
```

**Données stockées localement :**
- Référence réparation (REP-2026-00001)
- Informations appareil
- État et suivi
- Historique complet
- Pièces utilisées

**Lien avec Dolibarr :**
- `client_id` → ID du tiers dans Dolibarr
- `facture_id` → ID de la facture (quand créée)
- `devis_id` → ID du devis (quand créé)

### 3. Création de Devis

**Workflow :**
```
1. Page réparation → Bouton "Créer un devis"
2. API POST /api/reparations/[id]/devis
3. Récupération de la réparation depuis SQLite
4. dolibarrAPI.createProposal() → Dolibarr
5. Ajout des lignes (réparation + pièces)
6. Mise à jour réparation avec devis_id
7. Entrée dans l'historique
```

**Contenu du devis :**
- Client (socid depuis client_id)
- Date et durée de validité
- Description de la panne
- Ligne principale : Diagnostic + réparation
- Lignes pièces : Depuis pieces_utilisees
- Montant estimé

**Exemple de création :**
```typescript
// API route
const proposal = await dolibarrAPI.createProposal({
  socid: reparation.client_id,
  date: Math.floor(Date.now() / 1000),
  fin_validite: now + (30 * 24 * 60 * 60), // 30 jours
  note_public: `Devis pour ${reparation.ref}...`
});

// Ajouter la ligne principale
await dolibarrAPI.addProposalLine(proposalId, {
  desc: "Diagnostic et réparation...",
  subprice: reparation.montant_estime,
  qty: 1,
  tva_tx: 20
});
```

### 4. Création de Facture

**Workflow :**
```
1. Page réparation → Bouton "Créer une facture"
2. API POST /api/reparations/[id]/facture
3. Récupération de la réparation depuis SQLite
4. dolibarrAPI.createInvoice() → Dolibarr
5. Ajout des lignes (réparation + pièces)
6. Mise à jour réparation avec facture_id
7. Entrée dans l'historique
```

**Contenu de la facture :**
- Client (socid)
- Date de création
- Type : 0 = standard, 2 = avoir
- Notes publiques/privées
- Lignes : Réparation + toutes les pièces utilisées
- Montant final

**Exemple :**
```typescript
const invoice = await dolibarrAPI.createInvoice({
  socid: reparation.client_id,
  type: 0,
  date: Math.floor(Date.now() / 1000),
  note_public: `Réparation ${reparation.ref}...`
});

// Ligne principale
await dolibarrAPI.addInvoiceLine(invoiceId, {
  desc: "Réparation PC portable...",
  subprice: reparation.montant_final,
  qty: 1,
  tva_tx: 20
});

// Pièces
for (const piece of pieces_utilisees) {
  await dolibarrAPI.addInvoiceLine(invoiceId, {
    fk_product: piece.product_id,
    desc: piece.product_label,
    subprice: piece.prix_unitaire,
    qty: piece.quantite,
    tva_tx: 20
  });
}
```

## API Routes créées

### `/api/reparations/[id]/devis`

**POST** - Créer un devis depuis une réparation
```json
{
  "auteur": "Nom du technicien",
  "duree_validite": 30  // optionnel, par défaut 30 jours
}
```

**Réponse :**
```json
{
  "success": true,
  "proposal_id": "123",
  "message": "Devis créé avec succès dans Dolibarr"
}
```

**GET** - Récupérer le devis lié
```
GET /api/reparations/[id]/devis
```

---

### `/api/reparations/[id]/facture`

**POST** - Créer une facture depuis une réparation
```json
{
  "auteur": "Nom du technicien",
  "type": 0  // 0=standard, 2=avoir
}
```

**Réponse :**
```json
{
  "success": true,
  "invoice_id": "456",
  "message": "Facture créée avec succès dans Dolibarr"
}
```

**GET** - Récupérer la facture liée
```
GET /api/reparations/[id]/facture
```

---

### `/api/clients/sync`

**POST** - Créer un client dans Dolibarr
```json
{
  "name": "Dupont Jean",
  "name_alias": "Jean",
  "email": "jean@example.com",
  "phone": "0612345678",
  "address": "10 rue de Paris",
  "zip": "75001",
  "town": "Paris",
  "client_type": "1"  // 1=client, 2=prospect, 3=les deux
}
```

**Réponse :**
```json
{
  "success": true,
  "client_id": "789",
  "message": "Client créé avec succès dans Dolibarr"
}
```

**GET** - Récupérer un client
```
GET /api/clients/sync?client_id=789
```

## Interface utilisateur

### Page de détail réparation

**Section "Actions Dolibarr" :**

1. **Avant création :** Boutons "Créer un devis" / "Créer une facture"
2. **Pendant création :** Animation de chargement
3. **Après création :** Liens "Voir le devis" / "Voir la facture"
4. **Clic sur lien :** Ouvre Dolibarr dans un nouvel onglet

**Exemple visuel :**
```
┌─────────────────────────────────┐
│  Actions Dolibarr              │
│                                 │
│  ┌─────────────────────────┐   │
│  │  ✓ Voir le devis    🔗  │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │  + Créer une facture    │   │
│  └─────────────────────────┘   │
│                                 │
│  Les documents s'ouvrent dans  │
│  Dolibarr                      │
└─────────────────────────────────┘
```

## Données liées

### Table Reparation (SQLite)

| Champ         | Type    | Lien Dolibarr                          |
|---------------|---------|----------------------------------------|
| `client_id`   | String  | → `thirdparties.id`                   |
| `facture_id`  | String? | → `invoices.id`                       |
| `devis_id`    | String? | → `proposals.id`                      |

### Historique automatique

Chaque action Dolibarr crée une entrée d'historique :
- ✅ "Devis créé (ID: 123)"
- ✅ "Facture créée (ID: 456)"
- ✅ Visible par le client

## Gestion des erreurs

### Erreurs possibles

1. **API Dolibarr non configurée**
```json
{
  "error": "Configuration Dolibarr manquante"
}
```
→ Vérifier `.env.local`

2. **Client introuvable**
```json
{
  "error": "Client non trouvé dans Dolibarr"
}
```
→ Vérifier que le client_id existe

3. **Réparation déjà facturée**
- Le bouton "Créer une facture" n'est plus visible
- Un lien vers la facture existante s'affiche

4. **Erreur réseau Dolibarr**
```json
{
  "error": "Erreur lors de la création",
  "details": "Network timeout"
}
```
→ Vérifier la connectivité avec Dolibarr

### Mode dégradé

Si Dolibarr est inaccessible :
- ✅ Les réparations continuent de fonctionner (SQLite local)
- ⚠️ Création de devis/factures échoue avec message d'erreur
- ℹ️ Les données restent dans la base locale

## Configuration requise

### Variables d'environnement

```env
# Dolibarr
NEXT_PUBLIC_DOLIBARR_URL=https://votre-dolibarr.com
NEXT_PUBLIC_DOLIBARR_API_KEY=votre_cle_api

# Base de données
DATABASE_URL="file:./prisma/dev.db"
```

### Permissions Dolibarr

L'utilisateur API doit avoir :
- ✅ Lecture/Écriture sur **Tiers**
- ✅ Lecture/Écriture sur **Factures**
- ✅ Lecture/Écriture sur **Propositions commerciales**
- ✅ Lecture sur **Produits** (pour les pièces)

## Tests

### Tester la création de devis

1. Créer un client dans `/clients/nouveau`
2. Noter l'ID Dolibarr retourné
3. Créer une réparation avec ce client
4. Ajouter des pièces utilisées
5. Cliquer sur "Créer un devis"
6. Vérifier dans Dolibarr que le devis existe

### Tester la création de facture

1. Terminer une réparation
2. S'assurer qu'elle a un `montant_final`
3. Cliquer sur "Créer une facture"
4. Vérifier que la facture contient :
   - Le client
   - La description de la réparation
   - Toutes les pièces
   - Le montant correct

### Vérifier les liens

```sql
-- Dans SQLite
SELECT ref, client_id, devis_id, facture_id 
FROM Reparation 
WHERE devis_id IS NOT NULL OR facture_id IS NOT NULL;
```

```sql
-- Dans Dolibarr (MySQL)
SELECT ref, socid, total_ttc 
FROM llx_facture 
WHERE note_private LIKE '%REP-2026%';
```

## Bonnes pratiques

### 1. Créer le devis avant la facture

```
1. Créer réparation
2. Créer un devis → Client valide
3. Effectuer la réparation
4. Créer une facture → Client paye
```

### 2. Synchronisation des montants

- `montant_estime` → Devis
- `montant_final` → Facture
- Toujours calculer automatiquement avec les pièces

### 3. Historique

Chaque action Dolibarr doit être tracée :
```typescript
await prisma.reparationHistorique.create({
  reparation_id: id,
  action: 'Facture créée',
  description: `Facture Dolibarr créée (ID: ${id})`,
  auteur: 'Jean Martin',
  visible_client: true
});
```

### 4. Gestion des erreurs

```typescript
try {
  await createInvoice();
} catch (error) {
  // Logger l'erreur
  console.error('Erreur Dolibarr:', error);
  
  // Informer l'utilisateur
  alert('Erreur lors de la création. Vérifiez Dolibarr.');
  
  // Ne pas crasher l'application
  // La réparation reste valide
}
```

## Évolutions futures

### Synchronisation bidirectionnelle

- Importer des factures Dolibarr vers l'app
- Mettre à jour les statuts depuis Dolibarr
- Webhooks pour notifications temps réel

### Paiements

- Lier les paiements Dolibarr
- Afficher l'état de paiement dans la réparation
- Relances automatiques

### Statistiques

- CA par technicien (depuis factures Dolibarr)
- Taux de conversion devis → factures
- Délai moyen de réparation

## Support

Pour tout problème d'intégration :

1. Vérifier les logs navigateur (Console)
2. Vérifier les logs serveur (`npm run dev`)
3. Tester l'API Dolibarr directement
4. Consulter la doc Dolibarr : https://wiki.dolibarr.org/

---

**L'intégration est maintenant complète ! 🎉**

Tous les clients, devis et factures sont synchronisés avec Dolibarr.
