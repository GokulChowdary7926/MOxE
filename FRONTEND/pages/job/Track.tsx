import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getApiBase, getToken } from '../../services/api';
import { JobPageContent, JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

const API_BASE = getApiBase();

export default function Track() {
  // Mobile routing: keep tab state in sync with /job/track/<tab>
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

  const token = getToken();

  useEffect(() => {
    const p = location.pathname;
    if (p.includes('/job/track/jobs')) setTab('jobs');
    else if (p.includes('/job/track/pipelines')) setTab('pipelines');
    else setTab('applications');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const appliedJobIds = useMemo(() => new Set(applications.map((a) => a.jobPostingId || a.jobPosting?.id).filter(Boolean)), [applications]);
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

  const handleSaveSearch = async () => {
    if (!token || !saveSearchName.trim()) return;
    setSaveSearchSubmitting(true);
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
      setApplyError(e.message || 'Failed to save search.');
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
        const up = await fetch(`${getApiBase()}/upload`, {
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
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#5E6C84] dark:text-[#8C9BAB] text-sm">Loading Track…</div>
      </div>
    );
  }

  const TrackHome = () => (
    <JobPageContent
      title="MOxE Track"
      description="Manage job applications and recruitment pipelines."
      error={error}
    >
      <div className={`${JOB_MOBILE.tab} mb-4`}>
        {(['applications', 'jobs', 'pipelines'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              const next =
                t === 'jobs' ? 'jobs' : t === 'pipelines' ? 'pipelines' : 'applications';
              nav(`/job/track/${next}`, { replace: true });
            }}
            className={`${JOB_MOBILE.tabButton} ${tab === t ? JOB_MOBILE.tabActive : JOB_MOBILE.tabInactive}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'applications' && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className={JOB_MOBILE.meta}>No applications yet.</p>
          ) : (
            applications.map((app) => (
              <JobCard key={app.id}>
                <div className="font-medium text-[#172B4D] dark:text-[#E6EDF3]">
                  {app.jobPosting?.title} at {app.jobPosting?.companyName}
                </div>
                <div className={`text-sm ${JOB_MOBILE.meta} mt-1`}>
                  Status: {app.status} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                </div>
              </JobCard>
            ))
          )}
        </div>
      )}
      {tab === 'jobs' && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="text"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search jobs by title, company, location…"
              className={`flex-1 min-w-0 ${JOB_MOBILE.input}`}
            />
            <button
              type="button"
              onClick={() => setShowSaveSearchModal(true)}
              className={JOB_MOBILE.btnSecondary}
            >
              Save this search
            </button>
          </div>
          {savedSearches.length > 0 && (
            <div className="rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] p-3">
              <p className="text-xs font-medium text-[#5E6C84] dark:text-[#8C9BAB] mb-2">Saved searches</p>
              <ul className="space-y-1">
                {savedSearches.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => loadSavedSearch(s)}
                      className="text-slate-800 dark:text-slate-200 hover:underline truncate"
                    >
                      {s.name}
                      {s.query && ` · "${s.query}"`}
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleSavedSearchAlert(s)}
                        title={s.alertEnabled ? 'Disable job alerts' : 'Enable job alerts'}
                        className={`px-2 py-0.5 rounded text-xs ${s.alertEnabled ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                      >
                        {s.alertEnabled ? 'Alerts on' : 'Alerts off'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedSearch(s.id)}
                        className="text-red-600 dark:text-red-400 hover:underline text-xs"
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
            <p className="text-[#5E6C84] dark:text-[#8C9BAB] text-sm">No job postings match your search.</p>
          ) : (
            filteredJobs.map((job) => {
              const applied = appliedJobIds.has(job.id);
              return (
                <div
                  key={job.id}
                  className="p-4 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] flex justify-between items-start gap-3 shadow-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[#172B4D] dark:text-[#E6EDF3]">{job.title}</div>
                    <div className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
                      {job.companyName || job.company?.name} · {job.location || 'Remote'}
                      {typeof job.applicationCount === 'number' && ` · ${job.applicationCount} applications`}
                    </div>
                  </div>
                  {applied ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">Applied</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setApplyModalJob(job)}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0052CC] dark:bg-[#2684FF] text-white text-sm font-medium hover:opacity-90"
                    >
                      Apply
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#2C333A] p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[#172B4D] dark:text-[#E6EDF3] mb-1">Apply to {applyModalJob.title}</h3>
            <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mb-4">{applyModalJob.companyName || applyModalJob.company?.name}</p>
            <label className="block text-sm font-medium text-[#172B4D] dark:text-[#8C9BAB] mb-1">Cover letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself…"
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#161A1D] text-[#172B4D] dark:text-[#E6EDF3] text-sm mb-3"
            />
            <label className="block text-sm font-medium text-[#172B4D] dark:text-[#8C9BAB] mb-1">Resume (optional)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-[#5E6C84] dark:text-[#8C9BAB] mb-3"
            />
            {applyError && (
              <p className="text-sm text-[#BF2600] dark:text-red-400 mb-2">{applyError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setApplyModalJob(null);
                  setCoverLetter('');
                  setResumeFile(null);
                  setApplyError(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] text-[#5E6C84] dark:text-[#8C9BAB] text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={applySubmitting}
                className="px-3 py-1.5 rounded-lg bg-[#0052CC] dark:bg-[#2684FF] text-white text-sm font-medium disabled:opacity-50"
              >
                {applySubmitting ? 'Submitting…' : 'Submit application'}
              </button>
            </div>
          </div>
        </div>
      )}
      {tab === 'pipelines' && (
        <div className="space-y-3">
          {pipelines.length === 0 ? (
            <p className="text-[#5E6C84] dark:text-[#8C9BAB] text-sm">No pipelines yet.</p>
          ) : (
            pipelines.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] shadow-sm"
              >
                <div className="font-medium text-[#172B4D] dark:text-[#E6EDF3]">{p.name}</div>
                <div className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
                  {p.stages?.length || 0} stages
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {showSaveSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#2C333A] p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[#172B4D] dark:text-[#E6EDF3] mb-3">Save job search</h3>
            <p className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mb-2">
              Current query: {jobSearch.trim() || '(none)'}
            </p>
            <input
              type="text"
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              placeholder="e.g. Frontend in NYC"
              className="w-full px-3 py-2 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#161A1D] text-[#172B4D] dark:text-[#E6EDF3] text-sm mb-3"
            />
            <label className="flex items-center gap-2 text-sm text-[#172B4D] dark:text-[#8C9BAB] mb-4">
              <input
                type="checkbox"
                checked={saveSearchAlert}
                onChange={(e) => setSaveSearchAlert(e.target.checked)}
              />
              Email me when new jobs match
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowSaveSearchModal(false); setSaveSearchName(''); setSaveSearchAlert(false); }}
                className="px-3 py-1.5 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] text-[#5E6C84] dark:text-[#8C9BAB] text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                disabled={saveSearchSubmitting || !saveSearchName.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#0052CC] dark:bg-[#2684FF] text-white text-sm font-medium disabled:opacity-50"
              >
                {saveSearchSubmitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </JobPageContent>
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
