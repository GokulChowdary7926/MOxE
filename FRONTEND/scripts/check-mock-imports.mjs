/**
 * NBK-032: fail if application code imports from FRONTEND/mocks (forbidden).
 * Run from FRONTEND/: node scripts/check-mock-imports.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');

const SCAN_TOP = ['pages', 'components', 'src', 'hooks', 'services', 'store', 'utils'];
const IMPORT_RE = /\bfrom\s+['"]([^'"]+)['"]/g;
const FORBIDDEN = (spec) =>
  spec.includes('/mocks/') || spec.startsWith('mocks/') || /^\.{1,2}\/mocks\//.test(spec);

const hits = [];

function walk(dir) {
  let names;
  try {
    names = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of names) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist') continue;
      walk(p);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(e.name)) continue;
    const text = fs.readFileSync(p, 'utf8');
    let m;
    IMPORT_RE.lastIndex = 0;
    while ((m = IMPORT_RE.exec(text)) !== null) {
      const spec = m[1];
      if (FORBIDDEN(spec)) hits.push({ file: path.relative(frontendRoot, p), spec });
    }
  }
}

for (const top of SCAN_TOP) {
  const d = path.join(frontendRoot, top);
  if (fs.existsSync(d)) walk(d);
}

if (hits.length) {
  console.error('Forbidden import from FRONTEND/mocks in feature code (NBK-032):\n');
  for (const h of hits) console.error(`  ${h.file}: ${h.spec}`);
  process.exit(1);
}
