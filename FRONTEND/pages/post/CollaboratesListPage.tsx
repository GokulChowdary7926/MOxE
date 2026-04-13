import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';

type AccountLite = {
  id: string;
  username: string;
  displayName: string | null;
  profilePhoto: string | null;
};

export default function CollaboratesListPage() {
  const { postId, reelId } = useParams();
  const backTo = postId ? `/post/${postId}` : reelId ? `/reels` : '/';
  const [collabs, setCollabs] = useState<AccountLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!postId && !reelId) {
        setCollabs([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        if (postId) {
          const res = await fetch(`${getApiBase()}/posts/${encodeURIComponent(postId)}`, { headers });
          if (!res.ok) {
            setCollabs([]);
            setError(await readApiError(res).catch(() => 'Could not load post'));
            return;
          }
          const p = (await res.json()) as {
            account?: { id: string };
            coAuthor?: AccountLite | null;
            brandedContentBrand?: AccountLite | null;
            mentions?: { account: AccountLite }[];
          };
          const authorId = p.account?.id;
          const list: AccountLite[] = [];
          const seen = new Set<string>();
          const add = (a: AccountLite | null | undefined) => {
            if (!a || !a.id || a.id === authorId) return;
            if (seen.has(a.id)) return;
            seen.add(a.id);
            list.push(a);
          };
          add(p.coAuthor ?? undefined);
          add(p.brandedContentBrand ?? undefined);
          for (const m of p.mentions || []) add(m.account);
          if (!cancelled) setCollabs(list);
        } else if (reelId) {
          const res = await fetch(`${getApiBase()}/reels/${encodeURIComponent(reelId)}/collaborators`, { headers });
          if (!res.ok) {
            setCollabs([]);
            setError(await readApiError(res).catch(() => 'Could not load collaborators'));
            return;
          }
          const data = (await res.json()) as { collaborators?: AccountLite[] };
          if (!cancelled) setCollabs(Array.isArray(data.collaborators) ? data.collaborators : []);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setCollabs([]);
          setError(e instanceof Error ? e.message : 'Could not load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [postId, reelId]);

  return (
    <SettingsPageShell title="Collaborators" backTo={backTo}>
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        People tagged or in a paid partnership with this content.
      </p>
      {loading && <p className="px-4 text-[#737373] text-sm">Loading…</p>}
      {error && !loading && <p className="px-4 text-[#a8a8a8] text-sm">{error}</p>}
      {!loading && !error && collabs.length === 0 && (
        <p className="px-4 text-[#737373] text-sm">No collaborators on this content.</p>
      )}
      <div className="border-t border-[#262626]">
        {!loading &&
          !error &&
          collabs.map((c) => (
            <Link
              key={c.id}
              to={`/profile/${c.username}`}
              className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
            >
              <Avatar uri={c.profilePhoto} size={44} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{c.username}</p>
                <p className="text-[#a8a8a8] text-sm truncate">{c.displayName || ' '}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          ))}
      </div>
    </SettingsPageShell>
  );
}
