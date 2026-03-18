import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

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
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders.Authorization = `Bearer ${token}`;

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

      const [atlasData, appsData, buildData, compassData, alertData] = await Promise.all([
        safeFetch<AtlasObjective[]>(`${API_BASE}/atlas/objectives`, { headers: authHeaders }),
        safeFetch<TrackApplication[]>(`${API_BASE}/job/track/applications`, { headers: authHeaders }),
        safeFetch<BuildPipeline[]>(`${API_BASE}/build/pipelines`, { headers: authHeaders }),
        safeFetch<CompassService[]>(`${API_BASE}/compass/services`, { headers: authHeaders }),
        safeFetch<AlertSchedule[]>(`${API_BASE}/alert/schedules`, { headers: authHeaders }),
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
        <div className="text-[#5E6C84] dark:text-[#8C9BAB] text-sm">Loading overview…</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-[#172B4D] dark:text-[#E6EDF3] mb-1">Job overview</h2>
      <p className="text-[#5E6C84] dark:text-[#8C9BAB] mb-4 text-sm">
        High-level snapshot of your MOxE Job tools: goals, tracking, builds, services and alerts.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-[#FFEBE6] dark:bg-red-900/20 text-[#BF2600] dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#5E6C84] dark:text-[#8C9BAB] uppercase tracking-wide mb-1">
            Goals (Atlas)
          </p>
          <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">
            {totalObjectives}
          </p>
          <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
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
          <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
            Active applications linked to your Job account.
          </p>
        </div>

        <div className="rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#5E6C84] dark:text-[#8C9BAB] uppercase tracking-wide mb-1">
            Pipelines (Build)
          </p>
          <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">
            {pipelines.length}
          </p>
          <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
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
          <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
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
          <p className="text-xs text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
            Rotations defined for critical alerts and incidents.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] p-4 shadow-sm">
        <p className="text-xs font-semibold text-[#5E6C84] dark:text-[#8C9BAB] uppercase tracking-wide mb-2">
          Next steps
        </p>
        <ul className="text-xs text-[#172B4D] dark:text-[#B6D2F0] space-y-1">
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

