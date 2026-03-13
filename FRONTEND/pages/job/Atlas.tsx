import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type AtlasKeyResult = {
  id: string;
  title: string;
  unit?: string | null;
  targetValue?: number | null;
  startValue?: number | null;
  currentValue?: number | null;
  weight: number;
  links?: {
    issueId: string;
    issue?: {
      id: string;
      summary: string | null;
      column?: { id: string; name: string } | null;
      archivedAt?: string | null;
    } | null;
  }[];
};

type AtlasObjective = {
  id: string;
  title: string;
  description?: string | null;
  periodType: 'QUARTER' | 'HALF_YEAR' | 'YEAR' | 'CUSTOM';
  startDate: string;
  endDate: string;
  state: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  progress: number;
  keyResults: AtlasKeyResult[];
  linkedProject?: { id: string; name: string } | null;
};

type ObjectiveFormState = {
  title: string;
  description: string;
  periodType: 'QUARTER' | 'HALF_YEAR' | 'YEAR' | 'CUSTOM';
  startDate: string;
  endDate: string;
  keyResults: { title: string; unit: string; targetValue: string }[];
};

export default function Atlas() {
  const [objectives, setObjectives] = useState<AtlasObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<AtlasObjective | null>(null);
  const [updatingState, setUpdatingState] = useState(false);
  const [progressInputs, setProgressInputs] = useState<Record<string, { value: string; note: string }>>(
    {}
  );
  const [savingProgressFor, setSavingProgressFor] = useState<string | null>(null);
  const [trackProjects, setTrackProjects] = useState<{ id: string; name: string }[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [linkingProject, setLinkingProject] = useState(false);
  const [updatingLinksFor, setUpdatingLinksFor] = useState<string | null>(null);

  const [form, setForm] = useState<ObjectiveFormState>({
    title: '',
    description: '',
    periodType: 'QUARTER',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
    keyResults: [
      { title: '', unit: '', targetValue: '' },
    ],
  });

  const token = localStorage.getItem('token');

  const authHeaders = token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

  const fetchObjectives = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/objectives`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load objectives');
      }
      const data = await res.json();
      setObjectives(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load objectives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTrackProjects = async () => {
    if (!token) return;
    setLoadingProjects(true);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load Track projects');
      }
      const data = await res.json();
      const normalized =
        Array.isArray(data) && data.length > 0
          ? data.map((p: any) => ({ id: p.id, name: p.name || p.title || 'Untitled project' }))
          : [];
      setTrackProjects(normalized);
    } catch {
      // Silent fail; Atlas can still function without project list.
    } finally {
      setLoadingProjects(false);
    }
  };

  const refreshObjectiveDetail = async (objectiveId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/atlas/objectives/${objectiveId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) return;
      const data = await res.json();
      const detail: AtlasObjective | null =
        data && data.objective
          ? {
              ...data.objective,
              progress: typeof data.progress === 'number' ? data.progress : data.objective.progress ?? 0,
            }
          : null;
      if (!detail) return;

      setObjectives((prev) =>
        prev.map((o) => (o.id === detail.id ? { ...o, ...detail } : o))
      );
      setSelectedObjective((prev) => (prev && prev.id === detail.id ? { ...detail } : prev));
    } catch {
      // ignore
    }
  };

  const updateFormField = <K extends keyof ObjectiveFormState>(key: K, value: ObjectiveFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateKeyResult = (index: number, field: 'title' | 'unit' | 'targetValue', value: string) => {
    setForm((prev) => {
      const next = [...prev.keyResults];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, keyResults: next };
    });
  };

  const addKeyResultRow = () => {
    setForm((prev) => ({
      ...prev,
      keyResults: [...prev.keyResults, { title: '', unit: '', targetValue: '' }],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create objectives');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        periodType: form.periodType,
        startDate: form.startDate,
        endDate: form.endDate,
        keyResults: form.keyResults
          .filter((kr) => kr.title.trim().length > 0)
          .map((kr) => ({
            title: kr.title.trim(),
            unit: kr.unit.trim() || undefined,
            targetValue: kr.targetValue ? Number(kr.targetValue) : undefined,
          })),
      };
      const res = await fetch(`${API_BASE}/atlas/objectives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to create objective');
      }
      const created = await res.json();
      setObjectives((prev) => [created, ...prev]);
      setShowCreate(false);
      setForm({
        title: '',
        description: '',
        periodType: 'QUARTER',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
        keyResults: [{ title: '', unit: '', targetValue: '' }],
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to create objective');
    } finally {
      setCreating(false);
    }
  };

  const openObjective = async (objective: AtlasObjective) => {
    setSelectedObjective(objective);
    const baseObj = objective;
    const initialInputs: Record<string, { value: string; note: string }> = {};
    baseObj.keyResults.forEach((kr) => {
      const current = kr.currentValue ?? kr.startValue ?? 0;
      initialInputs[kr.id] = { value: String(current), note: '' };
    });
    setProgressInputs(initialInputs);
    if (token) {
      await Promise.all([refreshObjectiveDetail(objective.id), fetchTrackProjects()]);
    }
  };

  const closeObjective = () => {
    setSelectedObjective(null);
  };

  const renderObjectiveCard = (obj: AtlasObjective) => {
    const periodLabel = `${new Date(obj.startDate).toLocaleDateString()} – ${new Date(
      obj.endDate
    ).toLocaleDateString()}`;
    return (
      <button
        key={obj.id}
        type="button"
        onClick={() => openObjective(obj)}
        className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">
              {obj.title}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{periodLabel}</div>
            {obj.linkedProject && (
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Linked project: <span className="font-medium">{obj.linkedProject.name}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:text-slate-100">
              {obj.state.toLowerCase()}
            </span>
            <div className="w-24">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(obj.progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{ width: `${Math.max(0, Math.min(100, obj.progress))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </button>
    );
  };

  const handleChangeObjectiveState = async (
    objective: AtlasObjective,
    nextState: AtlasObjective['state']
  ) => {
    if (!token || objective.state === nextState) return;
    setUpdatingState(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/objectives/${objective.id}/state`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ state: nextState }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update objective state');
      }
      setObjectives((prev) =>
        prev.map((o) => (o.id === objective.id ? { ...o, state: nextState } : o))
      );
      setSelectedObjective((prev) => (prev && prev.id === objective.id ? { ...prev, state: nextState } : prev));
    } catch (e: any) {
      setError(e?.message || 'Failed to update objective state');
    } finally {
      setUpdatingState(false);
    }
  };

  const handleSaveKeyResultProgress = async (kr: AtlasKeyResult, objective: AtlasObjective) => {
    if (!token) {
      setError('You must be logged in to update progress');
      return;
    }
    const input = progressInputs[kr.id];
    if (!input || !input.value) return;

    const numericValue = Number(input.value);
    if (!Number.isFinite(numericValue)) {
      setError('Progress value must be a valid number');
      return;
    }

    setSavingProgressFor(kr.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/key-results/${kr.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ value: numericValue, note: input.note || undefined }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save progress');
      }
      const data = await res.json();
      const newProgress = typeof data?.progress === 'number' ? data.progress : objective.progress;

      // Update objective list + selected objective in-place
      setObjectives((prev) =>
        prev.map((o) =>
          o.id === objective.id
            ? {
                ...o,
                progress: newProgress,
                keyResults: o.keyResults.map((k) =>
                  k.id === kr.id ? { ...k, currentValue: numericValue } : k
                ),
              }
            : o
        )
      );
      setSelectedObjective((prev) =>
        prev && prev.id === objective.id
          ? {
              ...prev,
              progress: newProgress,
              keyResults: prev.keyResults.map((k) =>
                k.id === kr.id ? { ...k, currentValue: numericValue } : k
              ),
            }
          : prev
      );
    } catch (e: any) {
      setError(e?.message || 'Failed to save progress');
    } finally {
      setSavingProgressFor(null);
    }
  };

  const handleLinkProject = async () => {
    if (!token || !selectedObjective || !selectedProjectId) return;
    setLinkingProject(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/objectives/${selectedObjective.id}/track-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ projectId: selectedProjectId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to link project');
      }
      await refreshObjectiveDetail(selectedObjective.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to link project');
    } finally {
      setLinkingProject(false);
    }
  };

  const handleUnlinkProject = async () => {
    if (!token || !selectedObjective) return;
    setLinkingProject(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/objectives/${selectedObjective.id}/track-project`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to unlink project');
      }
      await refreshObjectiveDetail(selectedObjective.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to unlink project');
    } finally {
      setLinkingProject(false);
    }
  };

  const handleLinkIssue = async (kr: AtlasKeyResult, objective: AtlasObjective, issueId: string) => {
    if (!token || !issueId) return;
    setUpdatingLinksFor(kr.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/key-results/${kr.id}/track-issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ issueId }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to link issue');
      }
      await refreshObjectiveDetail(objective.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to link issue');
    } finally {
      setUpdatingLinksFor(null);
    }
  };

  const handleUnlinkIssue = async (
    kr: AtlasKeyResult,
    objective: AtlasObjective,
    issueId: string
  ) => {
    if (!token || !issueId) return;
    setUpdatingLinksFor(kr.id);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/atlas/key-results/${kr.id}/track-issues/${encodeURIComponent(issueId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to unlink issue');
      }
      await refreshObjectiveDetail(objective.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to unlink issue');
    } finally {
      setUpdatingLinksFor(null);
    }
  };

  if (loading && objectives.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Atlas...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">MOxE Atlas</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        Define quarterly objectives, track key results, and connect work across MOxE Track and Flow.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Your objectives
        </h3>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New objective
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Objective title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateFormField('title', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              placeholder="Ship v1 of our new onboarding experience"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              rows={2}
              placeholder="What outcome does this objective drive for your team or job search?"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Period
              </label>
              <select
                value={form.periodType}
                onChange={(e) =>
                  updateFormField(
                    'periodType',
                    e.target.value as ObjectiveFormState['periodType']
                  )
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              >
                <option value="QUARTER">Quarter</option>
                <option value="HALF_YEAR">Half-year</option>
                <option value="YEAR">Year</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Start date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateFormField('startDate', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                End date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateFormField('endDate', e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                Key results
              </label>
              <button
                type="button"
                onClick={addKeyResultRow}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400"
              >
                + Add key result
              </button>
            </div>
            <div className="space-y-2">
              {form.keyResults.map((kr, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={kr.title}
                    onChange={(e) => updateKeyResult(idx, 'title', e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                    placeholder="Increase qualified leads per week"
                    required={idx === 0}
                  />
                  <input
                    type="text"
                    value={kr.unit}
                    onChange={(e) => updateKeyResult(idx, 'unit', e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                    placeholder="leads / week"
                  />
                  <input
                    type="number"
                    value={kr.targetValue}
                    onChange={(e) => updateKeyResult(idx, 'targetValue', e.target.value)}
                    className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                    placeholder="100"
                    min={0}
                    step="any"
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800"
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create objective'}
            </button>
          </div>
        </form>
      )}

      {objectives.length === 0 ? (
        <p className="text-slate-500 text-sm">
          No objectives yet. Use “New objective” to define your first Atlas goal.
        </p>
      ) : (
        <div className="space-y-3">
          {objectives.map((obj) => renderObjectiveCard(obj))}
        </div>
      )}

      {selectedObjective && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {selectedObjective.title}
                </h3>
                {selectedObjective.description && (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {selectedObjective.description}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">State:</span>
                  <select
                    value={selectedObjective.state}
                    onChange={(e) =>
                      handleChangeObjectiveState(
                        selectedObjective,
                        e.target.value as AtlasObjective['state']
                      )
                    }
                    disabled={updatingState}
                    className="text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-slate-800 dark:text-slate-100"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Linked Track project
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <select
                      value={
                        selectedObjective.linkedProject?.id ||
                        selectedProjectId ||
                        (trackProjects[0]?.id ?? '')
                      }
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      disabled={loadingProjects || linkingProject}
                      className="w-full sm:w-64 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value="">
                        {loadingProjects ? 'Loading projects…' : 'Select a project'}
                      </option>
                      {trackProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleLinkProject}
                        disabled={linkingProject || !selectedProjectId}
                        className="text-xs px-3 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                      >
                        {linkingProject ? 'Linking…' : 'Link'}
                      </button>
                      {selectedObjective.linkedProject && (
                        <button
                          type="button"
                          onClick={handleUnlinkProject}
                          disabled={linkingProject}
                          className="text-xs px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 disabled:opacity-60"
                        >
                          Unlink
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedObjective.linkedProject && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Currently linked to: {selectedObjective.linkedProject.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeObjective}
                className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>Progress</span>
                <span>{Math.round(selectedObjective.progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, selectedObjective.progress))}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Key results
              </h4>
              {selectedObjective.keyResults.length === 0 ? (
                <p className="text-xs text-slate-500">
                  This objective has no key results yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedObjective.keyResults.map((kr) => {
                    const target = kr.targetValue ?? 0;
                    const start = kr.startValue ?? 0;
                    const current = kr.currentValue ?? start;
                    const span = target - start || 1;
                    const pct = Math.max(0, Math.min(1, (current - start) / span)) * 100;
                    const input = progressInputs[kr.id] || { value: '', note: '' };
                    const currentLinks = kr.links || [];
                    const [issueInput] =
                      ((): [string] => {
                        const existing = (kr as any).__issueInput as string | undefined;
                        return [existing ?? ''];
                      })();
                    return (
                      <div
                        key={kr.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-100">
                            {kr.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {current}
                            {kr.unit ? ` ${kr.unit}` : ''} / {target}
                            {kr.unit ? ` ${kr.unit}` : ''}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                          />
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-2 items-center">
                            <div className="flex flex-col gap-1">
                              <input
                                type="number"
                                value={input.value}
                                onChange={(e) =>
                                  setProgressInputs((prev) => ({
                                    ...prev,
                                    [kr.id]: { ...input, value: e.target.value },
                                  }))
                                }
                                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50"
                                placeholder="New value"
                              />
                              <input
                                type="text"
                                value={input.note}
                                onChange={(e) =>
                                  setProgressInputs((prev) => ({
                                    ...prev,
                                    [kr.id]: { ...input, note: e.target.value },
                                  }))
                                }
                                className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50"
                                placeholder="Optional note"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveKeyResultProgress(kr, selectedObjective)}
                              disabled={savingProgressFor === kr.id}
                              className="text-xs px-3 py-1 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
                            >
                              {savingProgressFor === kr.id ? 'Saving…' : 'Update'}
                            </button>
                          </div>
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-1">
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Linked Track issues
                            </p>
                            {currentLinks.length === 0 ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-500">
                                No issues linked yet.
                              </p>
                            ) : (
                              <ul className="space-y-1">
                                {currentLinks.map((link) => (
                                  <li
                                    key={link.issueId}
                                    className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300"
                                  >
                                    <span>
                                      {link.issue?.summary || link.issueId}
                                      {link.issue?.column?.name &&
                                        ` · ${link.issue.column.name}${
                                          link.issue.archivedAt ? ' (archived)' : ''
                                        }`}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUnlinkIssue(kr, selectedObjective, link.issueId)
                                      }
                                      disabled={updatingLinksFor === kr.id}
                                      className="text-[11px] text-red-500 hover:text-red-600"
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            <form
                              className="mt-2 flex gap-2"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formEl = e.currentTarget;
                                const inputEl = formEl.elements.namedItem(
                                  'issueId'
                                ) as HTMLInputElement | null;
                                const value = inputEl?.value.trim() || '';
                                if (!value) return;
                                handleLinkIssue(kr, selectedObjective, value);
                                if (inputEl) {
                                  inputEl.value = '';
                                }
                              }}
                            >
                              <input
                                name="issueId"
                                type="text"
                                className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-900 dark:text-slate-50"
                                placeholder="Add issue ID from Track"
                              />
                              <button
                                type="submit"
                                disabled={updatingLinksFor === kr.id}
                                className="text-[11px] px-2 py-1 rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 disabled:opacity-60"
                              >
                                {updatingLinksFor === kr.id ? 'Linking…' : 'Link'}
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

