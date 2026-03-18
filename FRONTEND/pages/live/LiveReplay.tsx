import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

const API_BASE = getApiBase();

type ReplayProduct = {
  id: string;
  liveDiscountPercent?: number | null;
  isPinned?: boolean;
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    images?: string[] | null;
  };
};

type Replay = {
  id: string;
  title: string;
  description?: string | null;
  recording?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  account?: { id: string; username: string; displayName?: string | null; profilePhoto?: string | null };
  liveProducts: ReplayProduct[];
};

export default function LiveReplay() {
  const { liveId } = useParams();
  const [replay, setReplay] = useState<Replay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveId) return;
    setLoading(true);
    setError(null);
    const token = getToken();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API_BASE}/live/${liveId}/replay`, { headers })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(data.error || 'Failed to load replay.');
        }
        return data as Replay;
      })
      .then((data) => {
        setReplay(data);
      })
      .catch((e: any) => setError(e.message || 'Failed to load replay.'))
      .finally(() => setLoading(false));
  }, [liveId]);

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <header className="flex items-center justify-between px-4 py-3 border-b border-moxe-border">
        <Link to="/live" className="text-moxe-text text-2xl leading-none" aria-label="Back">
          ←
        </Link>
        <ThemedText className="font-semibold text-moxe-body">Live replay</ThemedText>
        <div className="w-6" />
      </header>

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4 max-w-5xl mx-auto">
        {loading && <ThemedText secondary>Loading replay…</ThemedText>}
        {error && !loading && <ThemedText className="text-moxe-danger">{error}</ThemedText>}

        {!loading && !error && replay && (
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
            <div className="space-y-3">
              <div className="aspect-video bg-black rounded-moxe-lg overflow-hidden flex items-center justify-center relative">
                {replay.recording ? (
                  <video
                    key={replay.recording}
                    src={replay.recording}
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <ThemedText secondary className="text-center px-4">
                    Replay recording is not available for this live.
                  </ThemedText>
                )}
                {replay.liveProducts.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/90 to-transparent flex gap-2 overflow-x-auto no-scrollbar">
                    {replay.liveProducts.map((lp) => {
                      const p = lp.product;
                      const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                      const hasDiscount = lp.liveDiscountPercent != null && lp.liveDiscountPercent > 0;
                      const discountedPrice = hasDiscount ? p.price * (1 - (lp.liveDiscountPercent ?? 0) / 100) : p.price;
                      return (
                        <button
                          key={lp.id}
                          type="button"
                          onClick={() => window.location.href = '/commerce'}
                          className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-white/30 bg-moxe-surface hover:border-white/60 transition-colors"
                        >
                          {image ? (
                            <img src={image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-moxe-textSecondary">No image</div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-1 py-0.5 text-[10px] text-white font-medium truncate">
                            ${discountedPrice.toFixed(2)}
                            {lp.isPinned && ' 📌'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <ThemedText className="text-lg font-semibold text-moxe-body">
                  {replay.title}
                </ThemedText>
                {replay.account && (
                  <ThemedText secondary className="text-sm">
                    Hosted by @{replay.account.username}
                  </ThemedText>
                )}
                {replay.endedAt && (
                  <ThemedText secondary className="text-xs mt-1">
                    Ended {new Date(replay.endedAt).toLocaleString()}
                  </ThemedText>
                )}
                {replay.description && (
                  <ThemedText secondary className="text-sm mt-2">
                    {replay.description}
                  </ThemedText>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <ThemedText className="font-semibold text-moxe-body">
                Products from this live
              </ThemedText>
              {replay.liveProducts.length === 0 && (
                <ThemedText secondary className="text-sm">
                  No products were attached to this live.
                </ThemedText>
              )}
              {replay.liveProducts.length > 0 && (
                <ul className="space-y-2">
                  {replay.liveProducts.map((lp) => {
                    const p = lp.product;
                    const hasDiscount =
                      lp.liveDiscountPercent != null && lp.liveDiscountPercent > 0;
                    const discountedPrice = hasDiscount
                      ? p.price * (1 - (lp.liveDiscountPercent ?? 0) / 100)
                      : p.price;
                    const image = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
                    return (
                      <li
                        key={lp.id}
                        className="flex items-center gap-3 p-3 rounded-moxe-md border border-moxe-border bg-moxe-surface"
                      >
                        <div className="w-14 h-14 rounded-moxe-md bg-moxe-background overflow-hidden flex-shrink-0">
                          {image ? (
                            <img
                              src={image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-moxe-textSecondary">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <ThemedText className="text-sm font-medium truncate">
                            {p.name}
                          </ThemedText>
                          <div className="text-xs text-moxe-caption mt-0.5 flex items-center gap-2">
                            <span className="font-semibold text-moxe-body">
                              ${discountedPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <>
                                <span className="line-through text-moxe-textSecondary">
                                  ${p.price.toFixed(2)}
                                </span>
                                <span className="text-emerald-400">
                                  -{lp.liveDiscountPercent}% live
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <ThemedButton
                          label="View in shop"
                          onClick={() => {
                            window.location.href = '/commerce';
                          }}
                          className="px-3 py-1 text-xs"
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </ThemedView>
  );
}

