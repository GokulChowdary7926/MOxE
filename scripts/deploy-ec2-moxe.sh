#!/usr/bin/env bash
# =============================================================================
# MOxE — EC2 single-server deployment (Ubuntu 22.04+)
# =============================================================================
# Run ON THE EC2 INSTANCE after SSH (as ubuntu user with sudo).
#
# Usage:
#   export MOXE_GIT_URL="https://github.com/YOU/MOxE.git"   # required if code not present
#   export MOXE_PUBLIC_IP="15.135.70.106"                    # optional; defaults below
#   bash scripts/deploy-ec2-moxe.sh
#
# Or copy this repo to /var/www/moxe first (scp/rsync), then run without MOXE_GIT_URL.
#
# Idempotent: safe to re-run; secrets in ~/.moxe-secrets/ are reused.
# =============================================================================
set -euo pipefail

# --- Optional: log file -------------------------------------------------------
LOG_FILE="${MOXE_LOG_FILE:-$HOME/moxe-deploy-$(date +%Y%m%d-%H%M%S).log}"
exec > >(tee -a "$LOG_FILE") 2>&1
echo "=== MOxE deploy started at $(date -Is) ==="
echo "Log: $LOG_FILE"

on_error() {
  echo "!!! Error on line $1 (exit $2). See log: $LOG_FILE" >&2
}
trap 'on_error $LINENO $?' ERR

# =============================================================================
# CONFIGURATION (override via environment before running)
# =============================================================================
export MOXE_PUBLIC_IP="${MOXE_PUBLIC_IP:-15.135.70.106}"
export MOXE_GIT_URL="${MOXE_GIT_URL:-}"
export MOXE_BRANCH="${MOXE_BRANCH:-main}"
export MOXE_ROOT="${MOXE_ROOT:-/var/www/moxe}"
export NODE_MAJOR="${NODE_MAJOR:-18}"

BACKEND_DIR="${MOXE_ROOT}/BACKEND"
FRONTEND_DIR="${MOXE_ROOT}/FRONTEND"
SECRETS_DIR="${HOME}/.moxe-secrets"
CREDS_FILE="${SECRETS_DIR}/moxe-credentials.txt"
DB_PASSWORD_FILE="${SECRETS_DIR}/db_password.txt"
JWT_SECRET_FILE="${SECRETS_DIR}/jwt_secret.txt"
JWT_REFRESH_FILE="${SECRETS_DIR}/jwt_refresh_secret.txt"

# =============================================================================
# 1) Secrets — generate once, reuse on later runs (idempotent)
# =============================================================================
echo
echo "==> [1/12] Preparing secrets directory..."
mkdir -p "$SECRETS_DIR"
chmod 700 "$SECRETS_DIR"

if [[ -f "$DB_PASSWORD_FILE" ]]; then
  DB_PASSWORD="$(tr -d '\n' < "$DB_PASSWORD_FILE")"
  echo "    Using existing DB password from $DB_PASSWORD_FILE"
else
  # Hex-only avoids SQL/shell escaping issues
  DB_PASSWORD="$(openssl rand -hex 32)"
  printf '%s' "$DB_PASSWORD" > "$DB_PASSWORD_FILE"
  chmod 600 "$DB_PASSWORD_FILE"
  echo "    Generated DB password -> $DB_PASSWORD_FILE"
fi

if [[ -f "$JWT_SECRET_FILE" ]]; then
  JWT_SECRET="$(tr -d '\n' < "$JWT_SECRET_FILE")"
  echo "    Using existing JWT_SECRET from $JWT_SECRET_FILE"
else
  JWT_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  printf '%s' "$JWT_SECRET" > "$JWT_SECRET_FILE"
  chmod 600 "$JWT_SECRET_FILE"
  echo "    Generated JWT_SECRET -> $JWT_SECRET_FILE"
fi

if [[ -f "$JWT_REFRESH_FILE" ]]; then
  JWT_REFRESH_SECRET="$(tr -d '\n' < "$JWT_REFRESH_FILE")"
else
  JWT_REFRESH_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
  printf '%s' "$JWT_REFRESH_SECRET" > "$JWT_REFRESH_FILE"
  chmod 600 "$JWT_REFRESH_FILE"
fi

# Persist human-readable bundle (rotate file permissions)
umask 077
cat > "$CREDS_FILE" << EOF
# MOxE deployment credentials — STORE SECURELY, do not commit
# Generated/updated: $(date -Is)
# Host: ${MOXE_PUBLIC_IP}

DATABASE_USER=moxe_user
DATABASE_NAME=moxe
DATABASE_PASSWORD=${DB_PASSWORD}

DATABASE_URL=postgresql://moxe_user:${DB_PASSWORD}@localhost:5432/moxe

JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

PUBLIC_URL=http://${MOXE_PUBLIC_IP}
VITE_API_URL=/api

Files:
  ${DB_PASSWORD_FILE}
  ${JWT_SECRET_FILE}
  ${JWT_REFRESH_FILE}
EOF
chmod 600 "$CREDS_FILE"
echo "    Wrote summary -> $CREDS_FILE"

# =============================================================================
# 2) System packages — apt, NodeSource, PostgreSQL, Nginx, tools
# =============================================================================
echo
echo "==> [2/12] apt update & install base packages..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
sudo apt-get install -y --no-install-recommends \
  ca-certificates curl wget git unzip build-essential \
  nginx ufw \
  postgresql postgresql-contrib

# Node.js LTS from NodeSource (idempotent)
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_MAJOR" ]]; then
  echo "    Installing Node.js ${NODE_MAJOR}.x from NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

# PM2 global
if ! command -v pm2 >/dev/null 2>&1; then
  echo "    Installing PM2 globally..."
  sudo npm install -g pm2
fi
pm2 --version

# =============================================================================
# 3) PostgreSQL — database, user, Prisma-friendly schema permissions
# =============================================================================
echo
echo "==> [3/12] Configuring PostgreSQL..."

sudo systemctl enable postgresql
sudo systemctl start postgresql

# Escape single quotes in password for SQL literal (hex passwords have no ')
SQL_PW_ESC="${DB_PASSWORD//\'/\'\'}"

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'moxe') THEN
    CREATE DATABASE moxe;
  END IF;
END
\$\$;

DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'moxe_user') THEN
    CREATE USER moxe_user WITH PASSWORD '${SQL_PW_ESC}';
  ELSE
    ALTER USER moxe_user WITH PASSWORD '${SQL_PW_ESC}';
  END IF;
END
\$\$;

ALTER DATABASE moxe OWNER TO moxe_user;
GRANT ALL PRIVILEGES ON DATABASE moxe TO moxe_user;
SQL

sudo -u postgres psql -d moxe -v ON_ERROR_STOP=1 <<SQL
GRANT ALL ON SCHEMA public TO moxe_user;
ALTER SCHEMA public OWNER TO moxe_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO moxe_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO moxe_user;
SQL

# =============================================================================
# 4) Application tree — git clone or expect existing copy
# =============================================================================
echo
echo "==> [4/12] Ensuring application code at ${MOXE_ROOT}..."

sudo mkdir -p "$MOXE_ROOT"
sudo chown -R "${USER}:${USER}" "$MOXE_ROOT"

if [[ -n "$MOXE_GIT_URL" ]]; then
  if [[ -d "${MOXE_ROOT}/.git" ]]; then
    echo "    Updating existing git clone..."
    git -C "$MOXE_ROOT" fetch origin
    git -C "$MOXE_ROOT" checkout "$MOXE_BRANCH"
    git -C "$MOXE_ROOT" pull origin "$MOXE_BRANCH"
  else
    if [[ -n "$(ls -A "$MOXE_ROOT" 2>/dev/null)" ]]; then
      echo "    $MOXE_ROOT is not empty and has no .git — backing up to ${MOXE_ROOT}.bak.$(date +%s)"
      sudo mv "$MOXE_ROOT" "${MOXE_ROOT}.bak.$(date +%s)"
      sudo mkdir -p "$MOXE_ROOT"
      sudo chown -R "${USER}:${USER}" "$MOXE_ROOT"
    fi
    echo "    Cloning $MOXE_GIT_URL (branch $MOXE_BRANCH)..."
    git clone -b "$MOXE_BRANCH" "$MOXE_GIT_URL" "$MOXE_ROOT"
  fi
else
  if [[ ! -f "${BACKEND_DIR}/package.json" ]] || [[ ! -f "${FRONTEND_DIR}/package.json" ]]; then
    echo "ERROR: Set MOXE_GIT_URL to clone the repo, or upload MOxE so that" >&2
    echo "       ${BACKEND_DIR}/package.json and ${FRONTEND_DIR}/package.json exist." >&2
    exit 1
  fi
  echo "    Using existing files under $MOXE_ROOT (no MOXE_GIT_URL)."
fi

# =============================================================================
# 5) Backend — .env, npm ci/install, Prisma, build
# =============================================================================
echo
echo "==> [5/12] Backend: dependencies & build..."

cd "$BACKEND_DIR"

DATABASE_URL="postgresql://moxe_user:${DB_PASSWORD}@localhost:5432/moxe"
PUBLIC_URL="http://${MOXE_PUBLIC_IP}"

cat > .env <<EOF
NODE_ENV=production
PORT=5007
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
CLIENT_URL=${PUBLIC_URL}
API_URL=${PUBLIC_URL}
UPLOAD_BASE_URL=${PUBLIC_URL}
# Optional: comma-separated extra web origins for CORS + Socket.IO (custom HTTPS domain in front of this IP)
# ALLOWED_ORIGINS=https://app.yourdomain.com
# Optional: raise if many users share one IP (default 300 per 15m); health checks excluded
# API_RATE_LIMIT_MAX=300
EOF
chmod 600 .env

# Full install (includes devDependencies for prisma CLI + tsc build)
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# t3.micro: avoid OOM during tsc/vite on tiny RAM (override with NODE_OPTIONS if needed)
MOXE_NODE_HEAP_DEFAULT='--max-old-space-size=3072'
export NODE_OPTIONS="${NODE_OPTIONS:-$MOXE_NODE_HEAP_DEFAULT}"

npx prisma generate
npx prisma migrate deploy

npm run build

mkdir -p uploads
chmod 755 uploads

# =============================================================================
# 6) PM2 — run dist/server.js
# =============================================================================
echo
echo "==> [6/12] PM2 process..."

pm2 delete moxe-api 2>/dev/null || true
pm2 start dist/server.js --name moxe-api --time
pm2 save

# Register PM2 with systemd (safe to run more than once)
sudo env PATH="$PATH:/usr/bin" pm2 startup systemd -u "${USER}" --hp "${HOME}" || true
pm2 save

# =============================================================================
# 7) Frontend — Vite production build
# =============================================================================
echo
echo "==> [7/12] Frontend: build..."

cd "$FRONTEND_DIR"
# Match backend: reproducible installs from lockfile (avoids surprise dependency drift vs git main)
if [[ -f package-lock.json ]]; then
  npm ci --no-audit --no-fund || npm install --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi
echo "VITE_API_URL=/api" > .env.production
# NODE_OPTIONS from step 5 still applies if set (helps Vite on small instances)
npm run build

# =============================================================================
# 8) Nginx — SPA + /api (no trailing slash on proxy_pass) + Socket.IO + uploads
# =============================================================================
echo
echo "==> [8/12] Nginx configuration..."

sudo tee /etc/nginx/sites-available/moxe >/dev/null <<'NGINX'
# MOxE — upstream preserves /api path (proxy_pass has NO URI suffix)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 50M;

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /socket.io/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5007;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
NGINX

# Inject server_name with public IP (optional cosmetic)
sudo sed -i "s/server_name _;/server_name ${MOXE_PUBLIC_IP} _;/" /etc/nginx/sites-available/moxe

sudo ln -sf /etc/nginx/sites-available/moxe /etc/nginx/sites-enabled/moxe
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

# Deploy static assets
sudo mkdir -p /var/www/html
sudo rm -rf /var/www/html/*
sudo cp -r "${FRONTEND_DIR}/dist/"* /var/www/html/
sudo chown -R www-data:www-data /var/www/html

# =============================================================================
# 9) Firewall — UFW (SSH first)
# =============================================================================
echo
echo "==> [9/12] UFW firewall..."

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable || true
sudo ufw status verbose || true

# =============================================================================
# 10) Smoke tests — API, Nginx, Socket.IO polling transport
# =============================================================================
echo
echo "==> [10/12] Health checks..."

pass=0
fail=0

check_http() {
  local name="$1" url="$2" expect="${3:-200}"
  local code
  code=$(curl -sS -o /tmp/moxe-curl-body.txt -w '%{http_code}' "$url" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    echo "    OK  [$code] $name"
    ((pass++)) || true
  else
    echo "    FAIL [$code] $name (expected $expect)"
    ((fail++)) || true
  fi
}

sleep 2
check_http "Node /health" "http://127.0.0.1:5007/health"
check_http "Node /api/health/live" "http://127.0.0.1:5007/api/health/live"
check_http "Nginx /api/health/live" "http://127.0.0.1/api/health/live"
check_http "Nginx / (index)" "http://127.0.0.1/"

# Socket.IO v4 polling handshake (should return sid JSON)
if curl -sS "http://127.0.0.1/socket.io/?EIO=4&transport=polling" | grep -q 'sid'; then
  echo "    OK  Socket.IO polling handshake"
  ((pass++)) || true
else
  echo "    FAIL Socket.IO polling handshake"
  ((fail++)) || true
fi

# =============================================================================
# 11) Summary & security reminders
# =============================================================================
echo
echo "==> [11/12] Deployment summary"
echo "    Public URL:  http://${MOXE_PUBLIC_IP}"
echo "    Credentials: ${CREDS_FILE}"
echo "    PM2:         pm2 status  |  pm2 logs moxe-api"
echo
echo "==> [12/12] SECURITY REMINDERS:"
echo "    - Keep ${CREDS_FILE} and ~/.moxe-secrets/ private (chmod 600)."
echo "    - Rotate DB/JWT secrets if this host was ever exposed."
echo "    - For production, use HTTPS (Let's Encrypt) when you have a domain."
echo "    - Restrict SSH (port 22) to your IP in the AWS Security Group when possible."
echo

if [[ "$fail" -gt 0 ]]; then
  echo "!!! Some checks failed ($fail). Review PM2 and nginx logs." >&2
  exit 1
fi

echo "=== MOxE deploy finished OK ($pass checks passed) at $(date -Is) ==="
echo "Full log: $LOG_FILE"
exit 0
