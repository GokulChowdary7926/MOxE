#!/usr/bin/env bash
# =============================================================================
# MOxE — quick redeploy on EC2 after `git pull` (no full system setup).
# Run ON THE SERVER via SSH (same layout as deploy-ec2-moxe.sh: /var/www/moxe).
#
# Usage (example):
#   export MOXE_PUBLIC_IP="13.126.171.152"
#   export MOXE_BRANCH="main"
#   bash scripts/ec2-redeploy-app.sh
# =============================================================================
set -euo pipefail

MOXE_ROOT="${MOXE_ROOT:-/var/www/moxe}"
MOXE_BRANCH="${MOXE_BRANCH:-main}"
MOXE_PUBLIC_IP="${MOXE_PUBLIC_IP:?Set MOXE_PUBLIC_IP to the server public IP (for VITE_API_URL).}"

BACKEND_DIR="${MOXE_ROOT}/BACKEND"
FRONTEND_DIR="${MOXE_ROOT}/FRONTEND"
HTML_ROOT="${HTML_ROOT:-/var/www/html}"

echo "==> Pull latest (${MOXE_BRANCH}) at ${MOXE_ROOT}"
cd "$MOXE_ROOT"
git fetch origin
git checkout "$MOXE_BRANCH"
git pull origin "$MOXE_BRANCH"

MOXE_NODE_HEAP_DEFAULT='--max-old-space-size=2048'
export NODE_OPTIONS="${NODE_OPTIONS:-$MOXE_NODE_HEAP_DEFAULT}"

echo "==> Backend build + PM2"
cd "$BACKEND_DIR"
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart moxe-api 2>/dev/null || pm2 start dist/server.js --name moxe-api --time
pm2 save

echo "==> Frontend build + Nginx static"
cd "$FRONTEND_DIR"
npm install --no-audit --no-fund
echo "VITE_API_URL=http://${MOXE_PUBLIC_IP}/api" > .env.production
npm run build
sudo mkdir -p "$HTML_ROOT"
sudo rm -rf "${HTML_ROOT}"/*
sudo cp -r "${FRONTEND_DIR}/dist/"* "$HTML_ROOT/"
sudo chown -R www-data:www-data "$HTML_ROOT"

sudo nginx -t
sudo systemctl reload nginx

echo "==> Smoke"
curl -sS -o /dev/null -w "GET /api/health/live -> %{http_code}\n" "http://127.0.0.1/api/health/live" || true
echo "Done."
