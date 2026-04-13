import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

const API_BASE = getApiBase();

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
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  const fetchObjectives = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/atlas/objectives`, {
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        className={`w-full text-left p-4 ${JOB_MOBILE.trackCard} hover:border-primary/45 transition-colors`}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-on-surface">{obj.title}</div>
            <div className="text-xs text-on-surface-variant mt-1">{periodLabel}</div>
            {obj.linkedProject && (
              <div className="mt-1 text-xs text-on-surface-variant">
                Linked project: <span className="font-medium text-on-surface">{obj.linkedProject.name}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="inline-flex items-center rounded-full bg-surface-container-high px-2 py-0.5 text-[11px] font-medium text-on-surface">
              {obj.state.toLowerCase()}
            </span>
            <div className="w-24">
              <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1">
                <span>Progress</span>
                <span>{Math.round(obj.progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-[#2684FF]"
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
      <JobPageContent variant="track">
        <JobToolBibleShell toolTitle="MOxE ATLAS" toolIconMaterial="emoji_events">
          <div className="flex items-center justify-center py-12">
            <div className="h-16 w-full max-w-xs animate-pulse rounded-xl bg-surface-container-high" />
          </div>
        </JobToolBibleShell>
      </JobPageContent>
    );
  }

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE ATLAS" toolIconMaterial="emoji_events">
    <div>
      <div className="flex items-center justify-between mb-4 gap-3">
        <h3 className="text-sm font-semibold text-on-surface">Your objectives</h3>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="inline-flex items-center shrink-0 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] px-3 py-2 text-sm font-medium text-white min-h-[44px]"
        >
          + New objective
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={`mb-6 ${JOB_MOBILE.formPanel} space-y-4`}>
          <div>
            <label className={JOB_MOBILE.formLabel}>Objective title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateFormField('title', e.target.value)}
              className={JOB_MOBILE.formInput}
              placeholder="Ship v1 of our new onboarding experience"
              required
            />
          </div>
          <div>
            <label className={JOB_MOBILE.formLabel}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              className={JOB_MOBILE.formTextarea}
              rows={2}
              placeholder="What outcome does this objective drive for your team or job search?"
            />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={JOB_MOBILE.formLabel}>Period</label>
              <select
                value={form.periodType}
                onChange={(e) =>
                  updateFormField(
                    'periodType',
                    e.target.value as ObjectiveFormState['periodType']
                  )
                }
                className={JOB_MOBILE.formSelect}
              >
                <option value="QUARTER">Quarter</option>
                <option value="HALF_YEAR">Half-year</option>
                <option value="YEAR">Year</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div>
              <label className={JOB_MOBILE.formLabel}>Start date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => updateFormField('startDate', e.target.value)}
                className={JOB_MOBILE.formInput}
              />
            </div>
            <div>
              <label className={JOB_MOBILE.formLabel}>End date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => updateFormField('endDate', e.target.value)}
                className={JOB_MOBILE.formInput}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-on-surface-variant">
                Key results
              </span>
              <button
                type="button"
                onClick={addKeyResultRow}
                className="text-xs font-medium text-[#2684FF] min-h-[44px] px-1"
              >
                + Add key result
              </button>
            </div>
            <div className="space-y-2">
              {form.keyResults.map((kr, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={kr.title}
                    onChange={(e) => updateKeyResult(idx, 'title', e.target.value)}
                    className={JOB_MOBILE.formInput}
                    placeholder="Increase qualified leads per week"
                    required={idx === 0}
                  />
                  <input
                    type="text"
                    value={kr.unit}
                    onChange={(e) => updateKeyResult(idx, 'unit', e.target.value)}
                    className={JOB_MOBILE.formInput}
                    placeholder="leads / week"
                  />
                  <input
                    type="number"
                    value={kr.targetValue}
                    onChange={(e) => updateKeyResult(idx, 'targetValue', e.target.value)}
                    className={JOB_MOBILE.formInput}
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
              className={`px-3 py-2 rounded-xl text-sm text-on-surface border border-outline-variant/35 bg-surface-container min-h-[44px] ${creating ? 'opacity-60' : ''}`}
              disabled={creating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-sm font-medium text-white disabled:opacity-60 min-h-[44px]"
              disabled={creating}
            >
              {creating ? 'Creating…' : 'Create objective'}
            </button>
          </div>
        </form>
      )}

      {objectives.length === 0 ? (
        <p className={JOB_MOBILE.formMuted}>
          No objectives yet. Use “New objective” to define your first Atlas goal.
        </p>
      ) : (
        <div className="space-y-3">
          {objectives.map((obj) => renderObjectiveCard(obj))}
        </div>
      )}

      {selectedObjective && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-surface-container border border-outline-variant/25 shadow-xl p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">{selectedObjective.title}</h3>
                {selectedObjective.description && (
                  <p className="mt-1 text-sm text-on-surface-variant">{selectedObjective.description}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant">State:</span>
                  <select
                    value={selectedObjective.state}
                    onChange={(e) =>
                      handleChangeObjectiveState(
                        selectedObjective,
                        e.target.value as AtlasObjective['state']
                      )
                    }
                    disabled={updatingState}
                    className={`${JOB_MOBILE.formSelect} text-xs min-h-0 py-1.5`}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-on-surface-variant">Linked Track project</p>
                  <div className="flex flex-col gap-2">
                    <select
                      value={
                        selectedObjective.linkedProject?.id ||
                        selectedProjectId ||
                        (trackProjects[0]?.id ?? '')
                      }
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      disabled={loadingProjects || linkingProject}
                      className={`${JOB_MOBILE.formSelect} text-xs`}
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
                        className="text-xs px-3 py-2 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium disabled:opacity-60 min-h-[40px]"
                      >
                        {linkingProject ? 'Linking…' : 'Link'}
                      </button>
                      {selectedObjective.linkedProject && (
                        <button
                          type="button"
                          onClick={handleUnlinkProject}
                          disabled={linkingProject}
                          className="text-xs px-3 py-2 rounded-xl border border-outline-variant/35 text-on-surface bg-surface-container-low disabled:opacity-60 min-h-[40px]"
                        >
                          Unlink
                        </button>
                      )}
                    </div>
                  </div>
                  {selectedObjective.linkedProject && (
                    <p className="text-[11px] text-on-surface-variant">
                      Currently linked to: {selectedObjective.linkedProject.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeObjective}
                className="text-sm text-on-surface-variant hover:text-on-surface min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                <span>Progress</span>
                <span>{Math.round(selectedObjective.progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-[#2684FF]"
                  style={{
                    width: `${Math.max(0, Math.min(100, selectedObjective.progress))}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface mb-2">Key results</h4>
              {selectedObjective.keyResults.length === 0 ? (
                <p className="text-xs text-on-surface-variant">
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
                        className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="text-xs font-medium text-on-surface">{kr.title}</div>
                          <div className="text-[11px] text-on-surface-variant">
                            {current}
                            {kr.unit ? ` ${kr.unit}` : ''} / {target}
                            {kr.unit ? ` ${kr.unit}` : ''}
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                          />
                        </div>
                        <div className="mt-2 space-y-2">
                          <div className="grid grid-cols-1 gap-2 items-center">
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
                                className={`${JOB_MOBILE.formInput} text-xs min-h-0 py-1.5`}
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
                                className={`${JOB_MOBILE.formInput} text-xs min-h-0 py-1.5`}
                                placeholder="Optional note"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSaveKeyResultProgress(kr, selectedObjective)}
                              disabled={savingProgressFor === kr.id}
                              className="text-xs px-3 py-2 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-white font-medium disabled:opacity-60 min-h-[40px]"
                            >
                              {savingProgressFor === kr.id ? 'Saving…' : 'Update'}
                            </button>
                          </div>
                          <div className="border-t border-outline-variant/20 pt-2 mt-1">
                            <p className="text-[11px] font-medium text-on-surface-variant mb-1">
                              Linked Track issues
                            </p>
                            {currentLinks.length === 0 ? (
                              <p className="text-[11px] text-on-surface-variant">
                                No issues linked yet.
                              </p>
                            ) : (
                              <ul className="space-y-1">
                                {currentLinks.map((link) => (
                                  <li
                                    key={link.issueId}
                                    className="flex items-center justify-between gap-2 text-[11px] text-on-surface-variant"
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
                                className={`flex-1 ${JOB_MOBILE.formInput} text-[11px] min-h-[40px]`}
                                placeholder="Add issue ID from Track"
                              />
                              <button
                                type="submit"
                                disabled={updatingLinksFor === kr.id}
                                className="text-[11px] px-2 py-2 rounded-xl border border-outline-variant/35 text-on-surface bg-surface-container disabled:opacity-60 min-h-[40px]"
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
      <JobBibleReferenceSection toolKey="atlas" />
    </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}

