import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type JobAnalyticsPayload = {
  metrics: {
    totalApplications: number;
    applicationsInRange: number;
    applicationsChange: number;
    trackProjects: number;
    flowCards: number;
  };
  range: {
    days: number;
    since: string;
  };
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function JobAnalytics() {
  const [payload, setPayload] = useState<JobAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  const headers = useAuthHeaders();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }

    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/job/analytics/insights?range=${range}`, {
      headers,
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load job analytics');
        return r.json();
      })
      .then((data) => {
        setPayload(data);
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to load job analytics');
        setPayload(null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const changeStr = (n: number) => {
    if (n === 0) return 'No change';
    return n > 0 ? `+${n}% vs previous` : `${n}% vs previous`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
          MOxE ANALYTICS (Job)
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          High‑level insights for your Job workspace: applications and work activity.
        </p>
      </div>

      <div className="flex gap-2 mb-2">
        {(['7d', '30d'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              range === r
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
          </button>
        ))}
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!loading && !error && payload && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white text-sm">
                Total applications
              </h3>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.totalApplications}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white text-sm">
                Applications in this range
              </h3>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.applicationsInRange}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {changeStr(payload.metrics.applicationsChange)}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white text-sm">
                Track projects
              </h3>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.trackProjects}
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-medium text-slate-800 dark:text-white text-sm">Flow cards</h3>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.flowCards}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Window: last {payload.range.days} days (since{' '}
            {new Date(payload.range.since).toLocaleDateString([], {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })}
            ).
          </p>
        </div>
      )}
    </div>
  );
}

