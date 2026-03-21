import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { getApiBase, getToken } from '../../services/api';
import { normalizeToArray } from '../../utils/safeAccess';
import { getFirstMediaUrl } from '../../utils/mediaUtils';

type ExploreItem = {
  id: string;
  thumbUrl: string;
  screenshotProtection?: boolean;
  viewCount?: number;
};

export default function Explore() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ExploreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const token = getToken();
      const API_BASE = getApiBase();

      const mapToItems = (list: any[]): ExploreItem[] =>
        list.map((p: any) => ({
          id: p.id,
          thumbUrl: getFirstMediaUrl(p) || (p.mediaUrl ?? p.thumbUrl ?? ''),
          screenshotProtection: !!p.screenshotProtection,
          viewCount: p.viewCount ?? p.likeCount ?? 0,
        })).filter((i) => i.thumbUrl);

      try {
        if (token) {
          let list: any[] = [];
          const rankingRes = await fetch(`${API_BASE}/ranking/explore`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (rankingRes.ok) {
            const rankingData = await rankingRes.json().catch(() => ({}));
            list = normalizeToArray(rankingData.items ?? rankingData);
          }
          if (cancelled) return;
          if (list.length > 0) {
            setItems(mapToItems(list));
            return;
          }
          const feedRes = await fetch(`${API_BASE}/posts/feed`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const feedData = await feedRes.json().catch(() => ({}));
          if (cancelled) return;
          if (feedRes.ok) {
            const feedList = normalizeToArray(feedData.items ?? feedData.feed ?? feedData);
            setItems(mapToItems(feedList));
          } else {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load explore.');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
      <div className="pt-2 pb-1 px-3">
        {/* Search with Meta AI bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A8A8]" />
          <input
            type="text"
            placeholder="Search with Meta AI"
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-[#262626] text-[13px] text-white placeholder-[#A8A8A8] border border-[#363636] focus:outline-none focus:border-[#A8A8A8]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <ThemedText secondary className="text-moxe-caption">
              Loading…
            </ThemedText>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <ThemedText secondary className="text-moxe-caption text-center">
              {error}
            </ThemedText>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-3 gap-[2px]">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="aspect-square bg-black overflow-hidden relative"
                onClick={() => navigate(`/post/${item.id}`)}
              >
                <img
                  src={item.thumbUrl}
                  alt=""
                  className="w-full h-full object-cover select-none"
                  onContextMenu={(e) => {
                    if (item.screenshotProtection) e.preventDefault();
                  }}
                />
                {item.viewCount != null && item.viewCount > 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 py-1 text-left text-[11px] text-white font-medium">
                    {(() => {
                      const n = item.viewCount as number;
                      if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
                      if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
                      return String(n);
                    })()}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      </MobileShell>
    </ThemedView>
  );
}
