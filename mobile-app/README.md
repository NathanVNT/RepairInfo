# RepairInfo Mobile (Expo)

Application React Native dediee au projet RepairInfo.

## Prerequis

- Node.js 20+
- npm
- Serveur web RepairInfo demarre (Next.js)

## Installation

1. Copier le fichier d'environnement:

   cp .env.example .env

2. Adapter l'URL API dans .env:

   EXPO_PUBLIC_API_BASE_URL=http://IP_LOCALE_DE_TON_PC:3000

3. Installer les dependances:

   npm install

4. Lancer Expo:

   npm run start

## Lancer sur telephone

- iPhone: scanner le QR code dans Expo Go (App Store)
- Android: scanner le QR code dans Expo Go (Play Store)

## Build application native

Pour produire une vraie application installable (IPA/AAB), utilise EAS:

- npm install -g eas-cli
- eas login
- eas init
- eas build -p ios
- eas build -p android

## Ecrans inclus

- Connexion
- Liste des reparations
- Detail d'une reparation
- Scanner de reference par camera

## Phase 2 incluse

- Build iOS/Android: configuration EAS ajoutee via eas.json
- Notifications: permissions + token Expo + notification locale de test
- Scan code-barres: ecran camera pour ouvrir une reparation a partir de sa reference
- Offline sync: cache des reparations + file de mises a jour de statut en attente reseau

## Flux hors-ligne

- Si le serveur est indisponible, la liste charge les donnees en cache.
- Depuis le detail, "Marquer comme terminee" est mis en file d'attente si le serveur est offline.
- Au prochain rafraichissement online, la file est synchronisee automatiquement.

## Variables et push

- EXPO_PUBLIC_API_BASE_URL: URL du backend Next.js
- Les notifications push distantes necessitent de relier le token Expo mobile a ton backend pour envoi serveur.

## Notes importantes

- Sur mobile, ne pas utiliser localhost pour l'API.
- Utiliser l'adresse IP locale de la machine qui lance RepairInfo web.
