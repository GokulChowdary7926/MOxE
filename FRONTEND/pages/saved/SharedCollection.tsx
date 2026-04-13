import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText } from '../../components/ui/Themed';
import { FeedPost } from '../../components/ui/FeedPost';
import { getApiBase } from '../../services/api';
import { fetchClientSettings, type ClientSettingsData } from '../../services/clientSettings';

const API_BASE = getApiBase();

type SharedCollectionPost = {
  id: string;
  caption: string | null;
  location: string | null;
  media: { url: string }[] | any;
  account?: { id?: string; username: string; displayName?: string | null; profilePhoto?: string | null };
  username?: string;
  accountId?: string;
  allowComments?: boolean;
  _count?: { likes: number; comments: number };
};

export default function SharedCollection() {
  const { token } = useParams();
  const [name, setName] = useState<string | null>(null);
  const [posts, setPosts] = useState<SharedCollectionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideEngagementCounts, setHideEngagementCounts] = useState(false);

  const refreshCountVisibility = useCallback(() => {
    void fetchClientSettings()
      .then((settings) => {
        setHideEngagementCounts(!!settings.socialCounts?.hideLikeAndShareCounts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCountVisibility();
  }, [refreshCountVisibility]);

  useEffect(() => {
    const onFocus = () => refreshCountVisibility();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshCountVisibility]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/collections/shared/${encodeURIComponent(token ?? '')}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Collection not found.');
        }
        if (cancelled) return;
        setName(data.name ?? null);
        const rows: { post?: SharedCollectionPost }[] = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.posts)
            ? data.posts
            : [];
        const normalized: SharedCollectionPost[] = rows.map((row) => {
          const p = (row.post ?? row) as SharedCollectionPost;
          const acc =
            p.account ??
            (p.username || p.accountId
              ? {
                  id: p.accountId,
                  username: p.username ?? 'user',
                  displayName: (p as { displayName?: string | null }).displayName ?? null,
                  profilePhoto: (p as { profilePhoto?: string | null }).profilePhoto ?? null,
                }
              : { username: 'user' });
          return { ...p, account: acc };
        });
        setPosts(normalized);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Failed to load collection.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title={name ? `Collection · ${name}` : 'Shared collection'}
        left={
          <Link to="/" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-3">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading collection…
          </ThemedText>
        )}
        {error && !loading && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}
        {!loading && !error && posts.length === 0 && (
          <ThemedText secondary className="text-moxe-caption">
            No posts in this collection yet.
          </ThemedText>
        )}
        {!loading &&
          !error &&
          posts.map((p) => {
            const mediaArray = Array.isArray(p.media) ? p.media : [];
            const mediaUrl = mediaArray[0]?.url ?? '';
            const acc = p.account ?? { username: p.username ?? 'user' };
            return (
              <FeedPost
                key={p.id}
                id={p.id}
                authorAccountId={acc.id ?? p.accountId}
                author={{
                  username: acc.username,
                  displayName: acc.displayName ?? undefined,
                  avatarUri: acc.profilePhoto ?? undefined,
                }}
                location={p.location ?? undefined}
                mediaUris={mediaUrl ? [mediaUrl] : []}
                caption={p.caption ?? undefined}
                likeCount={p._count?.likes ?? 0}
                commentCount={p._count?.comments ?? 0}
                hideEngagementCounts={hideEngagementCounts}
                isLiked={false}
                isSaved={false}
                allowComments={p.allowComments !== false}
              />
            );
          })}
      </div>
    </ThemedView>
  );
}

