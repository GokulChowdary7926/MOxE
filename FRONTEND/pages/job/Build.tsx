import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type BuildPipeline = {
  id: string;
  name: string;
  branchFilter: string;
  triggers?: any;
  stages?: any;
  externalKey?: string | null;
  repo?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  _count?: {
    runs: number;
  };
};

type BuildRun = {
  id: string;
  pipelineId: string;
  status: string;
  triggerType: string;
  commitSha?: string | null;
  branch?: string | null;
  logsUrl?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
};

type PipelineDetail = {
  pipeline: BuildPipeline;
  runs: BuildRun[];
};

type PipelineFormState = {
  repoId: string;
  name: string;
  branchFilter: string;
  triggersJson: string;
  stagesJson: string;
  externalKey: string;
};

export default function Build() {
  const [pipelines, setPipelines] = useState<BuildPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<PipelineDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [form, setForm] = useState<PipelineFormState>({
    repoId: '',
    name: '',
    branchFilter: 'main',
    triggersJson: '{"push":true,"manual":true}',
    stagesJson: '[]',
    externalKey: '',
  });

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/build/pipelines`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load pipelines');
      }
      const data = await res.json();
      setPipelines(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const fetchPipelineDetail = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/build/pipelines/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load pipeline');
      }
      const data = (await res.json()) as PipelineDetail;
      setSelected(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pipeline');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('You must be logged in to use MOxE Build.');
      return;
    }
    fetchPipelines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create pipelines');
      return;
    }
    if (!form.repoId.trim() || !form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const parseJsonSafe = (text: string, fallback: any) => {
        if (!text.trim()) return fallback;
        try {
          return JSON.parse(text);
        } catch {
          return fallback;
        }
      };
      const payload: any = {
        repoId: form.repoId.trim(),
        name: form.name.trim(),
        branchFilter: form.branchFilter.trim() || 'main',
        triggers: parseJsonSafe(form.triggersJson, { push: true, manual: true }),
        stages: parseJsonSafe(form.stagesJson, []),
      };
      if (form.externalKey.trim()) payload.externalKey = form.externalKey.trim();

      const res = await fetch(`${API_BASE}/build/pipelines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create pipeline');
      }
      const created = (await res.json()) as BuildPipeline;
      setPipelines((prev) => [created, ...prev]);
      setForm((prev) => ({
        ...prev,
        name: '',
        externalKey: '',
      }));
    } catch (e: any) {
      setError(e?.message || 'Failed to create pipeline');
    } finally {
      setCreating(false);
    }
  };

  const openPipeline = (pipeline: BuildPipeline) => {
    fetchPipelineDetail(pipeline.id);
  };

  const statusBadgeClasses = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS' || s === 'PASSED') {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (s === 'FAILED' || s === 'ERROR') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    }
    if (s === 'RUNNING' || s === 'IN_PROGRESS') {
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
    }
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return '–';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '–';
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading && pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Build…</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">MOxE Build</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        Define pipelines for your code repositories and track recent runs for your Job account.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!selected && (
        <>
          <form
            onSubmit={handleCreate}
            className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                New pipeline
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Repository ID
                </label>
                <input
                  type="text"
                  value={form.repoId}
                  onChange={(e) => setForm((prev) => ({ ...prev, repoId: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Paste a Code repository id"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  You must own or be a collaborator on the repository.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Pipeline name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Backend CI/CD"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Branch filter
                </label>
                <input
                  type="text"
                  value={form.branchFilter}
                  onChange={(e) => setForm((prev) => ({ ...prev, branchFilter: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="main"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  External key (optional)
                </label>
                <input
                  type="text"
                  value={form.externalKey}
                  onChange={(e) => setForm((prev) => ({ ...prev, externalKey: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Used to match webhook payloads"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Triggers (JSON)
                </label>
                <textarea
                  rows={2}
                  value={form.triggersJson}
                  onChange={(e) => setForm((prev) => ({ ...prev, triggersJson: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Stages (JSON)
                </label>
                <textarea
                  rows={2}
                  value={form.stagesJson}
                  onChange={(e) => setForm((prev) => ({ ...prev, stagesJson: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-50 font-mono"
                  placeholder='[{"name":"build"},{"name":"test"},{"name":"deploy"}]'
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create pipeline'}
              </button>
            </div>
          </form>

          {pipelines.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No pipelines yet. Use the form above to create your first pipeline for a Code repository.
            </p>
          ) : (
            <div className="space-y-3">
              {pipelines.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openPipeline(p)}
                  className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-50">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {p.repo?.name || 'Unknown repo'} · branch filter {p.branchFilter || 'main'}
                      </div>
                    </div>
                    {p._count && (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {p._count.runs} runs
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-sm text-indigo-600 dark:text-indigo-400 mb-3"
          >
            ← Back to pipelines
          </button>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50">
                {selected.pipeline.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selected.pipeline.repo?.name || 'Unknown repo'} · branch filter{' '}
                {selected.pipeline.branchFilter || 'main'}
              </p>
            </div>
            {loadingDetail && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Refreshing…</span>
            )}
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Recent runs
            </p>
            {selected.runs.length === 0 ? (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No runs recorded yet. Configure your external CI to call the MOxE Build webhook when
                runs start and finish.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-1 pr-3">Status</th>
                      <th className="py-1 pr-3">Trigger</th>
                      <th className="py-1 pr-3">Branch</th>
                      <th className="py-1 pr-3">Commit</th>
                      <th className="py-1 pr-3">Started</th>
                      <th className="py-1 pr-3">Finished</th>
                      <th className="py-1">Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.runs.map((run) => (
                      <tr key={run.id} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-1 pr-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadgeClasses(
                              run.status || ''
                            )}`}
                          >
                            {(run.status || 'UNKNOWN').toLowerCase()}
                          </span>
                        </td>
                        <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">
                          {(run.triggerType || 'WEBHOOK').toLowerCase()}
                        </td>
                        <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">
                          {run.branch || '–'}
                        </td>
                        <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">
                          {run.commitSha ? `${run.commitSha.substring(0, 7)}…` : '–'}
                        </td>
                        <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">
                          {formatDateTime(run.startedAt || run.createdAt)}
                        </td>
                        <td className="py-1 pr-3 text-slate-700 dark:text-slate-200">
                          {formatDateTime(run.finishedAt)}
                        </td>
                        <td className="py-1 text-slate-700 dark:text-slate-200">
                          {run.logsUrl ? (
                            <a
                              href={run.logsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 dark:text-indigo-400 hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            '–'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

