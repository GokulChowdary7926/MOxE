import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { mockPosts } from '../../mocks/posts';
import { mockHashtags } from '../../mocks/hashtags';

export default function HashtagPage() {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();
  const tagName = tag ? `#${tag.replace(/^#/, '')}` : '';
  const hashtagMeta = useMemo(
    () => mockHashtags.find((h) => h.tag.toLowerCase() === (tag ?? '').toLowerCase()),
    [tag],
  );
  const posts = useMemo(
    () =>
      mockPosts.filter((p) =>
        (p.caption ?? '')
          .toLowerCase()
          .includes((tag ?? '').toLowerCase()),
      ),
    [tag],
  );

  const postCount = hashtagMeta?.postCount ?? posts.length;

  return (
    <PageLayout title={tagName || 'Hashtag'} backTo="/explore">
      <div className="py-4">
        <div className="mb-4">
          <ThemedText className="text-moxe-title font-semibold">{tagName}</ThemedText>
          <ThemedText secondary className="text-moxe-body">
            {postCount.toLocaleString()} posts
          </ThemedText>
        </div>
        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            message={`No posts with ${tagName}. Be the first to use this hashtag.`}
          />
        ) : (
          <div className="grid grid-cols-3 gap-[2px]">
            {posts.map((p) => {
              const thumb = p.media[0]?.url ?? '';
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
