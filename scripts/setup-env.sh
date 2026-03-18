#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔧 Setting up MOxE env files in $ROOT_DIR"

if [ ! -f "$ROOT_DIR/BACKEND/.env.production" ]; then
  echo "Creating BACKEND/.env.production (copy from .env.example if present)..."
  if [ -f "$ROOT_DIR/BACKEND/.env.example" ]; then
    cp "$ROOT_DIR/BACKEND/.env.example" "$ROOT_DIR/BACKEND/.env.production"
  else
    touch "$ROOT_DIR/BACKEND/.env.production"
  fi
fi

if ! grep -q "^JWT_SECRET=" "$ROOT_DIR/BACKEND/.env.production" 2>/dev/null; then
  JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
  echo "JWT_SECRET=$JWT_SECRET" >> "$ROOT_DIR/BACKEND/.env.production"
  echo "Added JWT_SECRET to BACKEND/.env.production"
fi

if [ ! -f "$ROOT_DIR/FRONTEND/.env.production" ]; then
  echo "Creating FRONTEND/.env.production..."
  cat > "$ROOT_DIR/FRONTEND/.env.production" <<EOF
VITE_API_URL=http://localhost:5007/api
EOF
fi

echo "✅ Basic env setup complete. Review and fill in production secrets manually."

