import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

const API_BASE = getApiBase();

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
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/compass/services`, {
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
        headers: authHeaders,
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
      <JobPageContent variant="track">
        <JobToolBibleShell toolTitle="MOxE COMPASS" toolIconMaterial="explore">
          <div className="flex items-center justify-center py-12">
            <div className="h-16 w-full max-w-xs animate-pulse rounded-xl bg-surface-container-high" />
          </div>
        </JobToolBibleShell>
      </JobPageContent>
    );
  }

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE COMPASS" toolIconMaterial="explore">
    <div>
      {!selectedService && (
        <>
          <form onSubmit={handleCreateService} className={`mb-6 ${JOB_MOBILE.formPanel}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface">Register new service</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={JOB_MOBILE.formLabel}>Name</label>
                <input
                  type="text"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className={JOB_MOBILE.formInput}
                  placeholder="Authentication Service"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Environment</label>
                <input
                  type="text"
                  value={serviceForm.environment}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, environment: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="production, staging…"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Description</label>
                <textarea
                  value={serviceForm.descriptionMd}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, descriptionMd: e.target.value }))
                  }
                  rows={3}
                  className={JOB_MOBILE.formTextarea}
                  placeholder="Short markdown description of what this service does."
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>API base URL</label>
                <input
                  type="url"
                  value={serviceForm.apiBaseUrl}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, apiBaseUrl: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="https://api.example.com"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Health check URL</label>
                <input
                  type="url"
                  value={serviceForm.healthCheckUrl}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, healthCheckUrl: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="https://status.example.com/health"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Documentation link</label>
                <input
                  type="url"
                  value={serviceForm.docLink}
                  onChange={(e) =>
                    setServiceForm((prev) => ({ ...prev, docLink: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="https://docs.example.com/service"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={serviceForm.tags}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className={JOB_MOBILE.formInput}
                  placeholder="api, auth, critical"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Notes</label>
                <textarea
                  value={serviceForm.notes}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className={JOB_MOBILE.formTextarea}
                  placeholder="Any extra notes about this service, owners, SLAs, etc."
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={creatingService}
                className="px-4 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-sm font-medium text-white disabled:opacity-60 min-h-[44px]"
              >
                {creatingService ? 'Registering…' : 'Register service'}
              </button>
            </div>
          </form>

          {services.length === 0 ? (
            <p className={JOB_MOBILE.formMuted}>
              No services registered yet. Use the form above to add your first service to Compass.
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => openService(svc)}
                  className={`w-full text-left p-4 ${JOB_MOBILE.trackCard} hover:border-primary/45 transition-colors`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-on-surface">{svc.name}</div>
                      <div className="text-xs text-on-surface-variant mt-1">
                        {svc.environment || 'production'} ·{' '}
                        {svc.apiBaseUrl ? svc.apiBaseUrl : 'No API URL configured'}
                      </div>
                      {svc.tags && svc.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {svc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex px-1.5 py-0.5 rounded-lg bg-surface-container-high text-[10px] text-on-surface-variant"
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
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : svc.status === 'DEGRADED'
                              ? 'bg-amber-500/15 text-amber-200'
                              : svc.status === 'DOWN'
                              ? 'bg-red-500/15 text-red-300'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {svc.status.toLowerCase()}
                        </span>
                      )}
                      {svc._count && (
                        <div className="text-[11px] text-on-surface-variant">
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
            className="text-sm text-[#2684FF] font-medium mb-3 min-h-[44px] text-left"
          >
            ← Back to services
          </button>

          <h3 className="text-lg font-semibold text-on-surface">{selectedService.service.name}</h3>
          <p className="text-xs text-on-surface-variant mb-2">
            {selectedService.service.environment || 'production'} ·{' '}
            {selectedService.service.apiBaseUrl || 'No API URL configured'}
          </p>

          {selectedService.service.descriptionMd && (
            <p className="text-sm text-on-surface-variant mb-3 whitespace-pre-line">
              {selectedService.service.descriptionMd}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className={`${JOB_MOBILE.formPanel} space-y-2`}>
              <p className="text-xs font-semibold text-on-surface mb-1">Uptime</p>
              <dl className="text-xs text-on-surface-variant space-y-0.5">
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
            <div className={`${JOB_MOBILE.formPanel} space-y-2`}>
              <p className="text-xs font-semibold text-on-surface mb-1">Dependencies</p>
              {services.length <= 1 ? (
                <p className="text-[11px] text-on-surface-variant">
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
                    className={`${JOB_MOBILE.formSelect} h-24 text-xs min-h-0`}
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
                    className="mt-1 px-3 py-2 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-[11px] font-medium text-white disabled:opacity-60 min-h-[40px]"
                  >
                    {savingDependencies ? 'Saving…' : 'Save dependencies'}
                  </button>
                  {selectedService.service.dependencies?.length ? (
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      Currently depends on:{' '}
                      {selectedService.service.dependencies
                        .map((d) => d.dependsOn.name)
                        .join(', ')}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-on-surface-variant">
                      No dependencies configured.
                    </p>
                  )}
                </form>
              )}
            </div>
            <div className={`${JOB_MOBILE.formPanel} space-y-2`}>
              <p className="text-xs font-semibold text-on-surface mb-1">Recent health checks</p>
              {selectedService.recentChecks.length === 0 ? (
                <p className="text-[11px] text-on-surface-variant">
                  No health checks recorded yet.
                </p>
              ) : (
                <ul className="space-y-0.5 max-h-28 overflow-y-auto text-[11px] text-on-surface-variant">
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
                            ? 'text-emerald-300'
                            : check.status === 'DEGRADED'
                            ? 'text-amber-200'
                            : 'text-red-300'
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

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className={`${JOB_MOBILE.formPanel} space-y-2`}>
              <p className="text-xs font-semibold text-on-surface mb-2">Documentation links</p>
              {selectedService.service.docs && selectedService.service.docs.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {selectedService.service.docs.map((doc) => (
                    <li key={doc.id} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-on-surface">{doc.title}</p>
                        <p className="text-[11px] text-on-surface-variant">Type: {doc.docType}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-on-surface-variant mb-2">
                  No documentation linked yet.
                </p>
              )}
              <form onSubmit={handleAddDoc} className="mt-3 space-y-2">
                <input
                  type="text"
                  value={docForm.pageId}
                  onChange={(e) => setDocForm((prev) => ({ ...prev, pageId: e.target.value }))}
                  placeholder="Knowledge page ID"
                  className={`${JOB_MOBILE.formInput} text-xs min-h-[40px]`}
                />
                <input
                  type="text"
                  value={docForm.docType}
                  onChange={(e) =>
                    setDocForm((prev) => ({ ...prev, docType: e.target.value.toUpperCase() }))
                  }
                  placeholder="Doc type (e.g. RUNBOOK, SPEC)"
                  className={`${JOB_MOBILE.formInput} text-xs min-h-[40px]`}
                />
                <button
                  type="submit"
                  disabled={addingDocFor}
                  className="mt-1 px-3 py-2 rounded-xl bg-[#0052CC] hover:bg-[#0747A6] text-[11px] font-medium text-white disabled:opacity-60 min-h-[40px]"
                >
                  {addingDocFor ? 'Linking…' : 'Add documentation link'}
                </button>
              </form>
            </div>
            <div className={`${JOB_MOBILE.formPanel} space-y-2`}>
              <p className="text-xs font-semibold text-on-surface mb-2">Dependents</p>
              {selectedService.service.dependents && selectedService.service.dependents.length > 0 ? (
                <ul className="space-y-1 text-xs text-on-surface">
                  {selectedService.service.dependents.map((dep) => (
                    <li key={dep.id}>
                      {dep.service.name}{' '}
                      <span className="text-[11px] text-on-surface-variant">({dep.service.slug})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-on-surface-variant">
                  No other services currently depend on this one.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <JobBibleReferenceSection toolKey="compass" />
    </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}

