# RepairInfo

Documentation officielle: https://wiki.repairinfo.nathanvernet.fr

Le detail fonctionnel, les guides d'installation, l'exploitation et les procedures sont centralises sur le wiki.

## Demarrage rapide (local)

Prerequis:
- Node.js 18+
- npm

Commandes:
```bash
npm install
npm run build
npm run dev
```

Application locale:
- http://localhost:3000
- Configuration initiale: http://localhost:3000/setup

## Deploiement Ubuntu (daemon)

Scripts disponibles:
- scripts/install-ubuntu-daemon.sh
- scripts/install-ubuntu-quick.sh

One-liner (repo GitHub):
```bash
curl -fsSL https://raw.githubusercontent.com/NathanVNT/RepairInfo/main/scripts/install-ubuntu-quick.sh | sudo bash -s -- \
  --repo-url https://github.com/NathanVNT/RepairInfo.git \
  --branch main \
  --app-dir /opt/RepairInfo \
  --app-user www-data \
  --port 3000 \
  --service-name repairinfo
```

## Securite

- Ne jamais committer de secrets dans le depot.
- Utiliser le fichier .env local serveur et la page /setup pour la configuration.

## Support

Pour toute doc projet: https://wiki.repairinfo.nathanvernet.fr
