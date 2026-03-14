#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(pwd)"
APP_USER="www-data"
SERVICE_NAME="app-atelier"
BRANCH="main"

print_help() {
  cat <<'EOF'
Mise a jour Ubuntu (sans reinstall complete)

Usage:
  sudo bash scripts/update-ubuntu.sh [options]

Options:
  --app-dir <path>        Dossier du projet (defaut: dossier courant)
  --app-user <user>       Utilisateur Linux qui execute l'app (defaut: www-data)
  --service-name <name>   Nom du service systemd (defaut: app-atelier)
  --branch <name>         Branche git a deployer (defaut: main)
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

if [[ "${EUID}" -ne 0 ]]; then
  echo "Ce script doit etre execute avec sudo/root."
  exit 1
fi

APP_DIR="$(realpath "$APP_DIR")"
if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Depot git introuvable dans: $APP_DIR"
  exit 1
fi

if ! id "$APP_USER" >/dev/null 2>&1; then
  echo "Utilisateur Linux introuvable: $APP_USER"
  exit 1
fi

git config --system --add safe.directory '*'

mkdir -p "/tmp/.npm-${APP_USER}"
chown "$APP_USER":"$APP_USER" "/tmp/.npm-${APP_USER}"

run_as_app_user() {
  sudo -u "$APP_USER" -H env NPM_CONFIG_CACHE="/tmp/.npm-${APP_USER}" bash -lc "cd '$APP_DIR' && $*"
}

echo "[1/6] Mise a jour du code source..."
run_as_app_user "git fetch --all --prune"
run_as_app_user "git checkout '$BRANCH'"
run_as_app_user "git pull --ff-only origin '$BRANCH'"

echo "[2/6] Installation dependances npm..."
run_as_app_user "npm ci"

echo "[3/6] Prisma generate + migration deploy..."
run_as_app_user "npx prisma generate"
run_as_app_user "npx prisma migrate deploy"

echo "[4/6] Build production..."
run_as_app_user "npm run build"

echo "[5/6] Redemarrage service ${SERVICE_NAME}..."
systemctl restart "$SERVICE_NAME"

echo "[6/6] Verification service..."
systemctl --no-pager --full status "$SERVICE_NAME" | sed -n '1,12p'

echo ""
echo "Mise a jour terminee."
echo "Logs: journalctl -u $SERVICE_NAME -f"
