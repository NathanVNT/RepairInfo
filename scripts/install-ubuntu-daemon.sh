#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="app-atelier"
APP_DIR="$(pwd)"
APP_USER="${SUDO_USER:-$USER}"
PORT="3000"

print_help() {
  cat <<'EOF'
Installation auto Ubuntu + service systemd (daemon)

Usage:
  sudo bash scripts/install-ubuntu-daemon.sh [options]

Options:
  --app-dir <path>        Dossier du projet (defaut: dossier courant)
  --app-user <user>       Utilisateur Linux qui executera l'app
  --port <port>           Port de l'application (defaut: 3000)
  --service-name <name>   Nom du service systemd (defaut: app-atelier)
  -h, --help              Afficher cette aide
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
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

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ce script doit etre execute avec sudo/root."
  exit 1
fi

APP_DIR="$(realpath "$APP_DIR")"
if [[ ! -d "$APP_DIR" ]]; then
  echo "Dossier introuvable: $APP_DIR"
  exit 1
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  echo "Utilisateur Linux introuvable: $APP_USER"
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

run_as_app_user() {
  sudo -u "$APP_USER" -H bash -lc "cd '$APP_DIR' && $*"
}

echo "[1/8] Installation des paquets systeme..."
apt_update_safe
apt-get -o Acquire::ForceIPv4=true install -y curl ca-certificates gnupg git build-essential sqlite3

echo "[2/8] Verification Node.js..."
NEED_NODE_INSTALL="0"
if ! command -v node >/dev/null 2>&1; then
  NEED_NODE_INSTALL="1"
else
  NODE_MAJOR="$(node -v | sed 's/v//' | cut -d. -f1)"
  if [[ "$NODE_MAJOR" -lt 18 ]]; then
    NEED_NODE_INSTALL="1"
  fi
fi

if [[ "$NEED_NODE_INSTALL" == "1" ]]; then
  echo "Installation Node.js 20 via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo "[3/8] Preparation fichier .env..."
if [[ ! -f "$APP_DIR/.env" && -f "$APP_DIR/.env.local.example" ]]; then
  cp "$APP_DIR/.env.local.example" "$APP_DIR/.env"
  chown "$APP_USER":"$APP_USER" "$APP_DIR/.env"
  echo "Fichier .env cree depuis .env.local.example"
fi

echo "[4/8] Installation dependances npm..."
run_as_app_user npm ci

echo "[5/8] Prisma generate + migration deploy..."
run_as_app_user npx prisma generate
run_as_app_user npx prisma migrate deploy

echo "[6/8] Build production..."
run_as_app_user npm run build

echo "[7/8] Creation service systemd..."
NPM_BIN="$(command -v npm)"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
TEMPLATE_PATH="$APP_DIR/scripts/app-atelier.service.template"

if [[ ! -f "$TEMPLATE_PATH" ]]; then
  echo "Template service introuvable: $TEMPLATE_PATH"
  exit 1
fi

sed \
  -e "s|{{APP_USER}}|$APP_USER|g" \
  -e "s|{{APP_DIR}}|$APP_DIR|g" \
  -e "s|{{PORT}}|$PORT|g" \
  -e "s|{{NPM_BIN}}|$NPM_BIN|g" \
  "$TEMPLATE_PATH" > "$SERVICE_FILE"

echo "[8/8] Activation service ${SERVICE_NAME}..."
systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "Installation terminee."
echo "Service: $SERVICE_NAME"
echo "Status : systemctl status $SERVICE_NAME"
echo "Logs   : journalctl -u $SERVICE_NAME -f"
echo "URL    : http://localhost:$PORT"
