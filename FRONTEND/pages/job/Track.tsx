import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getApiBase, getToken, getUploadUrl } from '../../services/api';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';

const API_BASE = getApiBase();

const APP_STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const;

const KANBAN_COLUMNS: { id: string; title: string; match: (s: string) => boolean }[] = [
  { id: 'applied', title: 'Applied', match: (s) => s === 'APPLIED' },
  { id: 'screening', title: 'Screening', match: (s) => s === 'SCREENING' },
  { id: 'interview', title: 'Interview', match: (s) => s === 'INTERVIEW' || s === 'INTERVIEWING' },
  {
    id: 'outcome',
    title: 'Outcome',
    match: (s) => s === 'OFFER' || s === 'REJECTED' || s === 'WITHDRAWN',
  },
];

function normalizeStatus(raw: string | undefined | null): string {
  return String(raw || 'APPLIED').toUpperCase();
}

function columnIdForStatus(status: string): string {
  const u = normalizeStatus(status);
  const col = KANBAN_COLUMNS.find((c) => c.match(u));
  return col?.id ?? 'applied';
}

function formatAppliedDate(iso: string | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

export default function Track() {
  const location = useLocation();
  const nav = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [tab, setTab] = useState<'applications' | 'jobs' | 'pipelines'>('applications');
  const [jobSearch, setJobSearch] = useState('');
  const [applyModalJob, setApplyModalJob] = useState<any | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [showSaveSearchModal, setShowSaveSearchModal] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState('');
  const [saveSearchAlert, setSaveSearchAlert] = useState(false);
  const [saveSearchSubmitting, setSaveSearchSubmitting] = useState(false);
  const [saveSearchError, setSaveSearchError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const token = getToken();

  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/job/track/jobs')) setTab('jobs');
    else if (p.includes('/job/track/pipelines')) setTab('pipelines');
    else setTab('applications');
  }, [location.pathname]);

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => a.jobPostingId || a.jobPosting?.id).filter(Boolean)),
    [applications],
  );

  const filteredJobs = useMemo(() => {
    if (!jobSearch.trim()) return jobs;
    const q = jobSearch.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (j.title || '').toLowerCase().includes(q) ||
        (j.companyName || j.company?.name || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q),
    );
  }, [jobs, jobSearch]);

  const groupedApplications = useMemo(() => {
    const map: Record<string, any[]> = { applied: [], screening: [], interview: [], outcome: [] };
    for (const app of applications) {
      const cid = columnIdForStatus(app.status);
      if (!map[cid]) map[cid] = [];
      map[cid].push(app);
    }
    return map;
  }, [applications]);

  const fetchApplications = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/job/track/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    }
  };

  const fetchJobs = async () => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/job/track/jobs`, { headers });
    if (res.ok) {
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    }
  };

  const fetchPipelines = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/job/track/pipelines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPipelines(Array.isArray(data) ? data : []);
    }
  };

  const fetchSavedSearches = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/job/track/saved-searches`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setSavedSearches(Array.isArray(data) ? data : []);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    if (!token) return;
    setStatusUpdatingId(applicationId);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Could not update status.');
      await fetchApplications();
    } catch (e: any) {
      setError(e.message || 'Could not update status.');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSaveSearch = async () => {
    if (!token || !saveSearchName.trim()) return;
    setSaveSearchSubmitting(true);
    setSaveSearchError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/saved-searches`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: saveSearchName.trim(),
          query: jobSearch.trim() || undefined,
          alertEnabled: saveSearchAlert,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save search.');
      setShowSaveSearchModal(false);
      setSaveSearchName('');
      setSaveSearchAlert(false);
      await fetchSavedSearches();
    } catch (e: any) {
      setSaveSearchError(e.message || 'Failed to save search.');
    } finally {
      setSaveSearchSubmitting(false);
    }
  };

  const loadSavedSearch = (s: any) => {
    if (s.query) setJobSearch(s.query);
  };

  const toggleSavedSearchAlert = async (s: any) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/job/track/saved-searches/${s.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ alertEnabled: !s.alertEnabled }),
      });
      await fetchSavedSearches();
    } catch (_) {}
  };

  const deleteSavedSearch = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/job/track/saved-searches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSavedSearches();
    } catch (_) {}
  };

  const handleApply = async () => {
    if (!applyModalJob || !token) return;
    setApplySubmitting(true);
    setApplyError(null);
    try {
      let resumeUrl: string | undefined;
      if (resumeFile) {
        const form = new FormData();
        form.append('file', resumeFile);
        const up = await fetch(getUploadUrl(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok || !upData.url) throw new Error(upData.error || 'Resume upload failed.');
        resumeUrl = upData.url;
      }
      const res = await fetch(`${API_BASE}/job/track/apply/${applyModalJob.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coverLetter: coverLetter.trim() || undefined, resumeUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Apply failed.');
      setApplyModalJob(null);
      setCoverLetter('');
      setResumeFile(null);
      await fetchApplications();
      await fetchJobs();
    } catch (e: any) {
      setApplyError(e.message || 'Failed to apply.');
    } finally {
      setApplySubmitting(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchApplications(), fetchJobs(), fetchPipelines(), fetchSavedSearches()])
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <p className="font-body text-sm text-on-surface-variant">Loading Track…</p>
      </div>
    );
  }

  const tabBtn = (id: 'applications' | 'jobs' | 'pipelines', label: string) => {
    const active = tab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          const path = id === 'jobs' ? 'jobs' : id === 'pipelines' ? 'pipelines' : 'applications';
          nav(`/job/track/${path}`, { replace: true });
        }}
        className={[
          'min-h-[44px] flex-1 rounded-xl px-3 py-2 text-center text-[11px] font-bold uppercase tracking-widest transition-colors',
          active
            ? 'bg-gradient-to-r from-primary to-on-primary-container text-on-primary shadow-lg'
            : 'bg-surface-container-high/80 text-on-surface-variant hover:bg-surface-bright/60',
        ].join(' ')}
      >
        {label}
      </button>
    );
  };

  const TrackHome = () => (
    <JobToolBibleShell toolTitle="MOxE TRACK" toolIconMaterial="analytics">
    <div className="min-w-0 max-w-full pb-4 font-body text-on-background">
      {error ? (
        <div
          className="mb-4 rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <div className="relative mb-6 overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container p-5 border-l-4 border-l-primary">
        <div className="relative z-10">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">MOxE Track</p>
          <h1 className="mb-2 font-headline text-2xl font-black tracking-tighter text-on-surface">
            Application workspace
          </h1>
          <p className="max-w-full text-sm leading-relaxed text-on-surface-variant">
            Your applications on a live board, open roles, and hiring pipelines—wired to your workspace API.
          </p>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-primary/10 to-transparent" />
      </div>

      <div className="mb-6 flex gap-2 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-1.5">
        {tabBtn('applications', 'Board')}
        {tabBtn('jobs', 'Jobs')}
        {tabBtn('pipelines', 'Pipelines')}
      </div>

      {tab === 'applications' && (
        <div className="-mx-4 border-y border-outline-variant/10 bg-surface-container-low/30 py-2">
          <div className="overflow-x-auto px-4 pb-2 no-scrollbar">
            <div className="flex min-h-[400px] w-max gap-3">
            {KANBAN_COLUMNS.map((col) => {
              const items = groupedApplications[col.id] || [];
              return (
                <section
                  key={col.id}
                  className="kanban-column flex w-[232px] shrink-0 flex-col"
                  aria-label={col.title}
                >
                  <div className="mb-4 flex items-center justify-between px-1">
                    <h2 className="text-sm font-bold uppercase tracking-tight text-on-surface">
                      {col.title}{' '}
                      <span className="ml-1 font-medium text-on-surface-variant">{items.length}</span>
                    </h2>
                    <span className="material-symbols-outlined cursor-default text-outline text-lg">more_horiz</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3">
                    {items.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-outline-variant/25 px-3 py-6 text-center text-[11px] text-on-surface-variant">
                        No applications in this column.
                      </p>
                    ) : (
                      items.map((app) => {
                        const title = app.jobPosting?.title || 'Role';
                        const company = app.jobPosting?.companyName || app.jobPosting?.company?.name || 'Company';
                        const st = normalizeStatus(app.status);
                        return (
                          <article
                            key={app.id}
                            className="group rounded-lg border-l-2 border-transparent bg-surface-container-lowest p-4 shadow-sm transition-all duration-200 hover:border-primary hover:bg-surface-bright"
                          >
                            <div className="mb-2 flex flex-wrap gap-2">
                              <span className="rounded bg-surface-container-low px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                                {st}
                              </span>
                            </div>
                            <h3 className="mb-3 text-base font-bold leading-snug text-on-surface">
                              {title}
                              <span className="block text-[13px] font-medium text-on-surface-variant">@{company}</span>
                            </h3>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-on-surface-variant">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                <span className="text-[11px] font-medium">
                                  {formatAppliedDate(app.appliedAt)}
                                </span>
                              </div>
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-surface-container-high bg-surface-container text-[10px] font-bold text-tertiary">
                                {(title[0] || '?').toUpperCase()}
                              </div>
                            </div>
                            <label className="sr-only" htmlFor={`app-status-${app.id}`}>
                              Move application
                            </label>
                            <select
                              id={`app-status-${app.id}`}
                              className="mt-3 w-full cursor-pointer rounded-lg border border-outline-variant/30 bg-surface-container-high py-2 pl-2 pr-8 text-[11px] font-semibold uppercase tracking-tight text-on-surface"
                              value={st}
                              disabled={statusUpdatingId === app.id}
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                            >
                              {APP_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </article>
                        );
                      })
                    )}
                    <button
                      type="button"
                      onClick={() => nav('/job/track/jobs')}
                      className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold text-primary transition-colors hover:bg-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                      Browse roles
                    </button>
                  </div>
                </section>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {tab === 'jobs' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">
                search
              </span>
              <input
                type="search"
                value={jobSearch}
                onChange={(e) => setJobSearch(e.target.value)}
                placeholder="Search by title, company, location…"
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low py-3 pl-11 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/70"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSaveSearchModal(true);
                setSaveSearchError(null);
              }}
              className="min-h-[44px] shrink-0 rounded-xl border border-outline-variant/25 bg-surface-container-high px-4 text-[11px] font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-bright"
            >
              Save search
            </button>
          </div>

          {savedSearches.length > 0 && (
            <div className="rounded-xl border border-outline-variant/15 bg-surface-container p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Saved searches
              </p>
              <ul className="space-y-2">
                {savedSearches.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => loadSavedSearch(s)}
                      className="min-w-0 truncate text-left font-medium text-on-surface hover:underline"
                    >
                      {s.name}
                      {s.query ? ` · “${s.query}”` : ''}
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleSavedSearchAlert(s)}
                        title={s.alertEnabled ? 'Disable alerts' : 'Enable alerts'}
                        className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                          s.alertEnabled
                            ? 'bg-tertiary-container text-tertiary'
                            : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {s.alertEnabled ? 'Alerts on' : 'Alerts off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedSearch(s.id)}
                        className="text-[11px] font-semibold text-error hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {filteredJobs.length === 0 ? (
            <p className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
              No job postings match your search.
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredJobs.map((job) => {
                const applied = appliedJobIds.has(job.id);
                return (
                  <li
                    key={job.id}
                    className="monolith-card flex items-start justify-between gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-headline text-base font-bold text-on-surface">{job.title}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {job.companyName || job.company?.name} · {job.location || 'Remote'}
                        {typeof job.applicationCount === 'number' ? ` · ${job.applicationCount} applicants` : ''}
                      </p>
                    </div>
                    {applied ? (
                      <span className="shrink-0 rounded-full bg-tertiary-container px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight text-tertiary">
                        Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setApplyModalJob(job);
                          setApplyError(null);
                        }}
                        className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-on-primary-container px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-on-primary transition-transform active:scale-[0.98]"
                      >
                        Apply
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {tab === 'pipelines' && (
        <div className="space-y-3">
          {pipelines.length === 0 ? (
            <p className="rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 py-8 text-center text-sm text-on-surface-variant">
              No pipelines yet.
            </p>
          ) : (
            pipelines.map((p) => (
              <div
                key={p.id}
                className="monolith-card rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-5 border-l-4 border-l-secondary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-headline text-lg font-bold text-on-surface">{p.name}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {p.stages?.length || 0} stages · hiring workflow
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-secondary">account_tree</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {applyModalJob && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0">
          <div
            className="max-h-[90dvh] w-full max-w-[428px] overflow-y-auto rounded-t-2xl border border-outline-variant/20 bg-surface-container p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
          >
            <h3 id="apply-modal-title" className="font-headline text-lg font-bold text-on-surface">
              Apply · {applyModalJob.title}
            </h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {applyModalJob.companyName || applyModalJob.company?.name}
            </p>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Cover letter (optional)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself…"
              rows={4}
              className="mt-2 w-full rounded-xl border border-outline-variant/25 bg-surface-container-low px-3 py-2 text-sm text-on-surface"
            />
            <label className="mt-3 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Resume (optional)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="mt-2 w-full text-sm text-on-surface-variant"
            />
            {applyError ? <p className="mt-3 text-sm text-error">{applyError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setApplyModalJob(null);
                  setCoverLetter('');
                  setResumeFile(null);
                  setApplyError(null);
                }}
                className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applySubmitting}
                className="rounded-xl bg-gradient-to-r from-primary to-on-primary-container px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
              >
                {applySubmitting ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveSearchModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0">
          <div
            className="w-full max-w-[428px] rounded-t-2xl border border-outline-variant/20 bg-surface-container p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="font-headline text-lg font-bold text-on-surface">Save job search</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Current query: {jobSearch.trim() || '(none)'}
            </p>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="e.g. Frontend in NYC"
              className="mt-3 w-full rounded-xl border border-outline-variant/25 bg-surface-container-low px-3 py-2 text-sm text-on-surface"
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={saveSearchAlert}
                onChange={(e) => setSaveSearchAlert(e.target.checked)}
              />
              Alert when new jobs match
            </label>
            {saveSearchError ? <p className="mt-3 text-sm text-error">{saveSearchError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSaveSearchModal(false);
                  setSaveSearchName('');
                  setSaveSearchAlert(false);
                  setSaveSearchError(null);
                }}
                className="rounded-xl border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={saveSearchSubmitting || !saveSearchName.trim()}
                className="rounded-xl bg-gradient-to-r from-primary to-on-primary-container px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
              >
                {saveSearchSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      <JobBibleReferenceSection toolKey="track" />
    </div>
    </JobToolBibleShell>
  );

  return (
    <Routes>
      <Route index element={<Navigate to="applications" replace />} />
      <Route path="applications" element={<TrackHome />} />
      <Route path="jobs" element={<TrackHome />} />
      <Route path="pipelines" element={<TrackHome />} />
      <Route path="*" element={<Navigate to="applications" replace />} />
    </Routes>
  );
}
