import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Hash, MapPin, User, X } from 'lucide-react';
import { SettingsPageShell } from '../../../components/layout/SettingsPageShell';
import { ErrorState } from '../../../components/ui/ErrorState';
import { fetchApi, getToken } from '../../../services/api';

type RecentSearchEntry = {
  id: string;
  type: 'user' | 'hashtag' | 'place' | 'query';
  term: string;
  subtitle?: string;
  refId?: string;
};

function IconForType({ type }: { type: RecentSearchEntry['type'] }) {
  switch (type) {
    case 'user':
      return <User className="w-5 h-5 text-[#a8a8a8]" />;
    case 'hashtag':
      return <Hash className="w-5 h-5 text-[#a8a8a8]" />;
    case 'place':
      return <MapPin className="w-5 h-5 text-[#a8a8a8]" />;
    default:
      return <Search className="w-5 h-5 text-[#a8a8a8]" />;
  }
}

function mapApiItem(raw: { id: string; type: string; term: string; refId: string | null }): RecentSearchEntry {
  const t = String(raw.type || 'query').toLowerCase();
  if (t === 'user') {
    return { id: raw.id, type: 'user', term: raw.term, refId: raw.refId ?? undefined, subtitle: 'Account' };
  }
  if (t === 'hashtag' || t === 'tag') {
      return { id: raw.id, type: 'hashtag', term: raw.term.replace(/^#/, ''), refId: raw.refId ?? undefined, subtitle: 'Tag' };
  }
  if (t === 'place' || t === 'location') {
    return { id: raw.id, type: 'place', term: raw.term, refId: raw.refId ?? undefined, subtitle: 'Place' };
  }
  return { id: raw.id, type: 'query', term: raw.term, subtitle: 'Search' };
}

export default function RecentSearches() {
  const navigate = useNavigate();
  const [items, setItems] = useState<RecentSearchEntry[]>([]);
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
      const res = await fetchApi('activity/recent-searches');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof (data as { error?: string }).error === 'string' ? (data as { error: string }).error : 'Failed to load recent searches.');
        setItems([]);
        return;
      }
      const list = (data as { items?: unknown }).items;
      const mapped = Array.isArray(list) ? list.map((x: any) => mapApiItem(x)) : [];
      setItems(mapped);
    } catch {
      setError('Failed to load recent searches.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      const res = await fetchApi(`activity/recent-searches/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) void load();
    } catch {
      void load();
    }
  }

  async function clearAll() {
    setItems([]);
    try {
      const res = await fetchApi('activity/recent-searches', { method: 'DELETE' });
      if (!res.ok) void load();
    } catch {
      void load();
    }
  }

  function handleSelect(entry: RecentSearchEntry) {
    if (entry.type === 'user') {
      navigate(`/profile/${encodeURIComponent(entry.term)}`);
      return;
    }
    if (entry.type === 'hashtag') {
      navigate(`/hashtag/${encodeURIComponent(entry.refId ?? entry.term)}`);
      return;
    }
    if (entry.type === 'place') {
      navigate(`/location/${encodeURIComponent(entry.term)}`);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(entry.term)}`);
  }

  return (
    <SettingsPageShell title="Recent searches" backTo="/activity">
      <div className="px-4 py-4">
        {loading ? (
          <p className="text-[#a8a8a8] text-sm">Loading…</p>
        ) : error ? (
          <ErrorState message={error} onRetry={() => void load()} />
        ) : items.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm">No recent searches.</p>
        ) : (
          <>
            <div className="rounded-xl overflow-hidden border border-[#262626] divide-y divide-[#262626]">
              {items.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 py-3 px-4 bg-[#262626]/50">
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-3 text-left min-w-0 active:opacity-80"
                    onClick={() => handleSelect(entry)}
                  >
                    <IconForType type={entry.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {entry.type === 'hashtag' ? `#${entry.term}` : entry.term}
                      </p>
                      {entry.subtitle && <p className="text-[#a8a8a8] text-xs truncate">{entry.subtitle}</p>}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(entry.id)}
                    className="p-1 rounded-full text-[#a8a8a8] active:opacity-70"
                    aria-label={`Remove ${entry.term}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void clearAll()}
              className="mt-4 w-full py-3 text-[#0095f6] font-semibold text-sm active:opacity-80"
            >
              Clear all
            </button>
          </>
        )}
      </div>
    </SettingsPageShell>
  );
}
