import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getApiBase, getToken } from '../../services/api';

type ThreadPeer = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

type ThreadItem = {
  otherId: string;
  other?: ThreadPeer;
};

export default function MessageSharePage() {
  const { contentType, id } = useParams<{ contentType?: string; id?: string }>();
  const [search, setSearch] = useState('');
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [needsAuth, setNeedsAuth] = useState(() => !getToken());
  const [loading, setLoading] = useState(true);
  const type = contentType || 'post';
  const backTo = id ? `/share/${type}/${id}` : '/share';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) {
        setThreads([]);
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      setNeedsAuth(false);
      setLoading(true);
      try {
        const res = await fetch(`${getApiBase()}/messages/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as {
          threads?: ThreadItem[];
          requests?: ThreadItem[];
        };
        if (cancelled) return;
        const a = Array.isArray(data.threads) ? data.threads : [];
        const b = Array.isArray(data.requests) ? data.requests : [];
        setThreads([...a, ...b]);
      } catch {
        if (!cancelled) setThreads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const o = t.other;
      if (!o) return false;
      return (
        o.username.toLowerCase().includes(q) ||
        (o.displayName && o.displayName.toLowerCase().includes(q))
      );
    });
  }, [threads, search]);

  return (
    <SettingsPageShell title="Share to Message" backTo={backTo}>
      <div className="px-4 py-2 border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
      </div>
      <div className="px-4 py-2">
        <p className="text-[#737373] text-xs font-semibold mb-2">Recent</p>
        {loading && <p className="text-[#737373] text-sm py-4">Loading conversations…</p>}
        {!loading && needsAuth && <p className="text-[#a8a8a8] text-sm py-4">Sign in to see your chats.</p>}
        {!loading &&
          !needsAuth &&
          filtered.length === 0 &&
          (threads.length === 0 ? (
            <p className="text-[#737373] text-sm py-4">No conversations yet. Start a chat from Messages.</p>
          ) : (
            <p className="text-[#737373] text-sm py-4">No matches.</p>
          ))}
        {!loading &&
          !needsAuth &&
          filtered.map((t) => {
            const o = t.other;
            if (!o) return null;
            const label = o.displayName?.trim() || o.username;
            return (
              <Link
                key={t.otherId}
                to={`/messages/${t.otherId}`}
                className="flex items-center gap-3 py-3 border-b border-[#262626] text-white active:bg-white/5"
              >
                <Avatar uri={o.profilePhoto} size={44} />
                <span className="flex-1 font-medium">{label}</span>
                <span className="text-[#737373] text-sm">@{o.username}</span>
              </Link>
            );
          })}
      </div>
    </SettingsPageShell>
  );
}
