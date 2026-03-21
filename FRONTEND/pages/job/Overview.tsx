import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { getApiBase } from '../../services/api';
import { JobPageContent, JobCard, JobSection } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

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

function OverviewHome() {
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
        <p className={JOB_MOBILE.meta}>Loading overview…</p>
      </div>
    );
  }

  return (
    <JobPageContent
      title="Job overview"
      description="High-level snapshot of your MOxE Job tools: goals, tracking, builds, services and alerts."
      error={error}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <JobSection label="Goals (Atlas)" className="!p-4">
            <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">{totalObjectives}</p>
            <p className={`mt-1 ${JOB_MOBILE.meta}`}>
              Avg progress: {Number.isNaN(avgObjectiveProgress) ? '–' : `${avgObjectiveProgress.toFixed(1)}%`}
            </p>
          </JobSection>
          <JobSection label="Applications (Track)" className="!p-4">
            <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">{applications.length}</p>
            <p className={`mt-1 ${JOB_MOBILE.meta}`}>Active applications</p>
          </JobSection>
          <JobSection label="Pipelines (Build)" className="!p-4">
            <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">{pipelines.length}</p>
            <p className={`mt-1 ${JOB_MOBILE.meta}`}>CI/CD pipelines</p>
          </JobSection>
          <JobSection label="Services (Compass)" className="!p-4">
            <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">{totalServices}</p>
            <p className={`mt-1 ${JOB_MOBILE.meta}`}>
              {totalServices === 0 ? 'None yet' : `${operationalServices} operational`}
            </p>
          </JobSection>
        </div>

        <JobSection label="On-call schedules (Alert)">
          <p className="text-xl font-semibold text-[#172B4D] dark:text-[#E6EDF3]">{schedules.length}</p>
          <p className={`mt-1 ${JOB_MOBILE.meta}`}>Rotations for alerts and incidents</p>
        </JobSection>

        <JobCard>
          <p className={`${JOB_MOBILE.label} mb-2`}>Next steps</p>
          <ul className={`text-sm text-[#172B4D] dark:text-[#E6EDF3] space-y-2`}>
            <li>• <strong>Track</strong> – applications and recruitment</li>
            <li>• <strong>Work</strong> & <strong>Flow</strong> – projects and tasks</li>
            <li>• <strong>Atlas</strong> – objectives and key results</li>
            <li>• <strong>Build</strong>, <strong>Compass</strong>, <strong>Alert</strong> – CI/CD, health, on-call</li>
          </ul>
        </JobCard>
      </div>
    </JobPageContent>
  );
}

export default function Overview() {
  return (
    <Routes>
      <Route index element={<Navigate to="home" replace />} />
      <Route path="home" element={<OverviewHome />} />
      <Route path="*" element={<Navigate to="home" replace />} />
    </Routes>
  );
}

