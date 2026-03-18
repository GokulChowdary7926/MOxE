import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Check } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { UI } from '../../constants/uiTheme';
import { fetchApi, getToken } from '../../services/api';

type SearchUser = {
  id: string;
  username: string;
  displayName?: string | null;
  profilePhoto?: string | null;
};

export default function CloseFriendsAdd() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchUsers = useCallback(async (q: string) => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: 'users' });
      if (q.trim()) params.set('q', q.trim());
      const res = await fetchApi(`explore/search?${params.toString()}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUsers([]);
        return;
      }
      const list = (data.users ?? []) as any[];
      setUsers(list.map((u: any) => ({
        id: u.id,
        username: u.username ?? '',
        displayName: u.displayName ?? null,
        profilePhoto: u.profilePhoto ?? null,
      })));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 300);
    return () => clearTimeout(t);
  }, [query, searchUsers]);

  function toggle(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleDone() {
    if (selectedIds.size === 0) {
      navigate('/close-friends');
      return;
    }
    if (!getToken()) return;
    setSubmitting(true);
    try {
      for (const friendId of selectedIds) {
        const res = await fetchApi('close-friends', {
          method: 'POST',
          body: JSON.stringify({ friendId }),
        });
        if (!res.ok) break;
      }
      navigate('/close-friends');
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/close-friends" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Add to Close Friends</span>
        <div className="min-w-[80px]" />
      </header>

      <div className="flex-1 overflow-auto pb-24">
        <div className="px-4 py-3 rounded-none bg-[#262626] border-y border-[#363636]">
          <p className="text-[#a8a8a8] text-sm">
            Only people on your list can see when you post to close friends.{' '}
            <button type="button" className="text-[#0095f6] font-medium">
              How it works
            </button>
          </p>
        </div>

        <div className="relative px-4 py-3">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm focus:outline-none focus:ring-1 focus:ring-[#0095f6]"
            aria-label="Search users"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-2">
          <span className="text-[#a8a8a8] text-sm">{users.length} people</span>
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[#0095f6] text-sm font-semibold"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden divide-y divide-[#363636] mx-4">
          {loading ? (
            <div className="px-4 py-6">
              <ThemedText secondary className="text-sm">Searching…</ThemedText>
            </div>
          ) : users.length === 0 ? (
            <div className="px-4 py-6">
              <ThemedText secondary className="text-sm">
                {query.trim() ? 'No users found. Try a different search.' : 'Type to search for people to add.'}
              </ThemedText>
            </div>
          ) : (
            users.map((user) => {
              const isSelected = selectedIds.has(user.id);
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggle(user.id)}
                  className={`${UI.listRow} w-full flex items-center gap-3 text-left`}
                >
                  <Avatar uri={user.profilePhoto} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{user.username}</p>
                    <p className="text-[#a8a8a8] text-sm truncate">{user.displayName ?? ''}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-[#0095f6] border-[#0095f6]' : 'border-[#363636]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-black border-t border-[#262626] safe-area-pb">
          <button
            type="button"
            onClick={handleDone}
            disabled={submitting}
            className={UI.btnPrimary}
          >
            {submitting ? 'Adding…' : 'Done'}
          </button>
        </div>
      </div>
    </ThemedView>
  );
}
