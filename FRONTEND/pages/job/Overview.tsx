import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { getApiBase } from '../../services/api';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';
import { JOB_ALL_TOOLS } from '../../components/job/jobToolsRegistry';
import { JobToolBibleShell } from '../../components/job/bible/JobToolBibleShell';
import { bibleIconForJobPath } from '../../components/job/bible/jobBibleDrawerNav';

const API_BASE = getApiBase();

type AtlasObjective = { id: string; title: string; progress?: number };
type TrackApplication = { id: string };
type BuildPipeline = { id: string };
type CompassService = { id: string; status?: string | null };
type AlertSchedule = { id: string };

function MetricTile({
  label,
  value,
  meta,
}: {
  label: string;
  value: string | number;
  meta: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 border-l-4 border-l-primary/80">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
      <p className="text-2xl font-black tabular-nums text-on-surface">{value}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{meta}</p>
    </div>
  );
}

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
        setError('Sign in to view your Job dashboard.');
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
        setError('Could not load dashboard metrics. Check your connection and try again.');
      }
      setObjectives(Array.isArray(atlasData) ? atlasData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
      setPipelines(Array.isArray(buildData) ? buildData : []);
      setServices(Array.isArray(compassData) ? compassData : []);
      setSchedules(Array.isArray(alertData) ? alertData : []);
      setLoading(false);
    };
    fetchAll();
  }, [token]);

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
      <JobToolBibleShell
        toolTitle="MOxE Dashboard"
        toolIconMaterial="dashboard"
      >
        <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading dashboard">
          <div className="h-36 animate-pulse rounded-xl bg-surface-container-high/40" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-container-high/35" />
          ))}
        </div>
      </JobToolBibleShell>
    );
  }

  return (
    <JobToolBibleShell
      toolTitle="MOxE Dashboard"
      toolIconMaterial="dashboard"
    >
      <div className="space-y-6 pb-4 font-body text-on-background">
        {error ? (
          <div
            className="rounded-xl border border-error/35 bg-error-container/20 px-4 py-3 text-sm text-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4">
          <div className="relative overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container p-6 border-l-4 border-l-primary">
            <div className="relative z-10">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Dashboard overview</p>
              <h1 className="mb-3 font-headline text-2xl font-black tracking-tighter text-on-surface">
                Job dashboard
              </h1>
              <p className="mb-5 max-w-lg text-sm leading-relaxed text-on-surface-variant">
                One place to see goals, hiring activity, delivery pipelines, service health, and on-call coverage. Figures
                sync from your connected MOxE Job tools.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/job/atlas"
                  className="inline-flex w-full min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-primary to-on-primary-container px-6 py-2.5 text-center text-sm font-bold text-on-primary transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Open Atlas · Goals
                </Link>
                <Link
                  to="/job/track"
                  className="inline-flex w-full min-h-[48px] items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-highest px-6 py-2.5 text-center text-sm font-bold text-on-surface transition-colors hover:bg-surface-bright"
                >
                  Open Track · Work
                </Link>
              </div>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-primary/5 to-transparent" />
          </div>
        </section>

        <section aria-label="Key metrics">
          <h2 className="mb-3 font-headline text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            Pulse
          </h2>
          <div className="grid grid-cols-1 gap-3">
            <MetricTile
              label="Goals (Atlas)"
              value={totalObjectives}
              meta={`${Number.isNaN(avgObjectiveProgress) ? '–' : `${avgObjectiveProgress.toFixed(1)}%`} avg progress`}
            />
            <MetricTile label="Applications" value={applications.length} meta="Track · pipeline" />
            <MetricTile label="Build pipelines" value={pipelines.length} meta="Build · CI/CD" />
            <MetricTile
              label="Services"
              value={totalServices}
              meta={totalServices === 0 ? 'Compass · register services' : `${operationalServices} operational`}
            />
            <MetricTile label="Alert schedules" value={schedules.length} meta="Alert · on-call" />
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant/15 bg-surface-container-lowest/90 p-4">
          <h2 className="mb-1 font-headline text-lg font-bold text-on-surface">All modules</h2>
          <p className="mb-3 text-xs leading-relaxed text-on-surface-variant">
            {JOB_ALL_TOOLS.length} tools · Open any module below, or use the modules sheet (☰) in the tool bar.
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {JOB_ALL_TOOLS.map(({ path: to, label, description }) => {
              const icon = bibleIconForJobPath(to);
              return (
                <Link
                  key={to}
                  to={to === '/job/overview' || to === '/job/overview/home' ? '/job/overview/home' : to}
                  className={`${JOB_MOBILE.trackToolCard} ${JOB_MOBILE.touchMin} items-center`}
                >
                  <span className={JOB_MOBILE.trackToolIconChip}>
                    <span className="material-symbols-outlined text-[22px]">{icon}</span>
                  </span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className={JOB_MOBILE.trackToolLabel}>{label}</span>
                    <span className={JOB_MOBILE.trackToolDesc}>{description}</span>
                  </span>
                  <span className="material-symbols-outlined shrink-0 text-on-surface-variant opacity-50 text-xl">
                    chevron_right
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </JobToolBibleShell>
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
