import React, { useEffect, useState } from 'react';
import { safeFirst } from '../../utils/safeAccess';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type CodeRepo = {
  id: string;
  name: string;
  slug?: string;
};

type SearchResult = {
  id: string;
  path: string;
  contentPreview: string;
  repoId: string;
  repoName: string;
  repoSlug?: string;
  owner?: { id: string; displayName?: string; username?: string };
  branchId: string;
  branchName: string;
  commitId: string;
  commitMessage: string;
  commitCreatedAt: string;
  author?: { id: string; displayName?: string; username?: string };
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function CodeSearch() {
  const [repos, setRepos] = useState<CodeRepo[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [pathFilter, setPathFilter] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useAuthHeaders();

  const loadRepos = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/code/repos`, { headers });
      if (!res.ok) throw new Error('Failed to load repositories');
      const data = (await res.json()) as CodeRepo[];
      setRepos(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load repositories');
    }
  };

  const performSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Enter a search query');
      return;
    }
    setLoading(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);
    try {
      const params = new URLSearchParams();
      params.set('q', trimmed);
      if (selectedRepoId) params.set('repoId', selectedRepoId);
      if (pathFilter.trim()) params.set('path', pathFilter.trim());
      params.set('limit', '100');

      const res = await fetch(`${API_BASE}/job/code/search?${params.toString()}`, {
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Search failed');
      }
      const data = (await res.json()) as SearchResult[];
      setResults(data || []);
      const firstResult = safeFirst(data);
      if (firstResult) {
        setSelectedResult(firstResult);
      }
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE CODE SEARCH
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Search across your Job code repositories for symbols, files, and text.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={performSearch} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Query
            </label>
            <input
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
              placeholder="function name, class, keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Repository
            </label>
            <select
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
            >
              <option value="">All accessible repos</option>
              {repos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
              Path filter (optional)
            </label>
            <input
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
              placeholder="e.g. src/, utils/, README.md"
              value={pathFilter}
              onChange={(e) => setPathFilter(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
          <div className="flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Results {results.length > 0 && `(${results.length})`}
              </div>
              {loading && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Searching…
                </span>
              )}
            </div>
            <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 overflow-auto text-xs">
              {results.length === 0 && !loading && (
                <div className="px-3 py-3 text-slate-500 dark:text-slate-400">
                  Enter a query and press Search to see matching code.
                </div>
              )}
              {results.map((r) => {
                const isActive = selectedResult?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedResult(r)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="font-medium truncate">
                        {r.repoName} · {r.branchName}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(r.commitCreatedAt).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {r.path}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {r.commitMessage}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col min-h-[260px]">
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Preview
            </div>
            <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 text-xs text-slate-100 overflow-auto">
              {!selectedResult && (
                <div className="px-3 py-3 text-slate-400">
                  Select a result on the left to view matching code.
                </div>
              )}
              {selectedResult && (
                <div className="flex flex-col h-full">
                  <div className="px-3 py-2 border-b border-slate-800 bg-slate-950 text-[11px] flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {selectedResult.repoName} · {selectedResult.branchName}
                      </span>
                      <span className="text-slate-500">
                        {selectedResult.author?.displayName ||
                          selectedResult.author?.username ||
                          'Unknown author'}
                      </span>
                    </div>
                    <div className="text-slate-400 truncate">{selectedResult.path}</div>
                  </div>
                  <pre className="flex-1 px-3 py-3 whitespace-pre-wrap font-mono text-[11px]">
                    {selectedResult.contentPreview}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

