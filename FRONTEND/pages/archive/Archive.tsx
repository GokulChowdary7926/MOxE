import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Play } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { UI } from '../../constants/uiTheme';
import { getApiBase, getToken } from '../../services/api';
import { getFirstMediaUrl, isVideoMediaUrl } from '../../utils/mediaUtils';
import { MediaGridThumb } from '../../components/media/MediaGridThumb';

type ArchiveItem = {
  id: string;
  thumbUrl: string;
  isVideo: boolean;
};

export default function Archive() {
  const navigate = useNavigate();
  const [selectMode, setSelectMode] = useState(false);
  const [sortBy] = useState('newest');
  const [dateRange] = useState('all');
  const [contentType] = useState('all');
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [storyItems, setStoryItems] = useState<ArchiveItem[]>([]);
  const [archiveTab, setArchiveTab] = useState<'posts' | 'stories'>('posts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = getToken();
      if (!token) {
        setError('You must be logged in to view archive.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/posts/archived?limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to load archive.');
          setItems([]);
          return;
        }
        const list = (data.items ?? data) as any[];
        const mapped: ArchiveItem[] = (Array.isArray(list) ? list : []).map((p: any) => ({
          id: p.id,
          thumbUrl: getFirstMediaUrl(p) || (p.mediaUrl ?? ''),
          isVideo: p.mediaType === 'VIDEO' || (Array.isArray(p.media) ? (p.media as any[])[0] : null)?.type === 'video',
        })).filter((i) => i.thumbUrl);
        setItems(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load archive.');
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (archiveTab !== 'stories') return;
    let cancelled = false;
    async function loadStories() {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${getApiBase()}/archive`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to load story archive.');
          setStoryItems([]);
          return;
        }
        const list = (data.items ?? data) as any[];
        const mapped: ArchiveItem[] = (Array.isArray(list) ? list : []).map((s: any) => {
          const media = s.media as any;
          const url = getFirstMediaUrl(s) || (typeof media === 'object' && media != null && 'url' in media ? String((media as { url: string }).url) : '');
          return {
            id: s.id || s.storyId,
            thumbUrl: url || '',
            isVideo: s.type === 'VIDEO' || (media?.type === 'video'),
          };
        }).filter((i) => i.thumbUrl);
        setStoryItems(mapped);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load story archive.');
          setStoryItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadStories();
    return () => { cancelled = true; };
  }, [archiveTab]);

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/profile" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Archive</span>
        <div className="min-w-[80px] flex justify-end">
          <button type="button" onClick={() => setSelectMode((v) => !v)} className={UI.headerAction}>
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto pb-20">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262626]">
          <button
            type="button"
            onClick={() => setArchiveTab('posts')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${archiveTab === 'posts' ? 'bg-[#262626] text-white border border-[#363636]' : 'text-[#a8a8a8]'}`}
          >
            Posts
          </button>
          <button
            type="button"
            onClick={() => setArchiveTab('stories')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${archiveTab === 'stories' ? 'bg-[#262626] text-white border border-[#363636]' : 'text-[#a8a8a8]'}`}
          >
            Stories
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar border-b border-[#262626]">
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
          >
            {sortBy === 'newest' ? 'Newest to oldest' : 'Oldest to newest'}
            <ChevronDown className="w-4 h-4 text-[#a8a8a8] ml-0.5" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
          >
            {dateRange === 'all' ? 'All dates' : dateRange}
            <ChevronDown className="w-4 h-4 text-[#a8a8a8] ml-0.5" />
          </button>
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
          >
            {contentType === 'all' ? 'All content types' : contentType}
            <ChevronDown className="w-4 h-4 text-[#a8a8a8] ml-0.5" />
          </button>
        </div>

        {loading ? (
          <div className="px-4 py-8">
            <ThemedText secondary className="text-sm">Loading…</ThemedText>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        ) : archiveTab === 'stories' ? (
          storyItems.length === 0 ? (
            <EmptyState
              title="No archived stories"
              message="Stories you save to archive will appear here. Enable story archive in settings."
            />
          ) : (
            <div className={UI.grid2}>
              {storyItems.map((item) => (
                <div key={item.id} className="text-left block">
                  <div className={`${UI.gridItem} relative`}>
                    <MediaGridThumb url={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                    {(item.isVideo || isVideoMediaUrl(item.thumbUrl)) && (
                      <span className={UI.gridItemPlayIcon}>
                        <Play className="w-3 h-3 text-white fill-white" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : items.length === 0 ? (
          <EmptyState
            title="No archived posts"
            message="Posts you archive from your profile will appear here. Only you can see your archive."
          />
        ) : (
          <div className={UI.grid2}>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className="text-left block"
                onClick={() => navigate(`/post/${item.id}`)}
              >
                <div className={`${UI.gridItem} relative`}>
                  <MediaGridThumb url={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                  {(item.isVideo || isVideoMediaUrl(item.thumbUrl)) && (
                    <span className={UI.gridItemPlayIcon}>
                      <Play className="w-3 h-3 text-white fill-white" />
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
