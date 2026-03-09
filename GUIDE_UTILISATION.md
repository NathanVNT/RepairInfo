# Notes sur l'Utilisation de l'Application

## 🎯 Flux de Travail Recommandé

### 1. Configuration Initiale
1. Accédez à `/setup` au premier lancement
2. Entrez l'URL de votre Dolibarr
3. Entrez votre clé API
4. Testez la connexion
5. Téléchargez le fichier `.env.local` généré
6. Placez-le à la racine et redémarrez le serveur

### 2. Création d'une Nouvelle Réparation

**Étape 1 : Ajouter le client (si nouveau)**
1. Aller dans "Clients" → "Nouveau client"
2. Choisir le type (Particulier ou Entreprise)
3. Remplir les informations
4. Sauvegarder

**Étape 2 : Créer la réparation**
1. Aller dans "Réparations" → "Nouvelle réparation"
2. Rechercher et sélectionner le client
3. Renseigner les informations de l'appareil
4. Utiliser le scanner pour le numéro de série (optionnel)
5. Décrire la panne
6. Définir la priorité et le statut
7. Ajouter des notes si nécessaire
8. Créer la réparation

**Étape 3 : Suivi de la réparation**
1. Accéder à la fiche de réparation
2. Ajouter des entrées à l'historique
3. Changer le statut au fur et à mesure
4. Ajouter les pièces utilisées
5. Mettre à jour les montants

**Étape 4 : Finalisation**
1. Marquer comme "Terminée"
2. Créer une facture depuis la fiche
3. Envoyer au client
4. Marquer comme "Livrée" après remise

## 📱 Scanner de Code-Barres

### Utilisation du Scanner
1. Cliquez sur le bouton "Scanner" dans le champ numéro de série
2. Autorisez l'accès à la caméra
3. Pointez la caméra vers le code-barres ou QR code
4. Le code sera automatiquement détecté et inséré

### Saisie Manuelle
Si vous ne pouvez pas scanner :
1. Cliquez sur "Saisie manuelle" dans le scanner
2. Tapez le code manuellement
3. Validez

### Types de Codes Supportés
- Code-barres standards (EAN, UPC, etc.)
- QR codes
- Codes datamatrix

## 🔐 Sécurité et Permissions

### Accès Caméra
Le scanner nécessite l'autorisation d'accès à la caméra. Voici comment l'accorder :

**Chrome/Edge :**
1. Cliquez sur l'icône de cadenas dans la barre d'adresse
2. Autorisez l'accès à la caméra
3. Rechargez la page

**Firefox :**
1. Cliquez sur l'icône dans la barre d'adresse
2. Sélectionnez "Autoriser"

**Safari :**
1. Safari → Préférences → Sites web → Caméra
2. Autorisez pour votre site

## 💡 Astuces et Bonnes Pratiques

### Gestion des Réparations
- Utilisez les priorités pour organiser votre travail
- Ajoutez des notes internes pour les détails techniques
- Utilisez les notes client pour les informations importantes à communiquer
- Marquez les entrées d'historique comme "visible client" pour la transparence

### Gestion du Stock
- Configurez des seuils d'alerte pour chaque produit
- Vérifiez régulièrement les alertes sur le tableau de bord
- Liez les pièces utilisées aux réparations pour la traçabilité

### Gestion des Clients
- Créez une fiche client détaillée dès le premier contact
- Utilisez le champ "Notes internes" pour les préférences du client
- Consultez l'historique avant chaque nouvelle réparation

### Organisation
- Commencez votre journée par le tableau de bord
- Traitez d'abord les réparations urgentes
- Vérifiez les alertes de stock
- Suivez les factures impayées

## 🚨 Actions Importantes

### Changement de Statut
Chaque changement de statut crée une entrée dans l'historique :
- **En attente** → Réception de l'appareil
- **Diagnostic** → Analyse en cours
- **En réparation** → Intervention technique
- **En attente pièce** → Commande de pièces nécessaire
- **Terminée** → Réparation effectuée
- **Livrée** → Remise au client
- **Annulée** → Annulation pour diverses raisons

### Création de Documents
- **Devis** : Créez-le dès le diagnostic
- **Facture** : Générez-la une fois la réparation terminée
- Liez toujours les documents à la réparation

## 📊 Utilisation du Tableau de Bord

Le tableau de bord vous donne une vue d'ensemble :
- **Réparations en cours** : À traiter en priorité
- **Stock** : Alertes et ruptures
- **Finances** : CA du mois et impayés
- **Clients** : Nouveaux clients
- **Alertes** : Actions requises
- **Activité récente** : Dernières actions

Consultez-le régulièrement pour ne rien manquer !

## 🔄 Synchronisation avec Dolibarr

### Données Synchronisées
- ✅ Produits et stock
- ✅ Clients (tiers)
- ✅ Factures
- ✅ Devis (propositions commerciales)

### Données Locales
- 🔸 Réparations (stockées localement ou via champs personnalisés)
- 🔸 Historique des réparations

### Rafraîchissement
Les données sont rechargées à chaque chargement de page. Pour forcer un rafraîchissement, rechargez simplement la page (F5).

## 📞 Support

En cas de problème :
1. Consultez le fichier `DOLIBARR_CONFIG.md` pour la configuration
2. Vérifiez les logs dans la console du navigateur (F12)
3. Testez la connexion API via `/setup`
4. Vérifiez que Dolibarr est accessible

## 🎓 Formation Utilisateurs

Pour former vos employés :
1. Commencez par une démo du tableau de bord
2. Montrez le cycle complet d'une réparation
3. Expliquez l'importance de l'historique
4. Formez au scanner de code-barres
5. Insistez sur la communication client (notes)

---

**Conseil** : Imprimez ce guide et gardez-le près de votre poste de travail pour référence rapide !
