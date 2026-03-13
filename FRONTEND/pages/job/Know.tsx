import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export default function Know() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`${API_BASE}/job/know/companies${q}`)
      .then((res) => res.ok ? res.json() : [])
      .then(setCompanies)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [search]);

  const openCompany = (slug: string) => {
    fetch(`${API_BASE}/job/know/companies/${slug}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Not found'))))
      .then(setSelectedCompany)
      .catch((e) => setError(e.message));
  };

  if (loading && !selectedCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Know...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">MOxE Know</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Company research, reviews, salary insights, and career resources.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white mb-6"
      />
      {selectedCompany ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <button
            onClick={() => setSelectedCompany(null)}
            className="text-sm text-indigo-600 dark:text-indigo-400 mb-4"
          >
            ← Back to list
          </button>
          <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
            {selectedCompany.name}
          </h3>
          {selectedCompany.website && (
            <a
              href={selectedCompany.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 dark:text-indigo-400 text-sm"
            >
              {selectedCompany.website}
            </a>
          )}
          {selectedCompany.description && (
            <p className="mt-3 text-slate-600 dark:text-slate-400">{selectedCompany.description}</p>
          )}
          {selectedCompany.reviews?.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-slate-800 dark:text-white">Reviews</h4>
              <div className="mt-2 space-y-2">
                {selectedCompany.reviews.slice(0, 5).map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm"
                  >
                    <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
                    {r.summary && <p className="mt-1">{r.summary}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {companies.length === 0 ? (
            <p className="text-slate-500 col-span-2">No companies found.</p>
          ) : (
            companies.map((c) => (
              <button
                key={c.id}
                onClick={() => openCompany(c.slug)}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
              >
                <div className="font-medium text-slate-800 dark:text-white">{c.name}</div>
                {c.industry && (
                  <div className="text-sm text-slate-500 mt-1">{c.industry}</div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
