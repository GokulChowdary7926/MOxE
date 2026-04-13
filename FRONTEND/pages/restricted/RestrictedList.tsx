import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchApi, fetchApiJson } from '../../services/api';
import { readApiError } from '../../utils/readApiError';

type RestrictedRow = {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
};

export default function RestrictedList() {
  const [list, setList] = useState<RestrictedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchApiJson<RestrictedRow[]>('privacy/restricted');
      setList(Array.isArray(rows) ? rows : []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load restricted accounts.');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function unrestrict(id: string) {
    setError(null);
    try {
      const res = await fetchApi(`privacy/restrict/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readApiError(res));
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not unrestrict.');
    }
  }

  return (
    <PageLayout title="Restricted accounts" backTo="/settings/safety">
      <div className="py-4">
        {loading ? (
          <p className="text-moxe-textSecondary text-sm text-center py-12">Loading…</p>
        ) : error ? (
          <p className="text-red-400 text-sm text-center py-8">{error}</p>
        ) : list.length === 0 ? (
          <EmptyState
            title="No restricted accounts"
            message="When you restrict someone, their comments and messages are limited. You can unrestrict them anytime."
          />
        ) : (
          <div className="rounded-xl bg-moxe-surface border border-moxe-border overflow-hidden divide-y divide-moxe-border">
            {list.map((user) => (
              <div key={user.id} className="flex items-center gap-3 py-3 px-4">
                <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80">
                  <img
                    src={user.profilePhoto || '/logo.png'}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-moxe-background"
                  />
                  <div className="min-w-0">
                    <ThemedText className="text-moxe-body font-semibold text-moxe-text truncate">
                      {user.username}
                    </ThemedText>
                    <ThemedText secondary className="text-moxe-caption truncate block">
                      {user.displayName}
                    </ThemedText>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => void unrestrict(user.id)}
                  className="py-2 px-4 rounded-lg border border-moxe-border text-moxe-body font-semibold text-moxe-text hover:bg-moxe-surface/80 active:opacity-80 flex-shrink-0"
                  aria-label={`Unrestrict ${user.username}`}
                >
                  Unrestrict
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
