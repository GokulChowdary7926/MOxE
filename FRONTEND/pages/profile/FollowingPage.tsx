import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Avatar } from '../../components/ui/Avatar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Following = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

export default function FollowingPage() {
  const { username } = useParams<{ username: string }>();
  const currentAccount = useCurrentAccount() as { username?: string } | null;
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwn = Boolean(username && currentAccount?.username === username);
  const backTo = username ? `/profile/${username}` : '/profile';

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${API_BASE}/follow/following/by/${encodeURIComponent(username)}`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setFollowing(Array.isArray(data?.following) ? data.following : []);
      })
      .catch(() => setFollowing([]))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <SettingsPageShell title="Following" backTo={backTo}>
      <div className="px-4 py-4">
        {loading ? (
          <p className="text-[#a8a8a8] text-sm">Loading…</p>
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
