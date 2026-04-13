import React, { useMemo, useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import manifest from '../../src/data/open-source-licenses.json';

type Pkg = { name: string; version: string; license: string; sources: string[] };

function npmPackageUrl(name: string): string {
  return `https://www.npmjs.com/package/${encodeURIComponent(name)}`;
}

export default function OpenSourceLicensesPage() {
  const [q, setQ] = useState('');
  const packages = manifest.packages as Pkg[];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return packages;
    return packages.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.license.toLowerCase().includes(s) ||
        p.version.toLowerCase().includes(s),
    );
  }, [packages, q]);

  return (
    <SettingsPageShell title="Open source licenses" backTo="/settings/help/terms">
      <div className="px-4 py-4 space-y-4">
        <p className="text-moxe-textSecondary text-sm">
          MOxE is built with open-source software. This list is generated from{' '}
          <code className="text-xs text-moxe-text">package-lock.json</code> for the web app and API (
          {packages.length} packages). It is not legal advice; refer to each package for the full license text.
        </p>
        <p className="text-moxe-textSecondary text-xs">
          Data generated: {new Date(manifest.generatedAt).toLocaleString()}
        </p>
        <label className="block">
          <span className="sr-only">Search packages</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, version, or license"
            className="w-full rounded-lg border border-moxe-border bg-moxe-surface px-3 py-2 text-sm text-moxe-text placeholder:text-moxe-textSecondary focus:outline-none focus:ring-2 focus:ring-moxe-primary"
            autoComplete="off"
          />
        </label>
        <ul className="space-y-0 border border-moxe-border rounded-xl overflow-hidden max-h-[min(70vh,560px)] overflow-y-auto">
          {filtered.map((p) => (
            <li
              key={`${p.name}@${p.version}`}
              className="px-4 py-3 border-b border-moxe-border last:border-b-0 bg-moxe-surface"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                <a
                  href={npmPackageUrl(p.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sm text-moxe-primary hover:underline"
                >
                  {p.name}
                  <span className="text-moxe-textSecondary font-normal">@{p.version}</span>
                </a>
                <span className="text-xs font-mono text-moxe-textSecondary shrink-0">{p.license}</span>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? (
          <p className="text-moxe-textSecondary text-sm text-center py-6">No packages match your search.</p>
        ) : null}
      </div>
    </SettingsPageShell>
  );
}
