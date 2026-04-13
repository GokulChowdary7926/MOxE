/**
 * Generates machine-readable MOxE inventory: JSON + CSVs.
 * Run from repo root: node scripts/generate-moxe-inventory.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'inventory');

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walk(p, exts, acc);
    else if (exts.some((e) => name.name.endsWith(e))) acc.push(p);
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function parsePrismaModelsAndEnums(schemaPath) {
  const text = fs.readFileSync(schemaPath, 'utf8');
  const models = [];
  const enums = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^model\s+(\w+)\s*\{/);
    if (m) models.push(m[1]);
    const e = line.match(/^enum\s+(\w+)\s*\{/);
    if (e) enums.push(e[1]);
  }
  return { models, enums };
}

function parseApiMounts(serverPath) {
  const text = fs.readFileSync(serverPath, 'utf8');
  const mounts = [];
  const re = /app\.use\(\s*['"]([^'"]+)['"]\s*,/g;
  let x;
  while ((x = re.exec(text)) !== null) {
    mounts.push(x[1]);
  }
  return mounts;
}

function csvEscape(s) {
  const t = String(s ?? '');
  if (/[",\n\r]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function toCsv(rows, headers) {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(','));
  }
  return lines.join('\n') + '\n';
}

function main() {
  const schemaPath = path.join(ROOT, 'BACKEND', 'prisma', 'schema.prisma');
  const serverPath = path.join(ROOT, 'BACKEND', 'src', 'server.ts');

  const routeFiles = walk(path.join(ROOT, 'BACKEND', 'src', 'routes'), ['.ts']).sort();
  const serviceFiles = walk(path.join(ROOT, 'BACKEND', 'src', 'services'), ['.ts']).sort();
  const pageFiles = walk(path.join(ROOT, 'FRONTEND', 'pages'), ['.tsx', '.ts']).sort();
  const componentFiles = walk(path.join(ROOT, 'FRONTEND', 'components'), ['.tsx', '.ts']).sort();

  const { models: prismaModels, enums: prismaEnums } = parsePrismaModelsAndEnums(schemaPath);
  const apiMounts = fs.existsSync(serverPath) ? parseApiMounts(serverPath) : [];

  const generatedAt = new Date().toISOString();

  const inventory = {
    generatedAt,
    repoRoot: ROOT,
    backend: {
      routeFiles: routeFiles.map(rel),
      serviceFiles: serviceFiles.map(rel),
      apiMounts,
    },
    prisma: {
      models: prismaModels,
      enums: prismaEnums,
      schemaPath: rel(schemaPath),
    },
    frontend: {
      pageFiles: pageFiles.map(rel),
      componentFiles: componentFiles.map(rel),
    },
    mobile: {
      screenFiles: walk(path.join(ROOT, 'MOBILE', 'src'), ['.tsx', '.ts'])
        .filter((p) => p.includes(`${path.sep}screens${path.sep}`))
        .map(rel)
        .sort(),
    },
    counts: {
      backendRouteFiles: routeFiles.length,
      backendServiceFiles: serviceFiles.length,
      prismaModels: prismaModels.length,
      prismaEnums: prismaEnums.length,
      apiMounts: apiMounts.length,
      frontendPages: pageFiles.length,
      frontendComponents: componentFiles.length,
    },
  };

  fs.mkdirSync(OUT, { recursive: true });

  fs.writeFileSync(path.join(OUT, 'moxe-inventory.json'), JSON.stringify(inventory, null, 2), 'utf8');

  fs.writeFileSync(
    path.join(OUT, 'backend-routes.csv'),
    toCsv(
      routeFiles.map((p) => [rel(p), path.basename(p)]),
      ['path', 'filename'],
    ),
    'utf8',
  );

  fs.writeFileSync(
    path.join(OUT, 'backend-services.csv'),
    toCsv(
      serviceFiles.map((p) => [rel(p), path.basename(p)]),
      ['path', 'filename'],
    ),
    'utf8',
  );

  fs.writeFileSync(
    path.join(OUT, 'prisma-models.csv'),
    toCsv(prismaModels.map((name) => [name]), ['model']),
    'utf8',
  );

  fs.writeFileSync(
    path.join(OUT, 'prisma-enums.csv'),
    toCsv(prismaEnums.map((name) => [name]), ['enum']),
    'utf8',
  );

  fs.writeFileSync(
    path.join(OUT, 'api-mounts.csv'),
    toCsv(apiMounts.map((m) => [m]), ['mount_path']),
    'utf8',
  );

  fs.writeFileSync(
    path.join(OUT, 'frontend-pages.csv'),
    toCsv(
      pageFiles.map((p) => [rel(p), path.basename(p)]),
      ['path', 'filename'],
    ),
    'utf8',
  );

  fs.writeFileSync(
    path.join(OUT, 'frontend-components.csv'),
    toCsv(
      componentFiles.map((p) => [rel(p), path.basename(p)]),
      ['path', 'filename'],
    ),
    'utf8',
  );

  console.log(`Wrote ${path.relative(ROOT, OUT)}/ (${inventory.counts.backendRouteFiles} routes, ${inventory.counts.prismaModels} models, ${inventory.counts.frontendPages} pages)`);
}

main();
