import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';
import { safeFirst } from '../../utils/safeAccess';

const API_BASE = getApiBase();

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
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE CODE SEARCH" toolIconMaterial="search">
      <div className="flex flex-col gap-4">
        <JobCard variant="track">
          <form onSubmit={performSearch} className="space-y-3">
            <div className="space-y-1.5">
              <label className={JOB_MOBILE.label}>Query</label>
              <input
                className={JOB_MOBILE.input}
                placeholder="function name, class, keyword…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className={JOB_MOBILE.label}>Repository</label>
              <select className={JOB_MOBILE.input} value={selectedRepoId} onChange={(e) => setSelectedRepoId(e.target.value)}>
                <option value="">All accessible repos</option>
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className={JOB_MOBILE.label}>Path filter (optional)</label>
              <input
                className={JOB_MOBILE.input}
                placeholder="e.g. src/, utils/, README.md"
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className={JOB_MOBILE.btnPrimary}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>
        </JobCard>

        <div className="grid grid-cols-1 gap-4">
          <JobCard className="flex flex-col min-h-[200px] p-0 overflow-hidden">
            <div className="px-4 py-2 border-b border-[#DFE1E6] dark:border-[#2C333A] flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#172B4D] dark:text-[#E6EDF3]">
                Results {results.length > 0 && `(${results.length})`}
              </span>
              {loading && <span className="text-[11px] text-[#5E6C84] dark:text-[#8C9BAB]">Searching…</span>}
            </div>
            <div className="flex-1 max-h-[min(360px,45vh)] overflow-auto text-xs bg-[#131315]">
              {results.length === 0 && !loading && (
                <div className="px-3 py-3 text-[#5E6C84] dark:text-[#8C9BAB]">Enter a query and press Search to see matching code.</div>
              )}
              {results.map((r) => {
                const isActive = selectedResult?.id === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedResult(r)}
                    className={`w-full text-left px-3 py-2 border-b border-[#2C333A] last:border-b-0 hover:bg-[#1D2125] ${
                      isActive ? 'bg-[#1A2E4D] text-[#2684FF]' : 'text-[#E6EDF3]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="font-medium truncate">
                        {r.repoName} · {r.branchName}
                      </div>
                      <span className="text-[11px] text-[#5E6C84] dark:text-[#8C9BAB] shrink-0">
                        {new Date(r.commitCreatedAt).toLocaleString([], {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5E6C84] dark:text-[#8C9BAB] truncate">{r.path}</div>
                    <div className="mt-1 text-[11px] text-[#5E6C84] dark:text-[#8C9BAB] line-clamp-2">{r.commitMessage}</div>
                  </button>
                );
              })}
            </div>
          </JobCard>

          <JobCard variant="track" flush className="flex flex-col min-h-[200px] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#2C333A] text-xs font-semibold text-[#E6EDF3]">
              Preview
            </div>
            <div className="flex-1 min-h-[180px] bg-[#0d1117] text-xs text-slate-100 overflow-auto">
              {!selectedResult && (
                <div className="px-3 py-3 text-slate-400">Select a result above to view matching code.</div>
              )}
              {selectedResult && (
                <div className="flex flex-col h-full">
                  <div className="px-3 py-2 border-b border-slate-800 bg-slate-950 text-[11px] flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">
                        {selectedResult.repoName} · {selectedResult.branchName}
                      </span>
                      <span className="text-slate-500">
                        {selectedResult.author?.displayName || selectedResult.author?.username || 'Unknown author'}
                      </span>
                    </div>
                    <div className="text-slate-400 truncate">{selectedResult.path}</div>
                  </div>
                  <pre className="flex-1 px-3 py-3 whitespace-pre-wrap font-mono text-[11px]">{selectedResult.contentPreview}</pre>
                </div>
              )}
            </div>
          </JobCard>
        </div>

        <JobBibleReferenceSection toolKey="code-search" />
      </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}

