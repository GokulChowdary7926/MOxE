#!/usr/bin/env bash
# Append S3 variables to /var/www/moxe/BACKEND/.env on EC2 (skips if AWS_S3_BUCKET already set).
#
# Run on YOUR Mac in Terminal.app (export credentials first; do not commit them):
#   export AWS_ACCESS_KEY_ID="..."
#   export AWS_SECRET_ACCESS_KEY="..."
#   export MOXE_SSH_KEY="${HOME}/Downloads/INDIA-MOxE.pem"
#   export MOXE_EC2_HOST="ubuntu@54.209.157.42"
#   bash scripts/ec2-append-s3-env.sh
set -euo pipefail

: "${AWS_ACCESS_KEY_ID:?Set AWS_ACCESS_KEY_ID}"
: "${AWS_SECRET_ACCESS_KEY:?Set AWS_SECRET_ACCESS_KEY}"

MOXE_SSH_KEY="${MOXE_SSH_KEY:-${HOME}/Downloads/INDIA-MOxE.pem}"
MOXE_EC2_HOST="${MOXE_EC2_HOST:-ubuntu@54.209.157.42}"

test -f "$MOXE_SSH_KEY" || { echo "Missing SSH key: $MOXE_SSH_KEY" >&2; exit 1; }

ssh -i "$MOXE_SSH_KEY" -o BatchMode=yes -o ConnectTimeout=20 "$MOXE_EC2_HOST" \
  "bash -s" -- "$AWS_ACCESS_KEY_ID" "$AWS_SECRET_ACCESS_KEY" <<'REMOTE'
set -euo pipefail
ENV_FILE="/var/www/moxe/BACKEND/.env"
AK="$1"
SK="$2"
if grep -q '^AWS_ACCESS_KEY_ID=' "$ENV_FILE" 2>/dev/null; then
  echo "AWS_ACCESS_KEY_ID already present in $ENV_FILE — not changing keys."
  exit 0
fi
if grep -q '^AWS_S3_BUCKET=' "$ENV_FILE" 2>/dev/null; then
  {
    echo ""
    echo "# IAM keys (appended by ec2-append-s3-env.sh) — used in preference to AWS_S3_USE_EC2_ROLE"
    echo "AWS_ACCESS_KEY_ID=${AK}"
    echo "AWS_SECRET_ACCESS_KEY=${SK}"
  } >> "$ENV_FILE"
  echo "Appended access keys to $ENV_FILE"
  exit 0
fi
{
  echo ""
  echo "# S3 (appended by ec2-append-s3-env.sh)"
  echo "AWS_ACCESS_KEY_ID=${AK}"
  echo "AWS_SECRET_ACCESS_KEY=${SK}"
  echo "AWS_S3_BUCKET=moxe-media"
  echo "AWS_REGION=us-east-1"
  echo "AWS_S3_PREFIX=uploads"
} >> "$ENV_FILE"
echo "Appended S3 block to $ENV_FILE"
REMOTE

echo "Next: pm2 restart — run:"
echo "  ssh -i \"$MOXE_SSH_KEY\" $MOXE_EC2_HOST 'cd /var/www/moxe/BACKEND && pm2 restart moxe-api --update-env'"
