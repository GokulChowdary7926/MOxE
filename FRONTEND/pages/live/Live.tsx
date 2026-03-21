import React, { useEffect, useState } from 'react';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { Link } from 'react-router-dom';
import { getApiBase, getToken } from '../../services/api';

const API_BASE = getApiBase();

type LiveItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledFor: string | null;
  startedAt: string | null;
  account?: { id: string; username: string; displayName: string | null; profilePhoto: string | null };
};

type ReplayItem = {
  id: string;
  title: string;
  description: string | null;
  recording: string | null;
  endedAt: string | null;
  account?: { id: string; username: string; displayName: string | null; profilePhoto: string | null };
};

export default function Live() {
  const cap = useAccountCapabilities();
  const [items, setItems] = useState<LiveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [replays, setReplays] = useState<ReplayItem[]>([]);
  const [replaysLoading, setReplaysLoading] = useState(false);

  useEffect(() => {
    if (!cap.canLive) return;
    setLoading(true);
    const headers: HeadersInit = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/live`, { headers })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));

    setReplaysLoading(true);
    fetch(`${API_BASE}/live/replays`, { headers })
      .then((r) => r.json())
      .then((data) =>
        setReplays(
          Array.isArray(data?.items)
            ? data.items.map((x: any) => ({
                id: x.id,
                title: x.title,
                description: x.description ?? null,
                recording: x.recording ?? null,
                endedAt: x.endedAt ?? null,
                account: x.account ?? null,
              }))
            : [],
        ),
      )
      .catch(() => setReplays([]))
      .finally(() => setReplaysLoading(false));
  }, [cap.canLive]);

  if (!cap.canLive) {
    return (
      <div className="p-4 max-w-xl mx-auto">
        <p className="text-slate-500">Live is available for Business and Creator accounts.</p>
        <Link to="/settings" className="text-indigo-600 dark:text-indigo-400 text-sm mt-2 inline-block">
          Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Live</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Go live with your camera. Viewers see your stream in real time.
      </p>
      <Link
        to="/live/start"
        className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm mb-6"
      >
        Go Live
      </Link>
      {loading && <p className="text-slate-500 text-sm">Loading…</p>}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-medium text-slate-800 dark:text-white">Scheduled & live</h2>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/live/${item.id}`}
                  className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <span className="font-medium text-slate-800 dark:text-white">{item.title}</span>
                  <span className="ml-2 text-xs text-slate-500">
                    {item.status}
                    {item.scheduledFor && ` · ${new Date(item.scheduledFor).toLocaleString()}`}
                  </span>
                  {item.account && (
                    <span className="block text-sm text-slate-500 mt-1">@{item.account.username}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!loading && items.length === 0 && (
        <p className="text-slate-500 text-sm">No scheduled or live streams right now.</p>
      )}

      <div className="mt-8">
        <h2 className="font-medium text-slate-800 dark:text-white mb-2">Replays</h2>
        {replaysLoading && <p className="text-slate-500 text-sm">Loading replays…</p>}
        {!replaysLoading && replays.length === 0 && (
          <p className="text-slate-500 text-sm">No replays available yet.</p>
        )}
        {!replaysLoading && replays.length > 0 && (
          <ul className="space-y-2">
            {replays.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/live/replay/${r.id}`}
                  className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750"
                >
                  <span className="font-medium text-slate-800 dark:text-white">{r.title}</span>
                  {r.endedAt && (
                    <span className="ml-2 text-xs text-slate-500">
                      · Ended {new Date(r.endedAt).toLocaleString()}
                    </span>
                  )}
                  {r.account && (
                    <span className="block text-sm text-slate-500 mt-1">
                      @{r.account.username}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
