import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type AtlasObjective = {
  id: string;
  title: string;
  progress?: number;
};

type TrackApplication = {
  id: string;
};

type BuildPipeline = {
  id: string;
};

type CompassService = {
  id: string;
  status?: 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'MAINTENANCE' | 'UNKNOWN' | null;
};

type AlertSchedule = {
  id: string;
};

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [objectives, setObjectives] = useState<AtlasObjective[]>([]);
  const [applications, setApplications] = useState<TrackApplication[]>([]);
  const [pipelines, setPipelines] = useState<BuildPipeline[]>([]);
  const [services, setServices] = useState<CompassService[]>([]);
  const [schedules, setSchedules] = useState<AlertSchedule[]>([]);

  const token = localStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) {
        setLoading(false);
        setError('You must be logged in to use MOxE Job overview.');
        return;
      }
      setLoading(true);
      setError(null);

      const safeFetch = async <T,>(url: string, opts?: RequestInit): Promise<T | null> => {
        try {
          const res = await fetch(url, opts);
          if (!res.ok) return null;
          const data = await res.json();
          return data as T;
        } catch {
          return null;
        }
      };

      const baseHeaders = {
        'Content-Type': 'application/json',
        ...authHeaders,
      };

      const [atlasData, appsData, buildData, compassData, alertData] = await Promise.all([
        safeFetch<AtlasObjective[]>(`${API_BASE}/atlas/objectives`, { headers: baseHeaders }),
        safeFetch<TrackApplication[]>(`${API_BASE}/job/track/applications`, { headers: baseHeaders }),
        safeFetch<BuildPipeline[]>(`${API_BASE}/build/pipelines`, { headers: baseHeaders }),
        safeFetch<CompassService[]>(`${API_BASE}/compass/services`, { headers: baseHeaders }),
        safeFetch<AlertSchedule[]>(`${API_BASE}/alert/schedules`, { headers: baseHeaders }),
      ]);

      if (!atlasData && !appsData && !buildData && !compassData && !alertData) {
        setError('Failed to load overview metrics.');
      }

      setObjectives(Array.isArray(atlasData) ? atlasData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
      setPipelines(Array.isArray(buildData) ? buildData : []);
      setServices(Array.isArray(compassData) ? compassData : []);
      setSchedules(Array.isArray(alertData) ? alertData : []);

      setLoading(false);
    };

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalObjectives = objectives.length;
  const avgObjectiveProgress =
    totalObjectives === 0
      ? 0
      : objectives.reduce((sum, o) => sum + (typeof o.progress === 'number' ? o.progress : 0), 0) /
        totalObjectives;

  const totalServices = services.length;
  const operationalServices = services.filter((s) => s.status === 'OPERATIONAL').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading overview…</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Job overview</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        High-level snapshot of your MOxE Job tools: goals, tracking, builds, services and alerts.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Goals (Atlas)
          </p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-50">
            {totalObjectives}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Avg progress:{' '}
            <span className="font-medium">
              {Number.isNaN(avgObjectiveProgress) ? '–' : `${avgObjectiveProgress.toFixed(1)}%`}
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Job applications (Track)
          </p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-50">
            {applications.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active applications linked to your Job account.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Pipelines (Build)
          </p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-50">
            {pipelines.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            CI/CD pipelines for your MOxE Code repositories.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            Services (Compass)
          </p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-50">
            {totalServices}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {totalServices === 0
              ? 'No services registered yet.'
              : `${operationalServices} operational, ${
                  totalServices - operationalServices
                } with issues or unknown status.`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
            On-call schedules (Alert)
          </p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-50">
            {schedules.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rotations defined for critical alerts and incidents.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
          Next steps
        </p>
        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <li>
            • Use <span className="font-semibold">Track</span> to manage applications and recruitment
            pipelines.
          </li>
          <li>
            • Use <span className="font-semibold">Work</span> and <span className="font-semibold">Flow</span> to plan business projects and daily
            tasks.
          </li>
          <li>
            • Use <span className="font-semibold">Atlas</span> to define objectives and key results for
            your Job account.
          </li>
          <li>
            • Use <span className="font-semibold">Build</span>, <span className="font-semibold">Compass</span> and{' '}
            <span className="font-semibold">Alert</span> to wire CI/CD, service health and on‑call
            alerting.
          </li>
        </ul>
      </div>
    </div>
  );
}

