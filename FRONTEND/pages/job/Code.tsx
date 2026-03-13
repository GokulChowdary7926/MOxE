import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type CodeRepo = {
  id: string;
  name: string;
  slug?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  description?: string | null;
  account?: { id: string; displayName: string; username: string };
  _count?: { branches?: number; pullRequests?: number };
};

type CodeBranch = {
  id: string;
  name: string;
  headCommit?: {
    id: string;
    message: string;
    createdAt: string;
    author?: { displayName: string };
  } | null;
};

type PullRequest = {
  id: string;
  number: number;
  title: string;
  status: string;
  author?: { displayName: string; username?: string };
  sourceBranch?: { name: string };
  targetBranch?: { name: string };
  _count?: { comments?: number; reviewers?: number };
};

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

export default function Code() {
  const [repos, setRepos] = useState<CodeRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<CodeRepo | null>(null);
  const [branches, setBranches] = useState<CodeBranch[]>([]);
  const [pulls, setPulls] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [creatingPr, setCreatingPr] = useState(false);
  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    visibility: 'PRIVATE',
    initReadme: true,
  });
  const [newBranch, setNewBranch] = useState({
    name: '',
    fromBranch: '',
  });
  const [newPr, setNewPr] = useState({
    title: '',
    sourceBranchId: '',
    targetBranchId: '',
    description: '',
  });

  const headers = useAuthHeaders();

  const loadRepos = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/code/repos`, { headers });
      if (!res.ok) throw new Error('Failed to load repositories');
      const data = await res.json();
      setRepos(data || []);
      if (!selectedRepo && data?.length) {
        setSelectedRepo(data[0]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load repositories');
    }
  };

  const loadRepoDetail = async (repo: CodeRepo) => {
    setError(null);
    setLoading(true);
    try {
      const [branchesRes, pullsRes] = await Promise.all([
        fetch(`${API_BASE}/job/code/repos/${repo.id}/branches`, { headers }),
        fetch(`${API_BASE}/job/code/repos/${repo.id}/pulls?status=OPEN`, {
          headers,
        }),
      ]);
      if (!branchesRes.ok) throw new Error('Failed to load branches');
      if (!pullsRes.ok) throw new Error('Failed to load pull requests');
      const branchesData = await branchesRes.json();
      const pullsData = await pullsRes.json();
      setBranches(branchesData || []);
      setPulls(pullsData || []);
      setNewBranch((b) => ({
        ...b,
        fromBranch:
          b.fromBranch ||
          (branchesData && branchesData[0] ? branchesData[0].name : ''),
      }));
      setNewPr((p) => ({
        ...p,
        sourceBranchId:
          p.sourceBranchId ||
          (branchesData && branchesData[0] ? branchesData[0].id : ''),
        targetBranchId:
          p.targetBranchId ||
          (branchesData && branchesData[0] ? branchesData[0].id : ''),
      }));
    } catch (e: any) {
      setError(e.message || 'Failed to load repository details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepos().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedRepo) {
      loadRepoDetail(selectedRepo);
    } else {
      setBranches([]);
      setPulls([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepo?.id]);

  const handleCreateRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepo.name.trim()) return;
    setCreatingRepo(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/code/repos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newRepo.name.trim(),
          description: newRepo.description.trim() || undefined,
          visibility: newRepo.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
          initReadme: newRepo.initReadme,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create repository');
      }
      const created = await res.json();
      setNewRepo({
        name: '',
        description: '',
        visibility: 'PRIVATE',
        initReadme: true,
      });
      await loadRepos();
      setSelectedRepo(created);
    } catch (e: any) {
      setError(e.message || 'Failed to create repository');
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !newBranch.name.trim()) return;
    setCreatingBranch(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/code/repos/${selectedRepo.id}/branches`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: newBranch.name.trim(),
            fromBranch: newBranch.fromBranch || undefined,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create branch');
      }
      setNewBranch({ name: '', fromBranch: newBranch.fromBranch });
      await loadRepoDetail(selectedRepo);
    } catch (e: any) {
      setError(e.message || 'Failed to create branch');
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleCreatePr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedRepo ||
      !newPr.title.trim() ||
      !newPr.sourceBranchId ||
      !newPr.targetBranchId ||
      newPr.sourceBranchId === newPr.targetBranchId
    )
      return;
    setCreatingPr(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/code/repos/${selectedRepo.id}/pulls`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: newPr.title.trim(),
            description: newPr.description.trim() || undefined,
            sourceBranchId: newPr.sourceBranchId,
            targetBranchId: newPr.targetBranchId,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create pull request');
      }
      setNewPr({
        title: '',
        description: '',
        sourceBranchId: newPr.sourceBranchId,
        targetBranchId: newPr.targetBranchId,
      });
      await loadRepoDetail(selectedRepo);
    } catch (e: any) {
      setError(e.message || 'Failed to create pull request');
    } finally {
      setCreatingPr(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-72">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          MOxE CODE
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
          Manage lightweight repositories, branches, and pull requests scoped to your Job account.
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreateRepo}
          className="mb-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2"
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            New repository
          </div>
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Name (letters, numbers, hyphens, underscores)"
            value={newRepo.name}
            onChange={(e) =>
              setNewRepo((r) => ({ ...r, name: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Description (optional)"
            rows={2}
            value={newRepo.description}
            onChange={(e) =>
              setNewRepo((r) => ({ ...r, description: e.target.value }))
            }
          />
          <div className="flex items-center justify-between gap-2">
            <select
              className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              value={newRepo.visibility}
              onChange={(e) =>
                setNewRepo((r) => ({ ...r, visibility: e.target.value }))
              }
            >
              <option value="PRIVATE">Private</option>
              <option value="PUBLIC">Public</option>
            </select>
            <label className="inline-flex items-center text-[11px] text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                className="mr-1"
                checked={newRepo.initReadme}
                onChange={(e) =>
                  setNewRepo((r) => ({ ...r, initReadme: e.target.checked }))
                }
              />
              Init README
            </label>
          </div>
          <button
            type="submit"
            disabled={creatingRepo}
            className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {creatingRepo ? 'Creating...' : 'Create repository'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Repositories
          </div>
          <div className="max-h-80 overflow-auto text-xs">
            {repos.length === 0 && (
              <div className="px-3 py-2 text-slate-500">
                No repositories yet. Create one above.
              </div>
            )}
            {repos.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRepo(r)}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                  selectedRepo?.id === r.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                  <span className="truncate">
                    {r.account?.username
                      ? `${r.account.username}/${r.slug || r.name}`
                      : r.slug || r.name}
                  </span>
                  <span className="uppercase">
                    {r.visibility || 'PRIVATE'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {(r._count?.branches ?? 0)} branches ·{' '}
                  {(r._count?.pullRequests ?? 0)} PRs
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {loading && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading repositories...
          </div>
        )}

        {!loading && !selectedRepo && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Select a repository from the left to see branches and pull requests.
          </div>
        )}

        {!loading && selectedRepo && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {selectedRepo.name}
                  </div>
                  {selectedRepo.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedRepo.description}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Owner:{' '}
                  {selectedRepo.account?.displayName ||
                    selectedRepo.account?.username ||
                    'You'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Branches
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {branches.length} total
                  </span>
                </div>
                <form
                  onSubmit={handleCreateBranch}
                  className="mb-2 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                      placeholder="New branch name"
                      value={newBranch.name}
                      onChange={(e) =>
                        setNewBranch((b) => ({ ...b, name: e.target.value }))
                      }
                    />
                    <button
                      type="submit"
                      disabled={creatingBranch}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {creatingBranch ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      From
                    </span>
                    <select
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                      value={newBranch.fromBranch}
                      onChange={(e) =>
                        setNewBranch((b) => ({
                          ...b,
                          fromBranch: e.target.value,
                        }))
                      }
                    >
                      <option value="">Default</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
                <div className="max-h-64 overflow-auto space-y-2 text-xs">
                  {branches.length === 0 && (
                    <div className="text-slate-500 dark:text-slate-400">
                      No branches yet.
                    </div>
                  )}
                  {branches.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-100">
                        {b.name}
                      </div>
                      {b.headCommit && (
                        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="truncate">
                            {b.headCommit.message}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span>
                              {b.headCommit.author?.displayName || 'Unknown'}
                            </span>
                            <span>
                              {new Date(
                                b.headCommit.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Pull requests
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {pulls.length} open
                  </span>
                </div>
                <form
                  onSubmit={handleCreatePr}
                  className="mb-2 space-y-2 text-xs"
                >
                  <input
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                    placeholder="PR title (10–200 characters)"
                    value={newPr.title}
                    onChange={(e) =>
                      setNewPr((p) => ({ ...p, title: e.target.value }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                      value={newPr.sourceBranchId}
                      onChange={(e) =>
                        setNewPr((p) => ({
                          ...p,
                          sourceBranchId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Source branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      →
                    </span>
                    <select
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                      value={newPr.targetBranchId}
                      onChange={(e) =>
                        setNewPr((p) => ({
                          ...p,
                          targetBranchId: e.target.value,
                        }))
                      }
                    >
                      <option value="">Target branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                    rows={2}
                    placeholder="Description (optional)"
                    value={newPr.description}
                    onChange={(e) =>
                      setNewPr((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="submit"
                    disabled={creatingPr}
                    className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creatingPr ? 'Creating...' : 'Create pull request'}
                  </button>
                </form>
                <div className="max-h-64 overflow-auto space-y-2 text-xs">
                  {pulls.length === 0 && (
                    <div className="text-slate-500 dark:text-slate-400">
                      No open pull requests.
                    </div>
                  )}
                  {pulls.map((pr) => (
                    <div
                      key={pr.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-100 mb-0.5">
                        #{pr.number} {pr.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                        <span>
                          {pr.author?.displayName || pr.author?.username || 'Author'}
                        </span>
                        <span className="uppercase">
                          {pr.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {pr.sourceBranch?.name} → {pr.targetBranch?.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {(pr._count?.comments ?? 0)} comments ·{' '}
                        {(pr._count?.reviewers ?? 0)} reviewers
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

