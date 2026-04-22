import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useIsOwnProfile } from '../../hooks/useIsOwnProfile';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Avatar } from '../../components/ui/Avatar';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type Following = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [listPrivate, setListPrivate] = useState(false);
  const [accountUnavailable, setAccountUnavailable] = useState(false);

  const isOwn = useIsOwnProfile();
  const backTo = username ? `/profile/${username}` : '/profile';

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    async function loadFollowing() {
      try {
        setLoading(true);
        setListPrivate(false);
        setAccountUnavailable(false);
        let profileAccountId = '';
        let isPrivate = false;
        const accountRes = await fetch(`${API_BASE}/accounts/username/${encodeURIComponent(username)}`, { headers });
        if (!accountRes.ok) {
          setAccountUnavailable(true);
          setFollowing([]);
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
          setFollowing([]);
          return;
        }
        const res = await fetch(`${API_BASE}/follow/following/by/${encodeURIComponent(username)}`, { headers });
        const data = res.ok ? await res.json().catch(() => ({})) : {};
        setFollowing(Array.isArray(data?.following) ? data.following : []);
      } catch {
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    }
    loadFollowing();
  }, [username, isOwn]);

  return (
    <SettingsPageShell title="Following" backTo={backTo}>
      <div className="px-4 py-4">
        {loading ? (
          <p className="text-[#a8a8a8] text-sm">Loading…</p>
        ) : accountUnavailable ? (
          <p className="text-[#a8a8a8] text-sm">This account is unavailable.</p>
        ) : listPrivate ? (
          <p className="text-[#a8a8a8] text-sm">This following list is private.</p>
        ) : following.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm">{isOwn ? 'You are not following anyone yet.' : 'No following.'}</p>
        ) : (
          <ul className="divide-y divide-[#262626]">
            {following.map((f) => (
              <li key={f.id}>
                <Link to={`/profile/${f.username}`} className="flex items-center gap-3 py-3 text-white active:bg-white/5">
                  <Avatar uri={f.profilePhoto} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{f.displayName || f.username}</p>
                    <p className="text-[#a8a8a8] text-sm truncate">@{f.username}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
