#!/usr/bin/env bash
set -euo pipefail

REPO_URL=""
APP_DIR="/opt/App_Atelier_Informatique"
APP_USER="www-data"
PORT="3000"
SERVICE_NAME="app-atelier"
BRANCH="main"

print_help() {
  cat <<'EOF'
Bootstrap one-liner Ubuntu -> clone/pull repo + installation daemon systemd.

Usage:
  sudo bash install-ubuntu-quick.sh --repo-url <git-url> [options]

Required:
  --repo-url <git-url>       URL git du projet (HTTPS ou SSH)

Options:
  --app-dir <path>           Dossier d'installation (defaut: /opt/App_Atelier_Informatique)
  --app-user <user>          Utilisateur Linux pour le service (defaut: www-data)
  --port <port>              Port de l'application (defaut: 3000)
  --service-name <name>      Nom du service systemd (defaut: app-atelier)
  --branch <name>            Branche git a deployer (defaut: main)
  -h, --help                 Afficher cette aide
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --app-dir)
      APP_DIR="$2"
      shift 2
      ;;
    --app-user)
      APP_USER="$2"
      shift 2
      ;;
    --port)
      PORT="$2"
      shift 2
      ;;
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    -h|--help)
      print_help
      exit 0
      ;;
    *)
      echo "Option inconnue: $1"
      print_help
      exit 1
      ;;
  esac
done

if [[ "$EUID" -ne 0 ]]; then
  echo "Ce script doit etre execute avec sudo/root."
  exit 1
fi

if [[ -z "$REPO_URL" ]]; then
  echo "--repo-url est requis."
  print_help
  exit 1
fi

apt_update_safe() {
  local attempt=1
  local max_attempts=5

  while [[ "$attempt" -le "$max_attempts" ]]; do
    echo "apt-get update (tentative ${attempt}/${max_attempts})..."

    if apt-get \
      -o Acquire::Retries=5 \
      -o Acquire::ForceIPv4=true \
      -o Acquire::Languages=none \
      update -y; then
      return 0
    fi

    echo "Echec apt-get update, nettoyage cache listes puis nouvelle tentative..."
    rm -rf /var/lib/apt/lists/*
    sleep 3
    attempt=$((attempt + 1))
  done

  echo "Impossible d'executer apt-get update apres ${max_attempts} tentatives."
  return 1
}

echo "[1/5] Installation dependances systeme minimales..."
apt_update_safe
apt-get -o Acquire::ForceIPv4=true install -y git curl ca-certificates

echo "[2/5] Verification utilisateur Linux..."
if ! id "$APP_USER" >/dev/null 2>&1; then
  echo "Utilisateur introuvable: $APP_USER"
  exit 1
fi

echo "[3/5] Recuperation du code source..."
# Trust the target directory regardless of owner (required since git 2.35.2)
git config --global --add safe.directory '*'

if [[ -d "$APP_DIR/.git" ]]; then
  # Fix ownership BEFORE git operations so root can operate freely
  chown -R root:root "$APP_DIR"
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" checkout "$BRANCH"
  git -C "$APP_DIR" pull --ff-only origin "$BRANCH"
else
  mkdir -p "$(dirname "$APP_DIR")"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
fi

chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

echo "[4/5] Lancement install daemon..."
bash "$APP_DIR/scripts/install-ubuntu-daemon.sh" \
  --app-dir "$APP_DIR" \
  --app-user "$APP_USER" \
  --port "$PORT" \
  --service-name "$SERVICE_NAME"

echo "[5/5] Termine."
echo "Service: $SERVICE_NAME"
echo "Status : systemctl status $SERVICE_NAME"
echo "Logs   : journalctl -u $SERVICE_NAME -f"
