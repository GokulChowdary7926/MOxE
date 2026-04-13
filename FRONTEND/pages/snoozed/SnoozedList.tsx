import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { fetchApi, fetchApiJson } from '../../services/api';
import { readApiError } from '../../utils/readApiError';

type SnoozedRow = {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
  snoozedUntil: string;
};

function formatUntil(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function SnoozedList() {
  const [list, setList] = useState<SnoozedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchApiJson<SnoozedRow[]>('privacy/snoozed');
      setList(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load snoozed accounts.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unsnooze(id: string) {
    setError(null);
    try {
      const res = await fetchApi(`privacy/snooze/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readApiError(res));
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not unsnooze.');
    }
  }

  return (
    <SettingsPageShell title="Snoozed accounts" backTo="/settings">
      <div className="px-4 py-4">
        <p className="text-[#737373] text-xs mb-4">
          Snoozed accounts stay followed but are hidden from your home feed until the date shown. This is separate from mute
          (which affects posts/stories visibility more broadly).
        </p>
        {loading ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">Loading…</p>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        ) : list.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">No active snoozes. Snooze someone from a post’s ··· menu on home feed.</p>
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
                    <p className="text-[#737373] text-[11px] mt-0.5">Feed hide until {formatUntil(user.snoozedUntil)}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void unsnooze(user.id)}
                  className="py-2 px-4 rounded-lg border border-[#363636] text-white font-semibold text-sm active:bg-white/10 flex-shrink-0"
                  aria-label={`Unsnooze ${user.username}`}
                >
                  Unsnooze
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
