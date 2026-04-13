import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { getFirstMediaUrl } from '../../utils/mediaUtils';
import { fetchApiJson } from '../../services/api';

type HashtagPostsResponse = {
  hashtag: { name: string; postCount: number } | null;
  posts: Array<{ id: string; media?: unknown[] | null; caption?: string | null; mediaUrl?: string }>;
};

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const clean = (tag ?? '').replace(/^#/, '').trim();
  const tagDisplay = clean ? `#${clean}` : '';
  const [posts, setPosts] = useState<HashtagPostsResponse['posts']>([]);
  const [postCount, setPostCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clean) {
      setPosts([]);
      setPostCount(0);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApiJson<HashtagPostsResponse>(
          `explore/hashtag/${encodeURIComponent(clean)}/posts?limit=40`,
        );
        if (cancelled) return;
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setPostCount(data.hashtag?.postCount ?? (Array.isArray(data.posts) ? data.posts.length : 0));
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load hashtag.');
          setPosts([]);
          setPostCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clean]);

  return (
    <PageLayout title={tagDisplay || 'Hashtag'} backTo="/explore">
      <div className="py-4">
        <div className="mb-4">
          <ThemedText className="text-moxe-title font-semibold">{tagDisplay || 'Hashtag'}</ThemedText>
          <ThemedText secondary className="text-moxe-body">
            {!loading && !error ? `${postCount.toLocaleString()} posts` : loading ? 'Loading…' : ''}
          </ThemedText>
        </div>
        {error ? (
          <EmptyState title="Couldn’t load hashtag" message={error} />
        ) : loading ? (
          <p className="text-moxe-textSecondary text-sm text-center py-12">Loading…</p>
        ) : posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            message={
              tagDisplay
                ? `No posts with ${tagDisplay}. Be the first to use this hashtag.`
                : 'Invalid tag.'
            }
          />
        ) : (
          <div className="grid grid-cols-3 gap-[2px]">
            {posts.map((p) => {
              const thumb = getFirstMediaUrl(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  className="aspect-square bg-moxe-surface overflow-hidden"
                  onClick={() => navigate(`/post/${p.id}`)}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-moxe-background" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
