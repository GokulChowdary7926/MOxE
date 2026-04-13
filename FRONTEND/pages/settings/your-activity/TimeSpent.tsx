import React, { useEffect, useState } from 'react';
import { PageLayout, SettingsSection } from '../../../components/layout/PageLayout';
import { ThemedText } from '../../../components/ui/Themed';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { fetchApi, getToken } from '../../../services/api';

type TimeSpentSummary = {
  days: { date: string; seconds: number }[];
  totalSeconds: number;
  dailyAverageSeconds: number;
};

function formatDuration(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${m}m`;
  return mm === 0 ? `${h}h` : `${h}h ${mm}m`;
}

function dayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  const today = new Date();
  const isToday =
    d.getUTCFullYear() === today.getUTCFullYear() &&
    d.getUTCMonth() === today.getUTCMonth() &&
    d.getUTCDate() === today.getUTCDate();
  if (isToday) return 'Today';
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export default function TimeSpent() {
  const [summary, setSummary] = useState<TimeSpentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!getToken()) {
        setError('You must be logged in.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetchApi('activity/time-spent?days=14');
        const data = (await res.json().catch(() => ({}))) as Partial<TimeSpentSummary>;
        if (cancelled) return;
        if (!res.ok) {
          setError(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Failed to load time spent.');
          setSummary(null);
          return;
        }
        setSummary({
          days: Array.isArray(data.days) ? data.days : [],
          totalSeconds: Number(data.totalSeconds) || 0,
          dailyAverageSeconds: Number(data.dailyAverageSeconds) || 0,
        });
      } catch {
        if (!cancelled) {
          setError('Failed to load time spent.');
          setSummary(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const days = summary?.days ?? [];
  const maxSec = Math.max(1, ...days.map((d) => d.seconds));
  const hasAnyTime = (summary?.totalSeconds ?? 0) > 0;

  return (
    <PageLayout title="Time spent" backTo="/activity">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          See how much time you spend on MOxE each day. Time is estimated while this app is open in an active browser tab.
        </ThemedText>

        {loading ? (
          <ThemedText secondary className="text-sm">Loading…</ThemedText>
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : !hasAnyTime ? (
          <SettingsSection title="Daily average">
            <EmptyState
              title="No usage data yet"
              message="Keep MOxE open while you browse; your daily totals will appear here after the first session."
            />
          </SettingsSection>
        ) : (
          <>
            <SettingsSection title="Daily average (last 14 days)">
              <p className="text-2xl font-bold text-moxe-text">{formatDuration(summary!.dailyAverageSeconds)}</p>
              <p className="text-moxe-textSecondary text-sm mt-1">Average per day · total {formatDuration(summary!.totalSeconds)}</p>
            </SettingsSection>

            <SettingsSection title="By day">
              <div className="flex items-end gap-1.5 h-28 mt-2">
                {days.map((d) => {
                  const h = Math.max(6, Math.round((d.seconds / maxSec) * 100));
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center min-w-0">
                      <div
                        className="w-full rounded-t bg-moxe-primary min-h-[6px] opacity-90"
                        style={{ height: `${h}%` }}
                        title={`${d.date}: ${formatDuration(d.seconds)}`}
                      />
                      <span className="text-moxe-textSecondary text-[10px] mt-1 truncate w-full text-center">
                        {dayLabel(d.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <ul className="mt-4 space-y-2 border-t border-moxe-border pt-3">
                {[...days].reverse().slice(0, 7).map((d) => (
                  <li key={d.date} className="flex justify-between text-sm">
                    <span className="text-moxe-textSecondary">{d.date}</span>
                    <span className="text-moxe-text font-medium">{formatDuration(d.seconds)}</span>
                  </li>
                ))}
              </ul>
            </SettingsSection>
          </>
        )}
      </div>
    </PageLayout>
  );
}
