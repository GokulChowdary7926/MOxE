import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ChevronLeft } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { UI } from '../../constants/uiTheme';
import { fetchApi, getToken } from '../../services/api';

type CloseFriendUser = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

export default function CloseFriendsList() {
  const [list, setList] = useState<CloseFriendUser[]>([]);
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
        const res = await fetchApi('close-friends');
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to load close friends.');
          setList([]);
          return;
        }
        const arr = Array.isArray(data) ? data : (data.list ?? data.items ?? []);
        setList(arr.map((u: any) => ({
          id: u.id,
          username: u.username ?? '',
          displayName: u.displayName ?? null,
          profilePhoto: u.profilePhoto ?? null,
        })));
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load close friends.');
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function remove(friendId: string) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetchApi('close-friends/' + encodeURIComponent(friendId), { method: 'DELETE' });
      if (res.ok) setList((prev) => prev.filter((u) => u.id !== friendId));
    } catch {
      // ignore
    }
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/settings" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Close Friends</span>
        <div className="min-w-[80px] flex justify-end">
          <Link
            to="/close-friends/add"
            className={UI.headerAction}
            aria-label="Add to Close Friends"
          >
            <Plus className="w-5 h-5 inline-block" />
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto pb-20 px-4">
        <p className="text-[#a8a8a8] text-sm py-4">
          Only people on your Close Friends list can see when you post to close friends.
        </p>
        {loading ? (
          <ThemedText secondary className="text-sm">Loading…</ThemedText>
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : list.length === 0 ? (
          <EmptyState
            title="No close friends yet"
            message="Add people to your list to share stories with just them."
          />
        ) : (
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden divide-y divide-[#363636]">
            {list.map((user) => (
              <div key={user.id} className={`${UI.listRow} flex items-center justify-between`}>
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center gap-3 min-w-0 flex-1 active:opacity-80"
                >
                  <Avatar uri={user.profilePhoto} size={44} />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{user.username}</p>
                    <p className="text-[#a8a8a8] text-sm truncate">{user.displayName ?? ''}</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(user.id)}
                  className="py-2 px-4 rounded-lg border border-[#363636] text-sm font-semibold text-white hover:bg-white/5 active:opacity-80 flex-shrink-0"
                  aria-label={`Remove ${user.username} from Close Friends`}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
