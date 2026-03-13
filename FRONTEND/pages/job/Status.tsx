import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type StatusPage = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  visibility?: 'PUBLIC' | 'PRIVATE';
  _count?: { components?: number; incidents?: number };
};

type StatusComponent = {
  id: string;
  name: string;
  description?: string | null;
  type?: string;
  status?: string;
};

type StatusIncident = {
  id: string;
  name: string;
  severity: string;
  status: string;
  createdAt: string;
  _count?: { updates?: number };
  affectedComponents?: { component: StatusComponent }[];
};

type PageDetail = StatusPage & {
  components?: StatusComponent[];
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

export default function Status() {
  const [pages, setPages] = useState<StatusPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<PageDetail | null>(null);
  const [incidents, setIncidents] = useState<StatusIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingPage, setCreatingPage] = useState(false);
  const [creatingComponent, setCreatingComponent] = useState(false);
  const [creatingIncident, setCreatingIncident] = useState(false);
  const [resolvingIncidentId, setResolvingIncidentId] = useState<string | null>(
    null,
  );
  const [newPage, setNewPage] = useState({
    name: '',
    description: '',
    visibility: 'PUBLIC',
  });
  const [newComponent, setNewComponent] = useState({
    name: '',
    type: 'API',
  });
  const [newIncident, setNewIncident] = useState({
    name: '',
    severity: 'MINOR',
    componentIds: [] as string[],
  });
  const [resolutionSummary, setResolutionSummary] = useState('');

  const headers = useAuthHeaders();

  const loadPages = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/status/pages`, { headers });
      if (!res.ok) throw new Error('Failed to load status pages');
      const data = await res.json();
      setPages(data || []);
      if (!selectedPage && data?.length) {
        await loadPageDetail(data[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load status pages');
    } finally {
      setLoading(false);
    }
  };

  const loadPageDetail = async (pageId: string) => {
    setError(null);
    setLoading(true);
    try {
      const [pageRes, incRes] = await Promise.all([
        fetch(`${API_BASE}/job/status/pages/${pageId}`, { headers }),
        fetch(
          `${API_BASE}/job/status/pages/${pageId}/incidents?resolved=false`,
          { headers },
        ),
      ]);
      if (!pageRes.ok) throw new Error('Failed to load page');
      if (!incRes.ok) throw new Error('Failed to load incidents');
      const pageData = await pageRes.json();
      const incData = await incRes.json();
      setSelectedPage(pageData);
      setIncidents(incData || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load status page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPage.name.trim()) return;
    setCreatingPage(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/status/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newPage.name.trim(),
          description: newPage.description.trim() || undefined,
          visibility: newPage.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create status page');
      }
      const created = await res.json();
      setNewPage({ name: '', description: '', visibility: 'PUBLIC' });
      await loadPages();
      await loadPageDetail(created.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create status page');
    } finally {
      setCreatingPage(false);
    }
  };

  const handleCreateComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage || !newComponent.name.trim()) return;
    setCreatingComponent(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/status/pages/${selectedPage.id}/components`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: newComponent.name.trim(),
            type: newComponent.type,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to add component');
      }
      setNewComponent({ name: '', type: newComponent.type });
      await loadPageDetail(selectedPage.id);
    } catch (e: any) {
      setError(e.message || 'Failed to add component');
    } finally {
      setCreatingComponent(false);
    }
  };

  const handleUpdateComponentStatus = async (
    componentId: string,
    status: string,
  ) => {
    if (!selectedPage) return;
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/status/pages/${selectedPage.id}/components/${componentId}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status }),
        },
      );
      if (!res.ok) throw new Error('Failed to update component');
      await loadPageDetail(selectedPage.id);
    } catch (e: any) {
      setError(e.message || 'Failed to update component');
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage || !newIncident.name.trim()) return;
    setCreatingIncident(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/status/pages/${selectedPage.id}/incidents`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: newIncident.name.trim(),
            severity: newIncident.severity,
            componentIds: newIncident.componentIds,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create incident');
      }
      setNewIncident({
        name: '',
        severity: newIncident.severity,
        componentIds: [],
      });
      await loadPageDetail(selectedPage.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create incident');
    } finally {
      setCreatingIncident(false);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    if (!selectedPage) return;
    setResolvingIncidentId(incidentId);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/status/pages/${selectedPage.id}/incidents/${incidentId}/resolve`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            resolutionSummary: resolutionSummary.trim() || undefined,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to resolve incident');
      }
      setResolutionSummary('');
      await loadPageDetail(selectedPage.id);
    } catch (e: any) {
      setError(e.message || 'Failed to resolve incident');
    } finally {
      setResolvingIncidentId(null);
    }
  };

  const anyComponents = (selectedPage?.components || []).length > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-72">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">
          MOxE STATUS
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">
          Create status pages for your services, manage components, and communicate incidents.
        </p>

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreatePage}
          className="mb-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 text-xs"
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            New status page
          </div>
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Page name (e.g. Horizon Status)"
            value={newPage.name}
            onChange={(e) =>
              setNewPage((p) => ({ ...p, name: e.target.value }))
            }
          />
          <textarea
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Description (optional)"
            rows={2}
            value={newPage.description}
            onChange={(e) =>
              setNewPage((p) => ({ ...p, description: e.target.value }))
            }
          />
          <select
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            value={newPage.visibility}
            onChange={(e) =>
              setNewPage((p) => ({ ...p, visibility: e.target.value }))
            }
          >
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          <button
            type="submit"
            disabled={creatingPage}
            className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {creatingPage ? 'Creating...' : 'Create status page'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Status pages
          </div>
          <div className="max-h-80 overflow-auto text-xs">
            {pages.length === 0 && (
              <div className="px-3 py-2 text-slate-500">
                No status pages yet. Create one above.
              </div>
            )}
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => loadPageDetail(p.id)}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
                  selectedPage?.id === p.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                  <span className="uppercase">{p.visibility || 'PUBLIC'}</span>
                  <span>
                    {(p._count?.components ?? 0)} components ·{' '}
                    {(p._count?.incidents ?? 0)} incidents
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {loading && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading status pages...
          </div>
        )}

        {!loading && !selectedPage && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Select a status page from the left to manage components and incidents.
          </div>
        )}

        {!loading && selectedPage && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {selectedPage.name}
                  </div>
                  {selectedPage.description && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedPage.description}
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedPage.visibility || 'PUBLIC'}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This page aggregates the health of your services and incidents for your Job account.
              </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Components
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(selectedPage.components || []).length} total
                  </span>
                </div>
                <form
                  onSubmit={handleCreateComponent}
                  className="space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                      placeholder="New component name"
                      value={newComponent.name}
                      onChange={(e) =>
                        setNewComponent((c) => ({
                          ...c,
                          name: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="submit"
                      disabled={creatingComponent}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-[11px] font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {creatingComponent ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  <select
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                    value={newComponent.type}
                    onChange={(e) =>
                      setNewComponent((c) => ({ ...c, type: e.target.value }))
                    }
                  >
                    <option value="API">API</option>
                    <option value="Website">Website</option>
                    <option value="Database">Database</option>
                    <option value="Authentication">Authentication</option>
                    <option value="Payment">Payment</option>
                    <option value="CDN">CDN</option>
                    <option value="Internal Tool">Internal Tool</option>
                  </select>
                </form>

                <div className="max-h-64 overflow-auto space-y-2 text-xs">
                  {!anyComponents && (
                    <div className="text-slate-500 dark:text-slate-400">
                      No components yet. Add your services above.
                    </div>
                  )}
                  {(selectedPage.components || []).map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="font-medium text-slate-800 dark:text-slate-100 truncate">
                          {c.name}
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            c.status === 'OUTAGE'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                              : c.status === 'DEGRADED'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                          }`}
                        >
                          {c.status || 'OPERATIONAL'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {c.type || 'API'}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.description}
                        </div>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>Set status:</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateComponentStatus(c.id, 'OPERATIONAL')
                          }
                          className="px-1.5 py-0.5 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Operational
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateComponentStatus(c.id, 'DEGRADED')
                          }
                          className="px-1.5 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600"
                        >
                          Degraded
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateComponentStatus(c.id, 'OUTAGE')
                          }
                          className="px-1.5 py-0.5 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Outage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    Active incidents
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {incidents.length} open
                  </span>
                </div>

                <form
                  onSubmit={handleCreateIncident}
                  className="space-y-2 text-xs"
                >
                  <input
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                    placeholder="Incident title"
                    value={newIncident.name}
                    onChange={(e) =>
                      setNewIncident((i) => ({ ...i, name: e.target.value }))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                      value={newIncident.severity}
                      onChange={(e) =>
                        setNewIncident((i) => ({
                          ...i,
                          severity: e.target.value,
                        }))
                      }
                    >
                      <option value="MINOR">Minor</option>
                      <option value="MAJOR">Major</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    <select
                      multiple
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px] min-h-[60px]"
                      value={newIncident.componentIds}
                      onChange={(e) =>
                        setNewIncident((i) => ({
                          ...i,
                          componentIds: Array.from(
                            e.target.selectedOptions,
                          ).map((o) => o.value),
                        }))
                      }
                    >
                      {(selectedPage.components || []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={creatingIncident}
                    className="w-full inline-flex items-center justify-center rounded-md bg-red-600 text-white text-xs font-medium py-1.5 hover:bg-red-700 disabled:opacity-50"
                  >
                    {creatingIncident ? 'Creating...' : 'Create incident'}
                  </button>
                </form>

                <div className="max-h-64 overflow-auto space-y-2 text-xs">
                  {incidents.length === 0 && (
                    <div className="text-slate-500 dark:text-slate-400">
                      No active incidents.
                    </div>
                  )}
                  {incidents.map((inc) => (
                    <div
                      key={inc.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="font-medium text-slate-800 dark:text-slate-100">
                          {inc.name}
                        </div>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            inc.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200'
                              : inc.severity === 'MAJOR'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200'
                              : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                        <span className="uppercase">{inc.status}</span>
                        <span>
                          {new Date(inc.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {inc.affectedComponents && inc.affectedComponents.length > 0 && (
                        <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          Affected:{' '}
                          {inc.affectedComponents
                            .map((a) => a.component?.name)
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <textarea
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                          placeholder="Resolution summary (optional)"
                          value={
                            resolvingIncidentId === inc.id
                              ? resolutionSummary
                              : resolutionSummary
                          }
                          onChange={(e) => setResolutionSummary(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => handleResolveIncident(inc.id)}
                          disabled={resolvingIncidentId === inc.id}
                          className="self-start inline-flex items-center px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-medium hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {resolvingIncidentId === inc.id
                            ? 'Resolving...'
                            : 'Mark resolved'}
                        </button>
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

