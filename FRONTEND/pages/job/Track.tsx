import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export default function Track() {
  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [tab, setTab] = useState<'applications' | 'jobs' | 'pipelines'>('applications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem('token');

  const fetchApplications = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/job/track/applications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setApplications(data);
    }
  };

  const fetchJobs = async () => {
    const res = await fetch(`${API_BASE}/job/track/jobs`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      setJobs(data);
    }
  };

  const fetchPipelines = async () => {
    if (!token) return;
    const res = await fetch(`${API_BASE}/job/track/pipelines`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPipelines(data);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchApplications(), fetchJobs(), fetchPipelines()])
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Track...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">MOxE Track</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Manage job applications and recruitment pipelines.
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      <div className="flex gap-2 mb-6">
        {(['applications', 'jobs', 'pipelines'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium ${
              tab === t
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'applications' && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <p className="text-slate-500">No applications yet.</p>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="font-medium text-slate-800 dark:text-white">
                  {app.jobPosting?.title} at {app.jobPosting?.companyName}
                </div>
                <div className="text-sm text-slate-500 mt-1">
                  Status: {app.status} · Applied {new Date(app.appliedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {tab === 'jobs' && (
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <p className="text-slate-500">No job postings.</p>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="font-medium text-slate-800 dark:text-white">{job.title}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {job.companyName} · {job.location || 'Remote'} · {job.applicationCount} applications
                </div>
              </div>
            ))
          )}
        </div>
      )}
      {tab === 'pipelines' && (
        <div className="space-y-3">
          {pipelines.length === 0 ? (
            <p className="text-slate-500">No pipelines yet.</p>
          ) : (
            pipelines.map((p) => (
              <div
                key={p.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <div className="font-medium text-slate-800 dark:text-white">{p.name}</div>
                <div className="text-sm text-slate-500 mt-1">
                  {p.stages?.length || 0} stages
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
