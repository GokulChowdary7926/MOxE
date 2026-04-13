import React, { useCallback, useEffect, useState } from 'react';
import { SettingsPageShell } from '../../../components/layout/SettingsPageShell';
import { ErrorState } from '../../../components/ui/ErrorState';
import { fetchApi, getToken } from '../../../services/api';

type LinkEntry = { id: string; title?: string | null; url: string; openedAt: string };

export default function LinkHistory() {
  const [items, setItems] = useState<LinkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi('activity/link-history');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Failed to load link history.');
        setItems([]);
        return;
      }
      const list = (data as { items?: unknown }).items;
      setItems(
        Array.isArray(list)
          ? list.map((x: any) => ({
              id: String(x.id ?? ''),
              title: x.title ?? null,
              url: String(x.url ?? ''),
              openedAt: String(x.openedAt ?? x.clickedAt ?? ''),
            })).filter((x) => x.id && x.url)
          : [],
      );
    } catch {
      setError('Failed to load link history.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SettingsPageShell title="Link history" backTo="/activity">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Links you&apos;ve opened from MOxE (when the app records them).</p>
        {loading ? (
          <p className="text-[#a8a8a8] text-sm">Loading…</p>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm">No link history.</p>
        ) : (
          <div className="divide-y divide-[#262626] border border-[#262626] rounded-xl overflow-hidden">
            {items.map((entry) => (
              <a
                key={entry.id}
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 px-4 active:bg-white/5"
              >
                <p className="text-white font-medium truncate">{entry.title?.trim() || entry.url}</p>
                <p className="text-[#a8a8a8] text-xs truncate mt-0.5">{entry.url}</p>
                <p className="text-[#737373] text-[11px] mt-1">
                  {entry.openedAt
                    ? new Date(entry.openedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
