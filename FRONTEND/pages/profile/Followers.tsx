import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIsOwnProfile } from '../../hooks/useIsOwnProfile';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type Follower = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

export default function Followers() {
  const { username } = useParams<{ username: string }>();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [listPrivate, setListPrivate] = useState(false);
  const [accountUnavailable, setAccountUnavailable] = useState(false);

  const isOwn = useIsOwnProfile();

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    async function loadFollowers() {
      try {
        setLoading(true);
        setListPrivate(false);
        setAccountUnavailable(false);
        let profileAccountId = '';
        let isPrivate = false;
        const accountRes = await fetch(`${API_BASE}/accounts/username/${encodeURIComponent(username)}`, { headers });
        if (!accountRes.ok) {
          setAccountUnavailable(true);
          setFollowers([]);
          return;
        }
        const accountData = await accountRes.json().catch(() => ({}));
        profileAccountId = String(accountData?.id ?? accountData?.account?.id ?? '');
        isPrivate = Boolean(accountData?.isPrivate ?? accountData?.account?.isPrivate);
        let canViewPrivateGraph = isOwn;
        if (!canViewPrivateGraph && isPrivate && token && profileAccountId) {
          const statusRes = await fetch(`${API_BASE}/follow/status/${encodeURIComponent(profileAccountId)}`, { headers });
          const status = statusRes.ok ? await statusRes.json().catch(() => ({})) : {};
          canViewPrivateGraph = Boolean(status?.isFollowing);
        }
        if (!isOwn && isPrivate && !canViewPrivateGraph) {
          setListPrivate(true);
          setFollowers([]);
          return;
        }
        const res = await fetch(`${API_BASE}/follow/followers/by/${encodeURIComponent(username)}`, { headers });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        setFollowers(Array.isArray(data?.followers) ? data.followers : []);
      } catch {
        setFollowers([]);
      } finally {
        setLoading(false);
      }
    }
    loadFollowers();
  }, [username, isOwn]);

  async function removeFollower(followerId: string) {
    const token = localStorage.getItem('token');
    if (!token || !isOwn) return;
    setRemovingId(followerId);
    try {
      const res = await fetch(`${API_BASE}/follow/followers/${encodeURIComponent(followerId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFollowers((prev) => prev.filter((f) => f.id !== followerId));
      }
    } catch {
      // ignore
    } finally {
      setRemovingId(null);
    }
  }

  const title = isOwn ? 'Followers' : username ? `${username}'s followers` : 'Followers';

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title={title}
        left={
          <Link
            to={username ? `/profile/${username}` : '/profile'}
            className="text-moxe-text text-2xl leading-none"
            aria-label="Back"
          >
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md">
        {loading ? (
          <ThemedText secondary>Loading…</ThemedText>
        ) : accountUnavailable ? (
          <ThemedText secondary className="text-moxe-caption">
            This account is unavailable.
          </ThemedText>
        ) : listPrivate ? (
          <ThemedText secondary className="text-moxe-caption">
            This follower list is private.
          </ThemedText>
        ) : followers.length === 0 ? (
          <ThemedText secondary className="text-moxe-caption">
            {isOwn ? 'You have no followers yet.' : 'No followers.'}
          </ThemedText>
        ) : (
          <ul className="divide-y divide-moxe-border">
            {followers.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3 first:pt-0">
                <Link to={`/profile/${f.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar uri={f.profilePhoto} size={44} />
                  <div className="min-w-0 flex-1">
                    <ThemedText className="font-medium text-moxe-body truncate">
                      {f.displayName || f.username}
                    </ThemedText>
                    <ThemedText secondary className="text-moxe-caption text-[13px] truncate">
                      @{f.username}
                    </ThemedText>
                  </div>
                </Link>
                {isOwn && (
                  <button
                    type="button"
                    onClick={() => removeFollower(f.id)}
                    disabled={removingId === f.id}
                    className="px-3 py-1.5 rounded-moxe-md border border-moxe-border bg-moxe-surface text-moxe-caption text-[13px] font-medium disabled:opacity-50"
                  >
                    {removingId === f.id ? '…' : 'Remove'}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </ThemedView>
  );
}
