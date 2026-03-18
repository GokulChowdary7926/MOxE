#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
TOTAL=0

check() {
  local label="$1"
  local cmd="$2"
  TOTAL=$((TOTAL + 1))
  printf "  %s... " "$label"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED=$((FAILED + 1))
  fi
}

echo "🔍 MOxE Production Verification"
echo "==============================="

echo
echo "📋 Environment Checks"
echo "---------------------"
check "Node.js installed" "node -v"
check "npm installed" "npm -v"

echo
echo "🔧 Backend Checks"
echo "-----------------"
check "Backend deps" "cd \"$ROOT_DIR/BACKEND\" && npm ls --depth=0"
check "Prisma generate" "cd \"$ROOT_DIR/BACKEND\" && npx prisma generate"
check "Backend tsc" "cd \"$ROOT_DIR/BACKEND\" && npx tsc --noEmit"

echo
echo "🎨 Frontend Checks"
echo "------------------"
check "Frontend deps" "cd \"$ROOT_DIR/FRONTEND\" && npm ls --depth=0"
check "Frontend tsc" "cd \"$ROOT_DIR/FRONTEND\" && npx tsc --noEmit"
check "Frontend build" "cd \"$ROOT_DIR/FRONTEND\" && npm run build"

echo
echo "🌐 Env Files"
echo "-----------"
check "BACKEND/.env.production exists" "[ -f \"$ROOT_DIR/BACKEND/.env.production\" ]"
check "FRONTEND/.env.production exists" "[ -f \"$ROOT_DIR/FRONTEND/.env.production\" ]"

echo
echo "🗄 Database"
echo "----------"
check "Prisma migrate status" "cd \"$ROOT_DIR/BACKEND\" && npx prisma migrate status"

echo
echo "🚀 Config Files"
echo "--------------"
check "render.yaml present" "[ -f \"$ROOT_DIR/render.yaml\" ]"
check "vercel.json present" "[ -f \"$ROOT_DIR/vercel.json\" ]"
check "GitHub workflow present" "[ -f \"$ROOT_DIR/.github/workflows/deploy.yml\" ]"

echo
echo "📊 Summary"
echo "---------"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo -e "${YELLOW}Total:  $TOTAL${NC}"

if [ "$FAILED" -eq 0 ]; then
  echo
  echo -e "${GREEN}✅ All checks passed. Ready for production deploy.${NC}"
else
  echo
  echo -e "${YELLOW}⚠ Some checks failed. Fix them before production deploy.${NC}"
  exit 1
fi

