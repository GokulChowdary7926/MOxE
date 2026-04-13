import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import LeafletMap from '../../components/map/LeafletMap';
import { getFirstMediaUrl, ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { getApiBase, getToken } from '../../services/api';

const FALLBACK_CENTER: [number, number] = [37.7749, -122.4194];

type PostRow = {
  id: string;
  media?: unknown[] | null;
  mediaUrl?: string;
  caption?: string | null;
  location?: string | null;
};

export default function LocationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const placeName = useMemo(() => {
    const raw = id || '';
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [id]);

  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placeName.trim()) {
      setPosts([]);
      setLoading(false);
      return;
    }
    const token = getToken();
    if (!token) {
      setPosts([]);
      setError('Sign in to see posts at this location.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${getApiBase()}/location/posts?q=${encodeURIComponent(placeName)}&limit=40`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Could not load posts (${r.status})`))))
      .then((data: { posts?: PostRow[] }) => {
        if (!cancelled) setPosts(Array.isArray(data.posts) ? data.posts : []);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load');
          setPosts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [placeName]);

  if (!placeName.trim()) {
    return (
      <PageLayout title="Location" backTo="/explore" className="bg-black">
        <EmptyState title="Invalid location" message="No place selected." />
      </PageLayout>
    );
  }

  const mapCenter = FALLBACK_CENTER;

  return (
    <PageLayout title={placeName} backTo="/explore" className="bg-black">
      <div className="py-4">
        {error ? (
          <p className="mb-3 text-sm text-moxe-textSecondary">{error}</p>
        ) : null}
        <div className="mb-4 overflow-hidden rounded-xl border border-moxe-border h-52">
          <LeafletMap
            center={mapCenter}
            zoom={12}
            markers={[{ position: mapCenter, label: placeName }]}
            className="w-full h-full min-h-[208px] rounded-xl"
          />
        </div>
        <div className="mb-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-moxe-md bg-moxe-surface overflow-hidden flex-shrink-0">
            <img src="/logo.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <ThemedText className="text-moxe-title font-semibold">{placeName}</ThemedText>
            <ThemedText secondary className="text-moxe-body">
              Posts from MOxE with this location tag
            </ThemedText>
          </div>
        </div>
        {loading ? (
          <ThemedText secondary className="text-moxe-body">
            Loading…
          </ThemedText>
        ) : posts.length === 0 ? (
          <EmptyState title="No posts here yet" message={`No public posts tagged at ${placeName}.`} />
        ) : (
          <div className="grid grid-cols-3 gap-[2px]">
            {posts.map((p) => {
              const thumb = ensureAbsoluteMediaUrl(getFirstMediaUrl(p));
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
