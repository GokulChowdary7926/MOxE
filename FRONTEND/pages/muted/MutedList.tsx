import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { fetchApi, fetchApiJson } from '../../services/api';
import { readApiError } from '../../utils/readApiError';

type MutedRow = {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
  mutePosts: boolean;
  muteStories: boolean;
};

export default function MutedList() {
  const [list, setList] = useState<MutedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchApiJson<MutedRow[]>('privacy/muted');
      setList(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load muted accounts.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unmute(id: string) {
    setError(null);
    try {
      const res = await fetchApi(`privacy/mute/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readApiError(res));
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not unmute.');
    }
  }

  return (
    <SettingsPageShell title="Muted accounts" backTo="/settings">
      <div className="px-4 py-4">
        {loading ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">Loading…</p>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        ) : list.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">
            When you mute someone, you won&apos;t see their posts or stories in your feed. You can unmute them
            anytime.
          </p>
        ) : (
          <ul className="divide-y divide-[#262626]">
            {list.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-3">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80">
                  <img
                    src={user.profilePhoto || '/logo.png'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-[#262626]"
                  />
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{user.username}</p>
                    <p className="text-[#a8a8a8] text-sm truncate">{user.displayName}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void unmute(user.id)}
                  className="py-2 px-4 rounded-lg border border-[#363636] text-white font-semibold text-sm active:bg-white/10 flex-shrink-0"
                  aria-label={`Unmute ${user.username}`}
                >
                  Unmute
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
