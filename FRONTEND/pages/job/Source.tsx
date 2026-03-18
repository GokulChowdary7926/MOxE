import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type CodeRepo = {
  id: string;
  name: string;
  slug?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  description?: string | null;
  account?: { id: string; displayName: string; username: string };
};

type CodeBranch = {
  id: string;
  name: string;
};

type Commit = {
  id: string;
  sha?: string;
  message: string;
  createdAt: string;
  author?: { displayName?: string; username?: string };
};

type CommitDetail = Commit & {
  parents?: { id: string; sha?: string }[];
  filesChanged?: number;
  additions?: number;
  deletions?: number;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Source() {
  const [repos, setRepos] = useState<CodeRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<CodeRepo | null>(null);
  const [branches, setBranches] = useState<CodeBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [commits, setCommits] = useState<Commit[]>([]);
  const [selectedCommit, setSelectedCommit] = useState<CommitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useAuthHeaders();

  const loadRepos = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/code/repos`, { headers });
      if (!res.ok) throw new Error('Failed to load repositories');
      const data = (await res.json()) as CodeRepo[];
      setRepos(data || []);
      if (!selectedRepo && data && data.length > 0) {
        setSelectedRepo(data[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async (repo: CodeRepo) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/code/repos/${repo.id}/branches`, { headers });
      if (!res.ok) throw new Error('Failed to load branches');
      const data = (await res.json()) as CodeBranch[];
      setBranches(data || []);
      if (!selectedBranch && data && data.length > 0) {
        setSelectedBranch(data[0].name);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load branches');
    }
  };

  const loadCommits = async (repo: CodeRepo, branchName: string) => {
    if (!branchName) return;
    setLoadingCommits(true);
    setError(null);
    try {
      const params = new URLSearchParams({ branch: branchName, limit: '50' });
      const res = await fetch(
        `${API_BASE}/job/code/repos/${repo.id}/commits?${params.toString()}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to load commits');
      const data = (await res.json()) as Commit[];
      setCommits(data || []);
      if (data && data.length > 0) {
        await loadCommitDetail(repo, data[0].id);
      } else {
        setSelectedCommit(null);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load commits');
    } finally {
      setLoadingCommits(false);
    }
  };

  const loadCommitDetail = async (repo: CodeRepo, commitId: string) => {
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/code/repos/${repo.id}/commits/${commitId}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to load commit details');
      const data = (await res.json()) as CommitDetail;
      setSelectedCommit(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load commit details');
    }
  };

  React.useEffect(() => {
    loadRepos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (selectedRepo) {
      loadBranches(selectedRepo);
    } else {
      setBranches([]);
      setSelectedBranch('');
      setCommits([]);
      setSelectedCommit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo?.id]);

  React.useEffect(() => {
    if (selectedRepo && selectedBranch) {
      loadCommits(selectedRepo, selectedBranch);
    } else {
      setCommits([]);
      setSelectedCommit(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-72 space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE SOURCE
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Explore your repositories, branches, and commit history for your Job account.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[420px] overflow-auto">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Repositories
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {loading && repos.length === 0 && (
              <div className="px-3 py-2 text-slate-500 dark:text-slate-400">Loading…</div>
            )}
            {repos.map((r) => {
              const isActive = selectedRepo?.id === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRepo(r)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {r.account?.displayName || r.account?.username || 'Job repo'}
                    </span>
                    <span className="uppercase">{r.visibility || 'PRIVATE'}</span>
                  </div>
                  {r.description && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {r.description}
                    </div>
                  )}
                </button>
              );
            })}
            {!loading && repos.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                No repositories yet. Create repos in MOxE CODE, then inspect them here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {selectedRepo && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {selectedRepo.name}
                </div>
                {selectedRepo.description && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selectedRepo.description}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Branch:
                </span>
                <select
                  className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px]"
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Commits
                  </div>
                  {loadingCommits && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Loading…
                    </span>
                  )}
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 max-h-[420px] overflow-auto text-xs">
                  {commits.length === 0 && !loadingCommits && (
                    <div className="px-3 py-3 text-slate-500 dark:text-slate-400">
                      No commits found for this branch.
                    </div>
                  )}
                  {commits.map((c) => {
                    const isActive = selectedCommit?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectedRepo && loadCommitDetail(selectedRepo, c.id)}
                        className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0 hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="font-medium truncate">{c.message}</div>
                        <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">
                            {c.author?.displayName || c.author?.username || 'Unknown author'}
                          </span>
                          <span>
                            {new Date(c.createdAt).toLocaleString([], {
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  Commit details
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs min-h-[180px]">
                  {!selectedCommit && (
                    <div className="text-slate-500 dark:text-slate-400">
                      Select a commit on the left to inspect details.
                    </div>
                  )}
                  {selectedCommit && (
                    <div className="space-y-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {selectedCommit.message}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedCommit.author?.displayName ||
                            selectedCommit.author?.username ||
                            'Unknown author'}{' '}
                          ·{' '}
                          {new Date(selectedCommit.createdAt).toLocaleString([], {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      {selectedCommit.sha && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          SHA: <span className="font-mono">{selectedCommit.sha}</span>
                        </div>
                      )}
                      {(selectedCommit.additions != null ||
                        selectedCommit.deletions != null ||
                        selectedCommit.filesChanged != null) && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedCommit.filesChanged != null && (
                            <span>{selectedCommit.filesChanged} files</span>
                          )}
                          {selectedCommit.additions != null && (
                            <span className="text-emerald-500">
                              +{selectedCommit.additions}
                            </span>
                          )}
                          {selectedCommit.deletions != null && (
                            <span className="text-red-500">
                              -{selectedCommit.deletions}
                            </span>
                          )}
                        </div>
                      )}
                      {selectedCommit.parents && selectedCommit.parents.length > 0 && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Parents:{' '}
                          {selectedCommit.parents
                            .map((p) => p.sha || p.id)
                            .filter(Boolean)
                            .map((s) => (s!.length > 8 ? s!.slice(0, 8) : s))
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedRepo && !loading && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-500 dark:text-slate-400">
            Select a repository on the left to inspect its branches and commit history.
          </div>
        )}
      </div>
    </div>
  );
}

