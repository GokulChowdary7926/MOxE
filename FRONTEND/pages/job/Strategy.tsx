import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';
import { safeFirst } from '../../utils/safeAccess';

const API_BASE = getApiBase();

type StrategyStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
type StrategyHorizon = 'QUARTER' | 'YEAR' | 'MULTI_YEAR' | 'CUSTOM';

type StrategyPlan = {
  id: string;
  name: string;
  horizon: StrategyHorizon;
  timeframe?: string | null;
  focusAreas?: string[];
  summary?: string | null;
  status: StrategyStatus;
  createdAt: string;
  updatedAt: string;
};

type PlanFormState = {
  name: string;
  horizon: StrategyHorizon;
  timeframe: string;
  summary: string;
  focusAreasText: string;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Strategy() {
  const [plans, setPlans] = useState<StrategyPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StrategyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<PlanFormState>({
    name: '',
    horizon: 'YEAR',
    timeframe: '',
    summary: '',
    focusAreasText: '',
  });

  const headers = useAuthHeaders();

  const parseFocusAreas = (text: string): string[] => {
    return text
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const focusAreasToText = (areas?: string[]) => {
    return (areas || []).join('\n');
  };

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/strategy/plans`, { headers });
      if (!res.ok) throw new Error('Failed to load strategy plans');
      const data = (await res.json()) as StrategyPlan[];
      setPlans(Array.isArray(data) ? data : []);
      const firstPlan = safeFirst(Array.isArray(data) ? data : null);
      if (!selectedPlan && firstPlan) {
        setSelectedPlan(firstPlan);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load strategy plans');
    } finally {
      setLoading(false);
    }
  };

  const refreshPlan = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/job/strategy/plans/${id}`, { headers });
      if (!res.ok) return;
      const plan = (await res.json()) as StrategyPlan;
      setPlans((prev) => prev.map((p) => (p.id === id ? plan : p)));
      setSelectedPlan((prev) => (prev && prev.id === id ? plan : prev));
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        horizon: form.horizon,
        timeframe: form.timeframe.trim() || undefined,
        summary: form.summary.trim() || undefined,
        focusAreas: parseFocusAreas(form.focusAreasText),
      };
      const res = await fetch(`${API_BASE}/job/strategy/plans`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create strategy plan');
      }
      const created = (await res.json()) as StrategyPlan;
      setPlans((prev) => [created, ...prev]);
      setSelectedPlan(created);
      setShowCreate(false);
      setForm({
        name: '',
        horizon: 'YEAR',
        timeframe: '',
        summary: '',
        focusAreasText: '',
      });
    } catch (e: any) {
      setError(e.message || 'Failed to create strategy plan');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (plan: StrategyPlan, status: StrategyStatus) => {
    setUpdatingStatus(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/strategy/plans/${plan.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update status');
      }
      const updated = (await res.json()) as StrategyPlan;
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPlan((prev) => (prev && prev.id === updated.id ? updated : prev));
    } catch (e: any) {
      setError(e.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this strategy plan? This cannot be undone.')) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/strategy/plans/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete strategy plan');
      }
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setSelectedPlan((prev) => (prev && prev.id === id ? null : prev));
    } catch (e: any) {
      setError(e.message || 'Failed to delete strategy plan');
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (plan: StrategyPlan) => {
    setSelectedPlan(plan);
    setShowCreate(true);
    setForm({
      name: plan.name,
      horizon: plan.horizon,
      timeframe: plan.timeframe || '',
      summary: plan.summary || '',
      focusAreasText: focusAreasToText(plan.focusAreas),
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        horizon: form.horizon,
        timeframe: form.timeframe.trim() || null,
        summary: form.summary.trim() || null,
        focusAreas: parseFocusAreas(form.focusAreasText),
      };
      const res = await fetch(`${API_BASE}/job/strategy/plans/${selectedPlan.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update strategy plan');
      }
      const updated = (await res.json()) as StrategyPlan;
      setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPlan(updated);
      setShowCreate(false);
    } catch (e: any) {
      setError(e.message || 'Failed to update strategy plan');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderStatusBadge = (status: StrategyStatus) => {
    const base = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium';
    switch (status) {
      case 'ACTIVE':
        return <span className={`${base} bg-emerald-100 text-emerald-700`}>Active</span>;
      case 'COMPLETED':
        return <span className={`${base} bg-[#DEEBFF] dark:bg-[#1D2125] text-[#0052CC] dark:text-[#2684FF]`}>Completed</span>;
      case 'ARCHIVED':
        return <span className={`${base} bg-slate-200 text-slate-700`}>Archived</span>;
      default:
        return <span className={`${base} bg-amber-100 text-amber-700`}>Draft</span>;
    }
  };

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE STRATEGY" toolIconMaterial="strategy">
    <div className="flex flex-col gap-4">
      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={() => {
            setShowCreate(true);
            setSelectedPlan(null);
            setForm({
              name: '',
              horizon: 'YEAR',
              timeframe: '',
              summary: '',
              focusAreasText: '',
            });
          }}
          className="w-full inline-flex items-center justify-center rounded-md bg-[#0052CC] hover:bg-[#0747A6] dark:bg-[#2684FF] dark:hover:bg-[#0052CC] text-white text-sm font-medium px-3 py-2"
        >
          New strategy plan
        </button>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[420px] overflow-auto">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Plans
          </div>
          {loading && plans.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">Loading…</div>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {plans.map((p) => {
              const isActive = selectedPlan?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlan(p)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    isActive
                      ? 'bg-[#DEEBFF] dark:bg-[#1D2125] text-[#0052CC] dark:text-[#2684FF]'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-medium truncate">{p.name}</span>
                    {renderStatusBadge(p.status)}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {p.timeframe || (p.horizon === 'YEAR' ? 'Yearly' : p.horizon)}
                    </span>
                    <span>
                      {new Date(p.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: '2-digit',
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
            {!loading && plans.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                No strategy plans yet. Create one to define your Job‑level direction.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full min-w-0 space-y-4">
        {showCreate && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {selectedPlan ? 'Edit strategy plan' : 'New strategy plan'}
            </h3>
            <form onSubmit={selectedPlan ? handleUpdate : handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Name
                </label>
                <input
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                  placeholder="e.g. 2026 Product Strategy"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Horizon
                  </label>
                  <select
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    value={form.horizon}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, horizon: e.target.value as StrategyHorizon }))
                    }
                  >
                    <option value="QUARTER">Quarter</option>
                    <option value="YEAR">Year</option>
                    <option value="MULTI_YEAR">Multi‑year</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                    Timeframe
                  </label>
                  <input
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                    placeholder="e.g. Q2 2026, 2026–2028"
                    value={form.timeframe}
                    onChange={(e) => setForm((prev) => ({ ...prev, timeframe: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Summary
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder="High‑level description of this strategy and what success looks like."
                  value={form.summary}
                  onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  Focus areas (one per line or comma‑separated)
                </label>
                <textarea
                  className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  rows={3}
                  placeholder={'e.g.\nGrowth\nReliability\nDeveloper Experience'}
                  value={form.focusAreasText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, focusAreasText: e.target.value }))
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-50 dark:bg-[#2684FF] dark:hover:bg-[#0052CC] text-white text-xs font-medium px-3 py-1.5"
                >
                  {saving
                    ? selectedPlan
                      ? 'Saving…'
                      : 'Creating…'
                    : selectedPlan
                    ? 'Save changes'
                    : 'Create plan'}
                </button>
              </div>
            </form>
          </div>
        )}

        {selectedPlan && !showCreate && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  {selectedPlan.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{selectedPlan.timeframe || selectedPlan.horizon}</span>
                  <span>•</span>
                  <span>
                    Created{' '}
                    {new Date(selectedPlan.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {renderStatusBadge(selectedPlan.status)}
                <div className="flex items-center gap-2">
                  <select
                    className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-900 dark:text-slate-100"
                    value={selectedPlan.status}
                    onChange={(e) =>
                      handleStatusChange(selectedPlan, e.target.value as StrategyStatus)
                    }
                    disabled={updatingStatus}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => openEdit(selectedPlan)}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedPlan.id)}
                    disabled={deletingId === selectedPlan.id}
                    className="inline-flex items-center justify-center rounded-md border border-red-300 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                  >
                    {deletingId === selectedPlan.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>

            {selectedPlan.summary && (
              <div className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                {selectedPlan.summary}
              </div>
            )}

            {selectedPlan.focusAreas && selectedPlan.focusAreas.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Focus areas
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPlan.focusAreas.map((fa) => (
                    <span
                      key={fa}
                      className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-[11px] text-slate-700 dark:text-slate-200"
                    >
                      {fa}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!selectedPlan && !showCreate && !loading && plans.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm text-slate-500 dark:text-slate-400">
            Select a strategy plan on the left to view details.
          </div>
        )}

        <JobBibleReferenceSection toolKey="strategy" />
      </div>
    </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}

