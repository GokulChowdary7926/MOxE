#!/usr/bin/env bash
# Copy storage.service + tests to EC2, npm run build, append S3 env (no secrets), pm2 restart.
# Requires: MOXE_SSH_KEY, MOXE_EC2_HOST, and SSH access.
set -euo pipefail
MOXE_SSH_KEY="${MOXE_SSH_KEY:-${HOME}/Downloads/INDIA-MOxE.pem}"
MOXE_EC2_HOST="${MOXE_EC2_HOST:-ubuntu@54.209.157.42}"
MOXE_ROOT_REMOTE="${MOXE_ROOT_REMOTE:-/var/www/moxe}"
test -f "$MOXE_SSH_KEY" || { echo "Missing $MOXE_SSH_KEY" >&2; exit 1; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
scp -i "$MOXE_SSH_KEY" -o BatchMode=yes \
  "$ROOT/BACKEND/src/services/storage.service.ts" \
  "${MOXE_EC2_HOST}:${MOXE_ROOT_REMOTE}/BACKEND/src/services/"
scp -i "$MOXE_SSH_KEY" -o BatchMode=yes \
  "$ROOT/BACKEND/src/services/__tests__/storage.service.test.ts" \
  "${MOXE_EC2_HOST}:${MOXE_ROOT_REMOTE}/BACKEND/src/services/__tests__/"

ssh -i "$MOXE_SSH_KEY" -o BatchMode=yes "$MOXE_EC2_HOST" bash -s <<'REMOTE'
set -euo pipefail
ENV_FILE="/var/www/moxe/BACKEND/.env"
if ! grep -q '^AWS_S3_USE_EC2_ROLE=' "$ENV_FILE" 2>/dev/null; then
  {
    echo ""
    echo "# S3 — set AWS_S3_USE_EC2_ROLE=1 and attach an IAM instance profile with s3:PutObject on moxe-media/uploads/*"
    echo "# OR remove USE_EC2_ROLE and set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY instead."
    echo "AWS_S3_BUCKET=moxe-media"
    echo "AWS_REGION=us-east-1"
    echo "AWS_S3_PREFIX=uploads"
    echo "AWS_S3_USE_EC2_ROLE=1"
  } >> "$ENV_FILE"
  echo "Appended S3 (instance-role) block to .env"
else
  echo ".env already has AWS_S3_USE_EC2_ROLE — skipping append"
fi
cd /var/www/moxe/BACKEND
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=3072}"
npm run build
pm2 restart moxe-api --update-env
pm2 save
echo "Done."
REMOTE
