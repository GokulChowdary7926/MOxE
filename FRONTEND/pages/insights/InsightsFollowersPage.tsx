import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Info } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';

type InsightsRange = '7d' | '30d';

type Demographics = {
  age: { range: string; pct: number }[];
  locations: { city: string; pct: number }[];
};

type InsightsPayload = {
  trendData: number[];
  demographics: Demographics;
};

function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-white text-sm w-24 flex-shrink-0 truncate" title={label}>
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[#262626] overflow-hidden">
        <div className="h-full rounded-full bg-pink-500" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <span className="text-[#a8a8a8] text-sm w-12 text-right">{pct}%</span>
    </div>
  );
}

function formatRangeLabel(range: InsightsRange): string {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (range === '30d' ? 30 : 7));
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export default function InsightsFollowersPage() {
  const [locationTab, setLocationTab] = useState<'cities' | 'countries'>('cities');
  const [range, setRange] = useState<InsightsRange>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<InsightsPayload | null>(null);

  const load = useCallback(async (r: InsightsRange) => {
    const token = getToken();
    if (!token) {
      setPayload(null);
      setError('Sign in to view insights.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/analytics/insights?range=${encodeURIComponent(r)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await readApiError(res).catch(() => 'Could not load insights');
        setPayload(null);
        setError(msg);
        return;
      }
      const data = (await res.json()) as InsightsPayload;
      setPayload({
        trendData: Array.isArray(data.trendData) ? data.trendData : [],
        demographics: {
          age: data.demographics?.age ?? [],
          locations: data.demographics?.locations ?? [],
        },
      });
    } catch (e: unknown) {
      setPayload(null);
      setError(e instanceof Error ? e.message : 'Could not load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  const trendBars = useMemo(() => {
    const series = payload?.trendData ?? [];
    if (series.length === 0) return { heights: [] as number[], labels: [] as string[] };
    const max = Math.max(1, ...series);
    const heights = series.map((n) => Math.round((n / max) * 100));
    const labels: string[] = [];
    const days = series.length;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - days);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      labels.push(
        days <= 7
          ? d.toLocaleDateString(undefined, { weekday: 'narrow' })
          : String(d.getDate()),
      );
    }
    return { heights, labels };
  }, [payload?.trendData]);

  const cityRows = payload?.demographics?.locations ?? [];
  const ageRows = payload?.demographics?.age ?? [];

  return (
    <SettingsPageShell title="Followers" backTo="/insights" right={<button type="button" className="p-1 text-[#a8a8a8]" aria-label="Info"><Info className="w-5 h-5" /></button>}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#262626]">
        <div className="flex rounded-lg overflow-hidden border border-[#363636]">
          {(['7d', '30d'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-sm ${range === r ? 'bg-[#262626] text-white' : 'text-[#a8a8a8] bg-black'}`}
            >
              {r === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
        </div>
        <span className="text-[#a8a8a8] text-sm">{formatRangeLabel(range)}</span>
      </div>

      {loading && <p className="px-4 py-4 text-[#737373] text-sm">Loading…</p>}
      {error && !loading && (
        <div className="px-4 py-4 text-[#a8a8a8] text-sm border-b border-[#262626]">{error}</div>
      )}

      {!loading && !error && payload && (
        <>
          <div className="px-4 py-4">
            <h2 className="text-white font-semibold mb-3">Top locations</h2>
            <div className="flex gap-2 mb-3">
              {(['cities', 'countries'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setLocationTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${locationTab === t ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
                >
                  {t === 'cities' ? 'Towns/cities' : 'Countries'}
                </button>
              ))}
            </div>
            {locationTab === 'cities' &&
              (cityRows.length === 0 ? (
                <p className="text-[#737373] text-sm">No location data yet.</p>
              ) : (
                cityRows.map((loc) => <BarRow key={loc.city} label={loc.city} pct={loc.pct} />)
              ))}
            {locationTab === 'countries' && (
              <p className="text-[#737373] text-sm">Country breakdown is not available in insights yet.</p>
            )}
          </div>

          <div className="px-4 py-4 border-t border-[#262626]">
            <h2 className="text-white font-semibold mb-3">Age range</h2>
            {ageRows.length === 0 ? (
              <p className="text-[#737373] text-sm">No age data yet.</p>
            ) : (
              ageRows.map((a) => <BarRow key={a.range} label={a.range} pct={a.pct} />)
            )}
          </div>

          <div className="px-4 py-4 border-t border-[#262626]">
            <h2 className="text-white font-semibold mb-3">Gender</h2>
            <p className="text-[#737373] text-sm">Gender breakdown is not available in insights yet.</p>
          </div>

          <div className="px-4 py-4 border-t border-[#262626]">
            <h2 className="text-white font-semibold mb-3">Daily reach (post views)</h2>
            <p className="text-[#737373] text-xs mb-4">Views on your posts, by day in this period.</p>
            {trendBars.heights.length === 0 ? (
              <p className="text-[#737373] text-sm">No activity in this range.</p>
            ) : (
              <div className="flex items-end gap-1 h-24">
                {trendBars.heights.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center min-w-0">
                    <div className="w-full rounded-t bg-pink-500/80" style={{ height: `${h}%` }} />
                    <span className="text-[#737373] text-[10px] mt-1 truncate max-w-full">{trendBars.labels[i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </SettingsPageShell>
  );
}
