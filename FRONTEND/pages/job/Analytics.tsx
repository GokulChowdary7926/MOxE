import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiBase, getToken } from '../../services/api';
import { JobDesignBiblePanel, JobToolBibleShell } from '../../components/job/bible';
import { JobCard } from '../../components/job/JobPageContent';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

type JobInsights = {
  metrics: {
    totalApplications: number;
    applicationsInRange: number;
    applicationsChange: number;
    trackProjects: number;
    flowCards: number;
  };
  range: { days: number; since: string };
};

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-[#DFE1E6] bg-[#F4F5F7] p-4 dark:border-[#2C333A] dark:bg-[#161A1D]">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#5E6C84] dark:text-[#8C9BAB]">
        {label}
      </p>
      <p className="text-2xl font-black tabular-nums text-[#172B4D] dark:text-[#E6EDF3]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#5E6C84] dark:text-[#8C9BAB]">{hint}</p> : null}
    </div>
  );
}

export default function JobAnalytics() {
  const [data, setData] = useState<JobInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = getToken();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Sign in to view Job analytics.');
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/job/analytics/insights?range=7d`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((body as { error?: string }).error || 'Failed to load insights');
        if (!cancelled) setData(body as JobInsights);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load insights');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const m = data?.metrics;

  return (
    <JobToolBibleShell toolTitle="MOxE ANALYTICS" toolIconMaterial="bar_chart">
      <div className="space-y-6 pb-4 font-body text-on-background">
        <section className="rounded-xl border border-outline-variant/15 bg-surface-container p-5 border-l-4 border-l-[#0052CC]">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0052CC]">Insights</p>
          <h1 className="mb-2 font-headline text-xl font-black tracking-tight text-on-surface">Job analytics</h1>
          <p className="max-w-prose text-sm leading-relaxed text-on-surface-variant">
            Live counts from your MOxE Job workspace — applications, Track projects, and Flow cards — for the current
            range.
          </p>
          {data?.range ? (
            <p className="mt-2 text-xs text-on-surface-variant">
              Range: last {data.range.days} days (since {new Date(data.range.since).toLocaleDateString()})
            </p>
          ) : null}
        </section>

        {error ? (
          <div className={`${JOB_MOBILE.error}`} role="alert">
            {error}
          </div>
        ) : null}

        {loading && !m ? (
          <div className="space-y-3 py-2" aria-busy="true">
            <div className="h-24 animate-pulse rounded-xl bg-surface-container-high/40" />
            <div className="h-24 animate-pulse rounded-xl bg-surface-container-high/35" />
          </div>
        ) : m ? (
          <div className="grid grid-cols-1 gap-3">
            <Metric
              label="Applications (all time)"
              value={m.totalApplications}
              hint={
                m.applicationsChange === 0 && m.applicationsInRange === 0
                  ? `None in the last ${data?.range.days ?? 7} days`
                  : `${m.applicationsInRange} in range · ${m.applicationsChange >= 0 ? '+' : ''}${m.applicationsChange}% vs prior window`
              }
            />
            <Metric label="Track projects" value={m.trackProjects} hint="MOxE Track" />
            <Metric label="Flow cards" value={m.flowCards} hint="Across your Flow boards" />
          </div>
        ) : null}

        <JobCard variant="track">
          <p className={`${JOB_MOBILE.trackBody} mb-3`}>
            Open related tools to change what shows up here — Track for applications, Flow for delivery cards.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              to="/job/track/applications"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0052CC] px-4 py-2.5 text-center text-sm font-bold text-white"
            >
              Open Track
            </Link>
            <Link
              to="/job/flow"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#DFE1E6] bg-[#F4F5F7] px-4 py-2.5 text-center text-sm font-bold text-[#172B4D] dark:border-[#2C333A] dark:bg-[#161A1D] dark:text-[#E6EDF3]"
            >
              Open Flow
            </Link>
          </div>
        </JobCard>

        <JobDesignBiblePanel toolKey="analytics" showHero={false} />
      </div>
    </JobToolBibleShell>
  );
}
