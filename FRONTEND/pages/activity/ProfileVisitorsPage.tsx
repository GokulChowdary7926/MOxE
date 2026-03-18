import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Avatar } from '../../components/ui/Avatar';
import { getApiBase, getToken } from '../../services/api';

type Visitor = {
  viewerId: string;
  username: string;
  displayName?: string | null;
  profilePhoto?: string | null;
  viewedAt: string;
  viewCount: number;
};

export default function ProfileVisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError('You must be logged in.');
      setLoading(false);
      return;
    }
    fetch(`${getApiBase()}/accounts/me/profile-visitors`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.visitors) {
          setVisitors(data.visitors);
        } else if (data.error || data.message) {
          setError(data.error || data.message);
        }
      })
      .catch((e) => setError(e.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SettingsPageShell title="Profile visitors" backTo="/activity">
      <div className="px-4 py-3">
        <p className="text-[#a8a8a8] text-sm mb-4">
          People who have viewed your profile in the last 30 days. This is a Star tier feature.
        </p>
        {loading && <p className="text-[#737373] text-sm">Loading…</p>}
        {error && !loading && (
          <div className="rounded-xl bg-[#262626] border border-[#363636] p-4">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-[#a8a8a8] text-xs mt-2">Upgrade to Star to see who viewed your profile.</p>
            <Link to="/settings/subscription" className="text-[#0095f6] text-sm font-medium mt-2 inline-block">View subscription</Link>
          </div>
        )}
        {!loading && !error && visitors.length === 0 && (
          <p className="text-[#737373] text-sm">No profile visitors in the last 30 days.</p>
        )}
        {!loading && !error && visitors.length > 0 && (
          <ul className="space-y-2">
            {visitors.map((v) => (
              <li key={v.viewerId} className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] border border-[#363636]">
                <Link to={`/profile/${encodeURIComponent(v.username)}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar uri={v.profilePhoto ?? undefined} size={44} />
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{v.displayName || v.username}</p>
                    <p className="text-[#a8a8a8] text-xs">@{v.username}</p>
                    <p className="text-[#737373] text-xs mt-0.5">
                      Viewed {v.viewCount} time{v.viewCount !== 1 ? 's' : ''} · Last {new Date(v.viewedAt).toLocaleDateString()}
                    </p>
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
