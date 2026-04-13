import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, UserPlus } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken } from '../../services/api';

/**
 * Tag people – search users and select to mention in post. Passes mentionedUserIds back via location state.
 */
export default function ReelTagPeoplePage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { mentionedUserIds?: string[] } };
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; username: string; displayName?: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<{ id: string; username: string }[]>(() => {
    const ids = location.state?.mentionedUserIds;
    if (!Array.isArray(ids)) return [];
    return ids.map((id) => ({ id, username: '' }));
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = getToken();
    if (!t) return;
    setLoading(true);
    const abort = new AbortController();
    fetch(`${getApiBase()}/explore/search?q=${encodeURIComponent(query.trim())}&type=users`, {
      headers: { Authorization: `Bearer ${t}` },
      signal: abort.signal,
    })
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((data) => setResults(Array.isArray(data?.users) ? data.users : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
    return () => abort.abort();
  }, [query]);

  const add = (user: { id: string; username: string }) => {
    if (selected.some((s) => s.id === user.id)) return;
    setSelected((prev) => [...prev, { id: user.id, username: user.username }].slice(0, 20));
  };
  const remove = (id: string) => setSelected((prev) => prev.filter((s) => s.id !== id));

  const onDone = () => {
    navigate('..', {
      relative: 'path',
      replace: true,
      state: {
        mentionedUserIds: selected.map((s) => s.id),
        files: (location.state as { files?: File[] })?.files,
      },
    });
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-base">Tag people</span>
          <button type="button" onClick={onDone} className="text-[#0095f6] font-semibold text-sm">
            Done
          </button>
        </header>

        <div className="p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people to tag"
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#262626] text-white placeholder:text-[#737373] text-sm border border-[#363636] outline-none"
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selected.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#0095f6]/20 text-[#0095f6] text-sm"
                >
                  @{s.username || s.id.slice(0, 8)}
                  <button type="button" onClick={() => remove(s.id)} className="ml-0.5 text-white/80 hover:text-white" aria-label="Remove">×</button>
                </span>
              ))}
            </div>
          )}

          {loading && <ThemedText className="text-[#737373] text-sm py-2">Searching…</ThemedText>}
          {!loading && query.trim() && results.length === 0 && <ThemedText className="text-[#737373] text-sm py-2">No accounts found.</ThemedText>}
          <div className="space-y-1">
            {results.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => add(u)}
                disabled={selected.some((s) => s.id === u.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#262626] text-left text-white disabled:opacity-50"
              >
                <UserPlus className="w-5 h-5 text-[#737373] flex-shrink-0" />
                <span className="flex-1 font-medium">@{u.username}</span>
                {u.displayName && <span className="text-[#737373] text-sm truncate max-w-[120px]">{u.displayName}</span>}
                {selected.some((s) => s.id === u.id) && <span className="text-[#0095f6] text-xs">Added</span>}
              </button>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
