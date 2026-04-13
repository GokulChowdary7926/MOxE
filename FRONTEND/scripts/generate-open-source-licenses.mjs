/**
 * Aggregates npm dependency names, versions, and SPDX/license fields from
 * package-lock.json (v3) for the web app and the backend.
 *
 * Usage: node scripts/generate-open-source-licenses.mjs
 * Output: src/data/open-source-licenses.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, '..');
const repoRoot = path.join(frontendRoot, '..');
const outFile = path.join(frontendRoot, 'src', 'data', 'open-source-licenses.json');

/** @param {string} key */
function lastPackageFolder(key) {
  const re = /node_modules\/((?:@[^/]+\/[^/]+)|(?:[^/]+))/g;
  let m;
  let last = null;
  while ((m = re.exec(key)) !== null) last = m[1];
  return last;
}

/** @param {unknown} lic */
function normalizeLicense(lic) {
  if (lic == null) return 'UNLICENSED';
  if (typeof lic === 'string') return lic;
  if (typeof lic === 'object' && lic !== null && 'type' in lic) return String(/** @type {{ type: unknown }} */ (lic).type);
  return 'See package';
}

/**
 * @param {string} lockPath
 * @param {'frontend' | 'backend'} source
 */
function collectFromLockfile(lockPath, source) {
  /** @type {{ name: string; version: string; license: string; source: string }[]} */
  const rows = [];
  if (!fs.existsSync(lockPath)) return rows;
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const packages = lock.packages;
  if (!packages || typeof packages !== 'object') return rows;

  for (const key of Object.keys(packages)) {
    if (key === '' || !key.startsWith('node_modules/')) continue;
    const name = lastPackageFolder(key);
    if (!name) continue;
    const entry = packages[key];
    const version = entry && typeof entry.version === 'string' ? entry.version : '';
    if (!version) continue;
    const license = normalizeLicense(entry?.license);
    rows.push({ name, version, license, source });
  }
  return rows;
}

function main() {
  const fe = collectFromLockfile(path.join(frontendRoot, 'package-lock.json'), 'frontend');
  const be = collectFromLockfile(path.join(repoRoot, 'BACKEND', 'package-lock.json'), 'backend');

  /** @type {Map<string, { name: string; version: string; license: string; sources: string[] }>} */
  const byKey = new Map();
  for (const r of [...fe, ...be]) {
    const k = `${r.name}@${r.version}`;
    const existing = byKey.get(k);
    if (!existing) {
      byKey.set(k, { name: r.name, version: r.version, license: r.license, sources: [r.source] });
    } else {
      if (!existing.sources.includes(r.source)) existing.sources.push(r.source);
      if (existing.license === 'UNLICENSED' && r.license !== 'UNLICENSED') existing.license = r.license;
    }
  }

  const packages = [...byKey.values()].sort((a, b) => {
    const c = a.name.localeCompare(b.name);
    return c !== 0 ? c : a.version.localeCompare(b.version);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    packages,
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.error(`Wrote ${packages.length} packages to ${path.relative(frontendRoot, outFile)}`);
}

main();
