# Guide de Configuration Dolibarr

Ce guide vous explique comment configurer Dolibarr pour qu'il fonctionne avec l'application Atelier Informatique.

## 1. Activation de l'API REST

### Étape 1 : Activer le module API

1. Connectez-vous à Dolibarr en tant qu'administrateur
2. Allez dans **Configuration → Modules/Applications**
3. Dans la barre de recherche, tapez "API"
4. Trouvez le module **API/WebServices** et cliquez sur **Activer**

### Étape 2 : Configurer l'API REST

1. Allez dans **Configuration → API/WebServices**
2. Dans l'onglet **REST API** :
   - Cochez **Activer l'API REST**
   - Dans "Autorisations CORS", ajoutez votre domaine : `http://localhost:3000` (développement) ou votre domaine de production
   - Exemple : `https://mon-atelier.com`

## 2. Générer une Clé API

### Créer un utilisateur API (recommandé)

Il est recommandé de créer un utilisateur dédié pour l'API :

1. Allez dans **Utilisateurs & Groupes → Nouvel utilisateur**
2. Remplissez les informations :
   - Login : `api_atelier`
   - Prénom/Nom : `API` / `Atelier Informatique`
   - Email : votre email
3. Définissez un mot de passe fort
4. **NE PAS** cocher "Administrateur"

### Attribuer les permissions

Dans l'onglet **Permissions** de l'utilisateur, cochez :

**Module Produits/Services :**
- ✅ Lire les produits/services
- ✅ Créer/modifier les produits/services
- ✅ Supprimer les produits/services

**Module Tiers (Clients) :**
- ✅ Lire les tiers
- ✅ Créer/modifier les tiers

**Module Factures :**
- ✅ Lire les factures clients
- ✅ Créer/modifier les factures clients
- ✅ Valider les factures clients
- ✅ Envoyer les factures par email

**Module Propositions commerciales :**
- ✅ Lire les propositions commerciales
- ✅ Créer/modifier les propositions commerciales
- ✅ Valider les propositions commerciales

**Module Stocks :**
- ✅ Lire les stocks
- ✅ Gérer les mouvements de stock

### Générer le token

1. Cliquez sur le nom de l'utilisateur créé
2. Allez dans l'onglet **Token API**
3. Cliquez sur **Générer un nouveau token**
4. **IMPORTANT** : Copiez immédiatement le token généré (il ne sera plus jamais affiché)
5. Collez-le dans votre fichier `.env.local` :
   ```env
   NEXT_PUBLIC_DOLIBARR_API_KEY=votre_token_ici
   ```

## 3. Configuration des Entrepôts (Stock)

Pour gérer les stocks, vous devez avoir au moins un entrepôt :

1. Allez dans **Produits/Services → Entrepôts**
2. Cliquez sur **Nouvel entrepôt**
3. Remplissez :
   - Libellé : `Stock principal`
   - Emplacement/Adresse : Adresse de votre atelier
4. Cliquez sur **Créer**

Notez l'ID de l'entrepôt (visible dans l'URL), vous en aurez besoin pour les mouvements de stock.

## 4. Champs Personnalisés pour les Réparations

Les réparations peuvent utiliser les champs personnalisés de Dolibarr.

### Option A : Utiliser les Propositions Commerciales (Devis)

C'est l'option recommandée. Chaque réparation peut être liée à une proposition commerciale.

1. Allez dans **Configuration → Modules/Applications**
2. Activez le module **Propositions commerciales**
3. Allez dans **Configuration → Champs personnalisés**
4. Sélectionnez **Propositions commerciales**
5. Créez les champs suivants :

| Nom du champ | Type | Valeurs (si liste) |
|--------------|------|-------------------|
| `appareil` | Texte court | - |
| `marque` | Texte court | - |
| `modele` | Texte court | - |
| `numero_serie` | Texte court | - |
| `description_panne` | Zone de texte | - |
| `statut_reparation` | Liste déroulante | En attente, Diagnostic, En réparation, En attente pièce, Terminée, Livrée |
| `priorite` | Liste déroulante | Basse, Normale, Haute, Urgente |
| `technicien` | Texte court | - |

### Option B : Utiliser une Table Personnalisée

Pour une solution plus avancée, vous pouvez créer une table MySQL dédiée dans la base Dolibarr :

```sql
CREATE TABLE llx_atelier_reparations (
  rowid INT AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(30) NOT NULL UNIQUE,
  fk_soc INT NOT NULL,
  appareil VARCHAR(255),
  marque VARCHAR(100),
  modele VARCHAR(100),
  numero_serie VARCHAR(100),
  description_panne TEXT,
  date_depot DATE,
  date_prevue DATE,
  date_fin DATE,
  statut VARCHAR(50),
  priorite VARCHAR(50),
  montant_estime DECIMAL(10,2),
  montant_final DECIMAL(10,2),
  technicien VARCHAR(100),
  fk_facture INT,
  fk_propal INT,
  note_interne TEXT,
  note_client TEXT,
  INDEX idx_soc (fk_soc),
  INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE llx_atelier_reparations_historique (
  rowid INT AUTO_INCREMENT PRIMARY KEY,
  fk_reparation INT NOT NULL,
  date_action DATETIME NOT NULL,
  action VARCHAR(100),
  description TEXT,
  auteur VARCHAR(100),
  visible_client TINYINT(1) DEFAULT 0,
  INDEX idx_reparation (fk_reparation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Vous devrez ensuite créer un module Dolibarr personnalisé ou utiliser les endpoints SQL personnalisés.

## 5. Configuration des Taxes (TVA)

1. Allez dans **Configuration → Dictionnaires**
2. Cliquez sur **Taux de TVA**
3. Vérifiez que les taux dont vous avez besoin sont présents :
   - TVA 20% (taux normal)
   - TVA 10% (taux réduit)
   - TVA 5.5% (taux super réduit)
   - etc.

## 6. Test de la Configuration

### Test avec curl

Testez votre API avec curl (remplacez les valeurs) :

```bash
curl -X GET "https://votre-dolibarr.com/api/index.php/products?limit=1" \
  -H "DOLAPIKEY: votre_token_api"
```

Vous devriez recevoir une réponse JSON avec la liste des produits.

### Test depuis l'application

1. Configurez votre `.env.local`
2. Lancez l'application : `npm run dev`
3. Allez sur `http://localhost:3000`
4. Naviguez vers "Stock" ou "Factures"
5. Si des données s'affichent, la configuration est correcte !

## 7. Sécurité

### Recommandations de sécurité :

1. **Utilisez HTTPS** en production
2. **Limitez les CORS** aux domaines nécessaires uniquement
3. **Permissions minimales** : donnez uniquement les permissions nécessaires à l'utilisateur API
4. **Rotation des tokens** : renouvelez régulièrement les clés API
5. **Logs** : activez les logs API dans Dolibarr pour surveiller l'utilisation
6. **IP whitelist** : si possible, limitez l'accès API aux IPs de votre serveur

### Configuration HTTPS avec Let's Encrypt

Si vous hébergez Dolibarr sur votre propre serveur :

```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-apache

# Génération du certificat
sudo certbot --apache -d votre-dolibarr.com
```

## 8. Maintenance

### Sauvegarde régulière

Configurez des sauvegardes automatiques :
1. Base de données MySQL
2. Fichiers Dolibarr (documents, images)

### Mises à jour

1. Maintenez Dolibarr à jour pour bénéficier des dernières fonctionnalités et correctifs
2. Testez toujours les mises à jour sur un environnement de test avant la production
3. Sauvegardez avant chaque mise à jour

## 9. Dépannage

### Erreur 403 Forbidden

- Vérifiez que la clé API est valide
- Vérifiez les permissions de l'utilisateur
- Vérifiez la configuration CORS

### Erreur 401 Unauthorized

- La clé API est incorrecte ou expirée
- Régénérez une nouvelle clé API

### Erreur 404 Not Found

- L'endpoint n'existe pas
- Vérifiez la version de Dolibarr (certaines API ne sont disponibles qu'à partir de certaines versions)

### Pas de réponse / Timeout

- Vérifiez que le serveur Dolibarr est accessible
- Vérifiez les paramètres de firewall
- Vérifiez les logs Apache/Nginx

### Consulter les logs

Les logs API de Dolibarr se trouvent dans :
- `documents/install/dev.log` (en mode debug)
- Logs Apache : `/var/log/apache2/error.log`
- Logs Nginx : `/var/log/nginx/error.log`

## 10. Aller Plus Loin

### Webhook pour synchronisation temps réel

Configurez des webhooks dans Dolibarr pour être notifié en temps réel des changements :
- Nouvelle facture créée
- Produit modifié
- etc.

### Module personnalisé

Pour des fonctionnalités avancées, créez un module Dolibarr personnalisé qui expose une API dédiée pour les réparations.

### Performance

Pour améliorer les performances :
- Activez le cache dans Dolibarr
- Utilisez un cache Redis/Memcached
- Optimisez les requêtes MySQL

---

**Besoin d'aide ?**
- [Documentation officielle Dolibarr API](https://wiki.dolibarr.org/index.php/API_REST)
- [Forum Dolibarr](https://www.dolibarr.fr/forum)
