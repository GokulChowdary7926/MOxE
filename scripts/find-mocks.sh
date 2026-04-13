#!/usr/bin/env bash
#
# Complete mock / demo inventory for MOxE. Run from repo root:
#   chmod +x scripts/find-mocks.sh && ./scripts/find-mocks.sh
#
# Limit output lines per section: MAX_LINES=200 ./scripts/find-mocks.sh
#

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

EX_TEST='\.test\.|\.spec\.|/__tests__/|/node_modules/|/e2e/|/coverage/'
MAX_LINES="${MAX_LINES:-80}"

section() {
  echo ""
  echo "=== $1 ==="
}

# Usage: rgfe PATTERN [DIR]
rgfe() {
  local pat="$1"
  local dir="${2:-FRONTEND}"
  grep -rnE "$pat" \
    --include='*.tsx' --include='*.ts' \
    "$dir" 2>/dev/null | grep -vE "$EX_TEST" | head -n "$MAX_LINES" || true
}

section "Mock module files (FRONTEND/mocks)"
if [[ -d FRONTEND/mocks ]]; then
  find FRONTEND/mocks -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null | sort || true
else
  echo "(no FRONTEND/mocks directory)"
fi

section "Explicit imports from mocks/"
rgfe "from ['\"].*mocks/|require\\(['\"].*mocks/" FRONTEND
rgfe "from ['\"].*mocks/|require\\(['\"].*mocks/" MOBILE

section "Identifiers: MOCK_ / mockUsers / getMock / DEMO_"
rgfe '\bMOCK_[A-Z0-9_]+\b|mockUsers\b|getMock\b|DEMO_[A-Z0-9_]+\b|mockData\b|mockPosts\b|mockGroups\b|mockSSO' FRONTEND

section "Fallback patterns: || mock / ?? mock"
rgfe '\|\|[[:space:]]*mock|\?\?[[:space:]]*mock' FRONTEND

section "Design bible surfaces (BibleToolPage, Job bible)"
rgfe 'BibleToolPage|JobBibleReferenceSection|BibleToolLayoutBody|JobToolBibleShell' FRONTEND

section "Feature flag: VITE_SHOW_JOB_DESIGN_BIBLE"
grep -rn 'VITE_SHOW_JOB_DESIGN_BIBLE' FRONTEND --include='*.tsx' --include='*.ts' --include='*.js' 2>/dev/null \
  | grep -vE "$EX_TEST" | head -n "$MAX_LINES" || true

section "Comments: mock / demo / stub (pages + components)"
rgfe 'mock(ed)? (data|layout|metrics|series)|demo-only|hardcoded sample|stub endpoint' \
  FRONTEND/pages
rgfe 'mock(ed)? (data|layout|metrics|series)|demo-only|hardcoded sample|stub endpoint' \
  FRONTEND/components

section "BACKEND: '\\bmock\\b' in src (excluding tests)"
grep -rni '\bmock\b' BACKEND/src --include='*.ts' 2>/dev/null \
  | grep -vE "$EX_TEST" | head -n "$MAX_LINES" || true

section "BACKEND routes: res.json inline arrays (heuristic)"
grep -rn 'res\.json\(\[' BACKEND/src/routes --include='*.ts' 2>/dev/null \
  | grep -vE "$EX_TEST" | head -n "$MAX_LINES" || true

section "Jest __mocks__ directories"
find . -type d -name '__mocks__' 2>/dev/null | grep -v node_modules | head -n "$MAX_LINES" || true

echo ""
echo "Done. Tip: MAX_LINES=200 $0 for more lines per section."
