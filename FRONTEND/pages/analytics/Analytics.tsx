import React, { useEffect, useState } from 'react';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { Link } from 'react-router-dom';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type InsightsPayload = {
  metrics: {
    reach: number;
    reachChange: number;
    engagement: number;
    engagementChange: number;
    profileVisits: number;
    profileVisitsChange: number;
    websiteClicks: number;
    websiteClicksChange: number;
    actionButtonClicks: number;
    actionButtonClicksChange: number;
    productTagClicks: number;
    productTagClicksChange: number;
  };
  trendData: number[];
  followerGrowthTrend: number[];
  accountOverview: { followers: number; posts: number; rating: number };
  topPosts: { id: string; title: string; reach: string; engagement: string; date: string }[];
  demographics: { age: { range: string; pct: number }[]; locations: { city: string; pct: number }[] };
  creatorInsights?: {
    reelViews: number;
    reelViewsChange: number;
    playsSource: { source: string; count: number }[];
    audioPerformance: { audio: string; views: number; reels: number }[];
    contentComparison: { id: string; title: string; views: number; engagement: number; score: number }[];
    reelRetentionPreview: { second: number; viewers: number }[];
  };
};

export default function Analytics() {
  const cap = useAccountCapabilities();
  const [payload, setPayload] = useState<InsightsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    if (!cap.canAnalytics) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/analytics/insights?range=${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 403 ? 'Upgrade for this range' : 'Failed to load');
        return r.json();
      })
      .then(setPayload)
      .catch((e) => {
        setError(e?.message ?? 'Failed to load insights');
        setPayload(null);
      })
      .finally(() => setLoading(false));
  }, [cap.canAnalytics, range]);

  if (!cap.canAnalytics) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <p className="text-slate-500">Analytics is available for Star, Business, and Creator accounts.</p>
        <Link to="/settings" className="text-indigo-600 dark:text-indigo-400 text-sm mt-2 inline-block">
          Settings
        </Link>
      </div>
    );
  }

  const changeStr = (n: number) => (n === 0 ? '' : n > 0 ? `+${n}%` : `${n}%`);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Analytics</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Insights and performance for your account.
      </p>
      <div className="flex gap-2 mb-6">
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
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && payload && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="font-medium text-slate-800 dark:text-white">Reach</h2>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.reach}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {changeStr(payload.metrics.reachChange)} vs previous period
              </p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <h2 className="font-medium text-slate-800 dark:text-white">Engagement</h2>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.engagement}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {changeStr(payload.metrics.engagementChange)} vs previous period
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="font-medium text-slate-800 dark:text-white">Profile visits</h2>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.profileVisits}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {changeStr(payload.metrics.profileVisitsChange)} vs previous period
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="font-medium text-slate-800 dark:text-white">Website clicks</h2>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                {payload.metrics.websiteClicks}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {changeStr(payload.metrics.websiteClicksChange)} vs previous period
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="font-medium text-slate-800 dark:text-white">Account overview</h2>
              <p className="text-slate-700 dark:text-slate-300 mt-1">
                {payload.accountOverview.followers} followers · {payload.accountOverview.posts} posts
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                Rating: {payload.accountOverview.rating.toFixed(1)}
              </p>
            </div>
          </div>
          {payload.topPosts && payload.topPosts.length > 0 && (
            <div>
              <h2 className="font-medium text-slate-800 dark:text-white mb-2">Top posts</h2>
              <ul className="space-y-2">
                {payload.topPosts.map((p) => (
                  <li
                    key={p.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <span className="text-slate-800 dark:text-white">{p.title || 'Post'}</span>
                    <span className="text-slate-500 text-sm ml-2">
                      Reach {p.reach} · Engagement {p.engagement}
                    </span>
                    {p.date && (
                      <span className="block text-xs text-slate-400 mt-1">{p.date}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {payload.creatorInsights && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h2 className="font-medium text-slate-800 dark:text-white">Reel views</h2>
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
                    {payload.creatorInsights.reelViews}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {changeStr(payload.creatorInsights.reelViewsChange)} vs previous period
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h2 className="font-medium text-slate-800 dark:text-white mb-3">Plays source</h2>
                  {payload.creatorInsights.playsSource.length === 0 ? (
                    <p className="text-sm text-slate-500">No source data yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {payload.creatorInsights.playsSource.map((row) => (
                        <li key={row.source} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300 capitalize">{row.source}</span>
                          <span className="font-medium text-slate-900 dark:text-white">{row.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h2 className="font-medium text-slate-800 dark:text-white mb-3">Audio performance</h2>
                  {payload.creatorInsights.audioPerformance.length === 0 ? (
                    <p className="text-sm text-slate-500">No audio data yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {payload.creatorInsights.audioPerformance.map((row) => (
                        <li key={row.audio} className="flex items-center justify-between text-sm gap-3">
                          <span className="text-slate-700 dark:text-slate-300 truncate">{row.audio}</span>
                          <span className="font-medium text-slate-900 dark:text-white whitespace-nowrap">
                            {row.views} views · {row.reels} reels
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="font-medium text-slate-800 dark:text-white mb-3">Content comparison</h2>
                {payload.creatorInsights.contentComparison.length === 0 ? (
                  <p className="text-sm text-slate-500">No reel comparison data yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {payload.creatorInsights.contentComparison.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-700 dark:text-slate-300 truncate">{row.title}</span>
                        <span className="text-slate-900 dark:text-white whitespace-nowrap">
                          {row.views} views · {row.engagement} eng · score {row.score}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <h2 className="font-medium text-slate-800 dark:text-white mb-3">Retention preview</h2>
                {payload.creatorInsights.reelRetentionPreview.length === 0 ? (
                  <p className="text-sm text-slate-500">No retention samples yet.</p>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {payload.creatorInsights.reelRetentionPreview.slice(0, 20).map((p) => (
                      <div
                        key={`${p.second}-${p.viewers}`}
                        className="rounded-md border border-slate-200 dark:border-slate-700 p-2 text-center"
                      >
                        <p className="text-[11px] text-slate-500">{p.second}s</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{p.viewers}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
