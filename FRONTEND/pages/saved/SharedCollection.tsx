import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText } from '../../components/ui/Themed';
import { FeedPost } from '../../components/ui/FeedPost';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type SharedCollectionPost = {
  id: string;
  caption: string | null;
  location: string | null;
  media: { url: string }[] | any;
  account: { username: string; displayName?: string | null; profilePhoto?: string | null };
  _count?: { likes: number; comments: number };
};

export default function SharedCollection() {
  const { token } = useParams();
  const [name, setName] = useState<string | null>(null);
  const [posts, setPosts] = useState<SharedCollectionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/collections/shared/${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Collection not found.');
        }
        if (cancelled) return;
        setName(data.name ?? null);
        setPosts(data.posts ?? []);
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
            return (
              <FeedPost
                key={p.id}
                id={p.id}
                author={{
                  username: p.account.username,
                  displayName: p.account.displayName ?? undefined,
                  avatarUri: p.account.profilePhoto ?? undefined,
                }}
                location={p.location ?? undefined}
                mediaUri={mediaUrl}
                caption={p.caption ?? undefined}
                likeCount={p._count?.likes ?? 0}
                commentCount={p._count?.comments ?? 0}
                isLiked={false}
                isSaved={false}
              />
            );
          })}
      </div>
    </ThemedView>
  );
}

