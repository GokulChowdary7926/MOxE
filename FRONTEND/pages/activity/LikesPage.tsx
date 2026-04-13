import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';
import toast from 'react-hot-toast';

type Liker = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

export default function LikesPage() {
  const { postId, reelId } = useParams();
  const backTo = postId ? `/post/${postId}` : reelId ? `/reels` : '/';
  const [query, setQuery] = useState('');
  const [accounts, setAccounts] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(!!postId);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(() => new Set());

  const loadLikers = useCallback(async () => {
    if (!postId) {
      setAccounts([]);
      setLoading(false);
      setError(null);
      return;
    }
    const token = getToken();
    setLoading(true);
    setError(null);
    try {
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${getApiBase()}/posts/${encodeURIComponent(postId)}/likes?limit=200`, { headers });
      if (!res.ok) {
        setAccounts([]);
        setError(await readApiError(res).catch(() => 'Could not load likes'));
        return;
      }
      const data = (await res.json()) as { accounts?: Liker[] };
      setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
    } catch (e: unknown) {
      setAccounts([]);
      setError(e instanceof Error ? e.message : 'Could not load likes');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadLikers();
  }, [loadLikers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.username.toLowerCase().includes(q) ||
        (a.displayName && a.displayName.toLowerCase().includes(q)),
    );
  }, [accounts, query]);

  const follow = async (targetId: string) => {
    const token = getToken();
    if (!token) {
      toast.error('Sign in to follow');
      return;
    }
    try {
      const res = await fetch(`${getApiBase()}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: targetId }),
      });
      if (res.ok) {
        setFollowingIds((prev) => new Set(prev).add(targetId));
        toast.success('Following');
      } else toast.error(await readApiError(res).catch(() => 'Could not follow'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not follow');
    }
  };

  if (reelId && !postId) {
    return (
      <SettingsPageShell title="Likes" backTo={backTo}>
        <div className="px-4 py-8 text-center text-[#a8a8a8] text-sm">
          Reel likes are not available in the app yet.
        </div>
      </SettingsPageShell>
    );
  }

  return (
    <SettingsPageShell title="Likes" backTo={backTo}>
      <div className="px-4 py-2 border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
      </div>
      {loading && <p className="px-4 py-3 text-[#737373] text-sm">Loading…</p>}
      {error && !loading && <p className="px-4 py-3 text-red-400 text-sm">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="px-4 py-8 text-center text-[#a8a8a8] text-sm">
          {accounts.length === 0 ? 'No likes yet.' : 'No matches.'}
        </p>
      )}
      <div className="divide-y divide-[#262626]">
        {!loading &&
          !error &&
          filtered.map((u) => (
            <div key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/profile/${u.username}`} className="shrink-0">
                <Avatar uri={u.profilePhoto} size={44} />
              </Link>
              <Link to={`/profile/${u.username}`} className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{u.username}</p>
                <p className="text-[#a8a8a8] text-sm truncate">{u.displayName || ' '}</p>
              </Link>
              <button
                type="button"
                disabled={followingIds.has(u.id)}
                className="px-4 py-1.5 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50"
                onClick={() => void follow(u.id)}
              >
                {followingIds.has(u.id) ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
      </div>
    </SettingsPageShell>
  );
}
