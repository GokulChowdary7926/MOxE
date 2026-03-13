import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type CompassOwner = {
  account: {
    id: string;
    displayName: string | null;
    username: string | null;
  } | null;
  role: 'PRIMARY' | 'SECONDARY';
};

type CompassServiceListItem = {
  id: string;
  name: string;
  slug: string;
  descriptionMd?: string | null;
  apiBaseUrl?: string | null;
  healthCheckUrl?: string | null;
  environment?: string | null;
  status?: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN' | null;
  tags?: string[] | null;
  _count?: {
    dependencies: number;
    dependents: number;
    healthChecks: number;
  };
  owners?: CompassOwner[];
};

type CompassServiceDetail = {
  service: CompassServiceListItem & {
    notes?: string | null;
    docs?: {
      id: string;
      docType: string;
      title: string;
      page?: {
        id: string;
        title: string;
        slug?: string | null;
        spaceId?: string | null;
        updatedAt: string;
      } | null;
    }[];
    dependencies: {
      id: string;
      dependsOnId: string;
      dependsOn: { id: string; name: string; slug: string };
    }[];
    dependents: {
      id: string;
      serviceId: string;
      service: { id: string; name: string; slug: string };
    }[];
  };
  recentChecks: {
    id: string;
    status: 'PASS' | 'DEGRADED' | 'FAIL' | 'TIMEOUT' | 'INVALID';
    httpStatus: number | null;
    latencyMs: number | null;
    checkedAt: string;
    error?: string | null;
  }[];
  uptime: {
    last24h: number | null;
    last7d: number | null;
    last30d: number | null;
    ytd: number | null;
  };
};

type ServiceFormState = {
  name: string;
  descriptionMd: string;
  docLink: string;
  apiBaseUrl: string;
  healthCheckUrl: string;
  environment: string;
  tags: string;
  notes: string;
};

type DocFormState = {
  pageId: string;
  docType: string;
};

export default function Compass() {
  const [services, setServices] = useState<CompassServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<CompassServiceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [creatingService, setCreatingService] = useState(false);
  const [savingDependencies, setSavingDependencies] = useState(false);
  const [addingDocFor, setAddingDocFor] = useState(false);

  const [serviceForm, setServiceForm] = useState<ServiceFormState>({
    name: '',
    descriptionMd: '',
    docLink: '',
    apiBaseUrl: '',
    healthCheckUrl: '',
    environment: 'production',
    tags: '',
    notes: '',
  });

  const [docForm, setDocForm] = useState<DocFormState>({
    pageId: '',
    docType: 'OTHER',
  });

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compass/services`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load services');
      }
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const fetchServiceDetail = async (serviceId: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compass/services/${serviceId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load service detail');
      }
      const data = (await res.json()) as CompassServiceDetail;
      setSelectedService(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load service detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create services');
      return;
    }
    if (!serviceForm.name.trim()) return;
    setCreatingService(true);
    setError(null);
    try {
      const payload: any = {
        name: serviceForm.name.trim(),
      };
      if (serviceForm.descriptionMd.trim()) payload.descriptionMd = serviceForm.descriptionMd.trim();
      if (serviceForm.docLink.trim()) payload.docLink = serviceForm.docLink.trim();
      if (serviceForm.apiBaseUrl.trim()) payload.apiBaseUrl = serviceForm.apiBaseUrl.trim();
      if (serviceForm.healthCheckUrl.trim()) payload.healthCheckUrl = serviceForm.healthCheckUrl.trim();
      if (serviceForm.environment.trim()) payload.environment = serviceForm.environment.trim();
      if (serviceForm.tags.trim()) {
        payload.tags = serviceForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
      if (serviceForm.notes.trim()) payload.notes = serviceForm.notes.trim();

      const res = await fetch(`${API_BASE}/compass/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create service');
      }
      const created = (await res.json()) as CompassServiceListItem;
      setServices((prev) => [created, ...prev]);
      setServiceForm({
        name: '',
        descriptionMd: '',
        docLink: '',
        apiBaseUrl: '',
        healthCheckUrl: '',
        environment: 'production',
        tags: '',
        notes: '',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to create service');
    } finally {
      setCreatingService(false);
    }
  };

  const openService = (svc: CompassServiceListItem) => {
    fetchServiceDetail(svc.id);
  };

  const handleDependenciesSave = async (serviceId: string, dependencyIds: string[]) => {
    if (!token) return;
    setSavingDependencies(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compass/services/${serviceId}/dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ dependencyIds }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update dependencies');
      }
      await fetchServiceDetail(serviceId);
    } catch (e: any) {
      setError(e?.message || 'Failed to update dependencies');
    } finally {
      setSavingDependencies(false);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedService || !docForm.pageId.trim()) return;
    setAddingDocFor(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compass/services/${selectedService.service.id}/docs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          pageId: docForm.pageId.trim(),
          docType: (docForm.docType || 'OTHER').toUpperCase(),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to add documentation link');
      }
      await fetchServiceDetail(selectedService.service.id);
      setDocForm({ pageId: '', docType: 'OTHER' });
    } catch (e: any) {
      setError(e?.message || 'Failed to add documentation link');
    } finally {
      setAddingDocFor(false);
    }
  };

  const formatUptime = (value: number | null | undefined) => {
    if (value == null || Number.isNaN(value)) return '–';
    return `${value.toFixed(2)}%`;
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Compass…</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">MOxE Compass</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        Register internal services, track ownership, and monitor health across your Job account.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!selectedService && (
        <>
          <form
            onSubmit={handleCreateService}
            className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Register new service
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Authentication Service"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Environment
                </label>
                <input
                  type="text"
                  value={serviceForm.environment}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, environment: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="production, staging…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={serviceForm.descriptionMd}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, descriptionMd: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Short markdown description of what this service does."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  API base URL
                </label>
                <input
                  type="url"
                  value={serviceForm.apiBaseUrl}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, apiBaseUrl: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Health check URL
                </label>
                <input
                  type="url"
                  value={serviceForm.healthCheckUrl}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, healthCheckUrl: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="https://status.example.com/health"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Documentation link
                </label>
                <input
                  type="url"
                  value={serviceForm.docLink}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, docLink: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="https://docs.example.com/service"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={serviceForm.tags}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="api, auth, critical"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Notes
                </label>
                <textarea
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Any extra notes about this service, owners, SLAs, etc."
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={creatingService}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {creatingService ? 'Registering…' : 'Register service'}
              </button>
            </div>
          </form>

          {services.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No services registered yet. Use the form above to add your first service to Compass.
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => openService(svc)}
                  className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-50">
                        {svc.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {svc.environment || 'production'} ·{' '}
                        {svc.apiBaseUrl ? svc.apiBaseUrl : 'No API URL configured'}
                      </div>
                      {svc.tags && svc.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {svc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      {svc.status && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            svc.status === 'OPERATIONAL'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : svc.status === 'DEGRADED'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : svc.status === 'DOWN'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {svc.status.toLowerCase()}
                        </span>
                      )}
                      {svc._count && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {svc._count.dependencies} deps · {svc._count.dependents} dependents
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedService && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setSelectedService(null)}
            className="text-sm text-indigo-600 dark:text-indigo-400 mb-3"
          >
            ← Back to services
          </button>

          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50">
            {selectedService.service.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {selectedService.service.environment || 'production'} ·{' '}
            {selectedService.service.apiBaseUrl || 'No API URL configured'}
          </p>

          {selectedService.service.descriptionMd && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 whitespace-pre-line">
              {selectedService.service.descriptionMd}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Uptime
              </p>
              <dl className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                <div className="flex justify-between">
                  <dt>Last 24h</dt>
                  <dd className="font-medium">{formatUptime(selectedService.uptime.last24h)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last 7d</dt>
                  <dd className="font-medium">{formatUptime(selectedService.uptime.last7d)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Last 30d</dt>
                  <dd className="font-medium">{formatUptime(selectedService.uptime.last30d)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>YTD</dt>
                  <dd className="font-medium">{formatUptime(selectedService.uptime.ytd)}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Dependencies
              </p>
              {services.length <= 1 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Add more services to Compass to configure dependencies.
                </p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const depIds = Array.from(formData.getAll('dependencyIds')) as string[];
                    handleDependenciesSave(selectedService.service.id, depIds);
                  }}
                  className="space-y-1"
                >
                  <select
                    name="dependencyIds"
                    multiple
                    defaultValue={selectedService.service.dependencies?.map((d) => d.dependsOnId) || []}
                    className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50 h-24"
                  >
                    {services
                      .filter((s) => s.id !== selectedService.service.id)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={savingDependencies}
                    className="mt-1 px-3 py-1 rounded-md bg-indigo-600 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {savingDependencies ? 'Saving…' : 'Save dependencies'}
                  </button>
                  {selectedService.service.dependencies?.length ? (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Currently depends on:{' '}
                      {selectedService.service.dependencies
                        .map((d) => d.dependsOn.name)
                        .join(', ')}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      No dependencies configured.
                    </p>
                  )}
                </form>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Recent health checks
              </p>
              {selectedService.recentChecks.length === 0 ? (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No health checks recorded yet.
                </p>
              ) : (
                <ul className="space-y-0.5 max-h-28 overflow-y-auto text-[11px] text-slate-600 dark:text-slate-300">
                  {selectedService.recentChecks.slice(0, 8).map((check) => (
                    <li key={check.id} className="flex justify-between gap-2">
                      <span>
                        {new Date(check.checkedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span
                        className={
                          check.status === 'PASS'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : check.status === 'DEGRADED'
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-red-600 dark:text-red-300'
                        }
                      >
                        {check.status.toLowerCase()}{' '}
                        {check.latencyMs != null ? `· ${check.latencyMs}ms` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Documentation links
              </p>
              {selectedService.service.docs && selectedService.service.docs.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {selectedService.service.docs.map((doc) => (
                    <li key={doc.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {doc.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Type: {doc.docType}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  No documentation linked yet.
                </p>
              )}
              <form onSubmit={handleAddDoc} className="mt-3 space-y-1">
                <input
                  type="text"
                  value={docForm.pageId}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, pageId: e.target.value }))}
                  placeholder="Knowledge page ID"
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50"
                />
                <input
                  type="text"
                  value={docForm.docType}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, docType: e.target.value.toUpperCase() }))
                  }
                  placeholder="Doc type (e.g. RUNBOOK, SPEC)"
                  className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50"
                />
                <button
                  type="submit"
                  disabled={addingDocFor}
                  className="mt-1 px-3 py-1 rounded-md bg-indigo-600 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {addingDocFor ? 'Linking…' : 'Add documentation link'}
                </button>
              </form>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Dependents
              </p>
              {selectedService.service.dependents && selectedService.service.dependents.length > 0 ? (
                <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-200">
                  {selectedService.service.dependents.map((dep) => (
                    <li key={dep.id}>
                      {dep.service.name}{' '}
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ({dep.service.slug})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  No other services currently depend on this one.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

