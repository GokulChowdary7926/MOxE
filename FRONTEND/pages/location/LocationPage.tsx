import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { mockPosts } from '../../mocks/posts';
import { mockPlaces } from '../../mocks/places';

export default function LocationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = useMemo(() => mockPlaces.find((p) => p.id === id), [id]);
  const posts = useMemo(
    () => mockPosts.filter((p) => p.location && place && p.location.toLowerCase().includes(place.name.toLowerCase())),
    [id, place],
  );

  if (!place) {
    return (
      <PageLayout title="Location" backTo="/explore">
        <EmptyState title="Place not found" message="This location may have been removed." />
      </PageLayout>
    );
  }

  return (
    <PageLayout title={place.name} backTo="/explore">
      <div className="py-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-moxe-md bg-moxe-surface overflow-hidden flex-shrink-0">
            <img src={place.imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <ThemedText className="text-moxe-title font-semibold">{place.name}</ThemedText>
            <ThemedText secondary className="text-moxe-body">
              {place.category} · {place.rating} · {place.distanceKm.toFixed(1)} km
            </ThemedText>
          </div>
        </div>
        {posts.length === 0 ? (
          <EmptyState
            title="No posts here yet"
            message={`No posts tagged at ${place.name}.`}
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
