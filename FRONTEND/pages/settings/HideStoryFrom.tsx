import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { Search } from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';

type Person = { id: string; username: string; displayName?: string | null; profilePhoto?: string | null };

export default function HideStoryFrom() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hiddenList, setHiddenList] = useState<Person[]>([]);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const token = getToken();
  const base = getApiBase();

  useEffect(() => {
    if (!token) return;
    fetch(`${base}/privacy/hide-story-from`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setHiddenList(Array.isArray(list) ? list : []))
      .catch(() => setHiddenList([]))
      .finally(() => setLoading(false));
  }, [token, base]);

  useEffect(() => {
    if (!query.trim() || !token) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    fetch(`${base}/explore/search?q=${encodeURIComponent(query.trim())}&type=users&limit=15`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        const users = (data.users ?? []) as Person[];
        const hiddenIds = new Set(hiddenList.map((p) => p.id));
        setSearchResults(users.filter((u) => !hiddenIds.has(u.id)));
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearching(false));
  }, [query, token, base, hiddenList]);

  const addHide = async (accountId: string) => {
    if (!token) return;
    setActingId(accountId);
    try {
      const res = await fetch(`${base}/privacy/hide-story-from`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add');
      }
      const person = searchResults.find((p) => p.id === accountId);
      if (person) setHiddenList((prev) => [...prev, person]);
    } catch {
      // ignore
    } finally {
      setActingId(null);
    }
  };

  const removeHide = async (accountId: string) => {
    if (!token) return;
    setActingId(accountId);
    try {
      const res = await fetch(`${base}/privacy/hide-story-from/${accountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setHiddenList((prev) => prev.filter((p) => p.id !== accountId));
    } catch {
      // ignore
    } finally {
      setActingId(null);
    }
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <Link to="/settings/story-live-location" className="text-[#0095f6] font-semibold text-sm">Cancel</Link>
          <span className="text-white font-semibold text-base">Hide story from</span>
          <button type="button" onClick={() => navigate(-1)} className="text-[#0095f6] font-semibold text-sm">Done</button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-[#a8a8a8] text-sm px-4 py-3">
            Hide all photos and videos you add to your story from specific people. This also hides your live videos.
          </p>
          <div className="relative px-4 py-2">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
            <input
              type="text"
              placeholder="Search to hide your story from someone"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
          </div>

          {query.trim() && (
            <div className="px-4 py-2 border-b border-[#262626]">
              <p className="text-[#737373] text-xs mb-2">Search results</p>
              {searching && <ThemedText secondary className="text-sm">Searching…</ThemedText>}
              {!searching && searchResults.length === 0 && <ThemedText secondary className="text-sm">No accounts found.</ThemedText>}
              {!searching &&
                searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Avatar uri={p.profilePhoto ?? undefined} size={40} />
                      <div>
                        <p className="text-white font-semibold text-sm">{p.displayName || p.username}</p>
                        <p className="text-[#a8a8a8] text-xs">@{p.username}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addHide(p.id)}
                      disabled={actingId === p.id}
                      className="px-3 py-1.5 rounded-lg bg-[#262626] border border-[#363636] text-white text-xs font-medium disabled:opacity-50"
                    >
                      {actingId === p.id ? '…' : 'Hide story'}
                    </button>
                  </div>
                ))}
            </div>
          )}

          <div className="px-4 py-3 space-y-2">
            <p className="text-white font-semibold text-sm">People you hide your story from ({hiddenList.length})</p>
            {loading && <ThemedText secondary className="text-sm">Loading…</ThemedText>}
            {!loading && hiddenList.length === 0 && (
              <ThemedText secondary className="text-sm">No one hidden. Search above to hide your story from specific people.</ThemedText>
            )}
            {!loading &&
              hiddenList.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Avatar uri={p.profilePhoto ?? undefined} size={44} />
                    <div>
                      <p className="text-white font-semibold text-sm">{p.displayName || p.username}</p>
                      <p className="text-[#a8a8a8] text-xs">@{p.username}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHide(p.id)}
                    disabled={actingId === p.id}
                    className="px-3 py-1.5 rounded-lg bg-[#363636] text-[#a8a8a8] text-xs disabled:opacity-50"
                  >
                    {actingId === p.id ? '…' : 'Remove'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
