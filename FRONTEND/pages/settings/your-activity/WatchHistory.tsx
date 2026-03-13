import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, ChevronLeft, ChevronDown } from 'lucide-react';
import { ThemedView } from '../../../components/ui/Themed';
import { UI } from '../../../constants/uiTheme';
import { mockReels } from '../../../mocks/reels';
import { mockPosts } from '../../../mocks/posts';

type WatchItem = {
  id: string;
  thumbUrl: string;
  viewCount?: number;
  isReel: boolean;
};

export default function WatchHistory() {
  const navigate = useNavigate();
  const [selectMode, setSelectMode] = useState(false);
  const [sortBy] = useState('newest');
  const [dateRange] = useState('all');
  const [contentType] = useState('all');

  const items: WatchItem[] = [
    ...mockReels.slice(0, 4).map((r) => ({
      id: r.id,
      thumbUrl: r.videoUrl,
      viewCount: r.likeCount,
      isReel: true,
    })),
    ...mockPosts.slice(0, 5).map((p) => ({
      id: p.id,
      thumbUrl: p.media[0]?.url ?? '',
      viewCount: p.likeCount,
      isReel: false,
    })),
  ].filter((i) => i.thumbUrl);

  function formatCount(n: number) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)} M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
    return String(n);
  }

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <header className={`${UI.header} flex-shrink-0`}>
        <Link to="/activity" className={UI.headerBack} aria-label="Back">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <span className={UI.headerTitle}>Watch history</span>
        <div className="min-w-[80px] flex justify-end">
          <button type="button" onClick={() => setSelectMode((v) => !v)} className={UI.headerAction}>
            {selectMode ? 'Cancel' : 'Select'}
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto pb-20">
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

        <p className="text-[#a8a8a8] text-sm px-4 py-3">
          Reels and posts you&apos;ve recently watched.
        </p>

        <div className={UI.grid3}>
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="relative block"
              onClick={() => navigate(item.isReel ? '/reels' : `/post/${item.id}`)}
              aria-label={item.isReel ? `Open reel ${item.id}` : `Open post ${item.id}`}
            >
              <div className={`${UI.gridItem} relative`}>
                {item.isReel ? (
                  <video
                    src={item.thumbUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                    onMouseLeave={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  />
                ) : (
                  <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                )}
                {item.isReel && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Play className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" />
                  </span>
                )}
                {item.viewCount != null && item.viewCount > 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-left text-[11px] text-white font-medium">
                    {formatCount(item.viewCount)}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </ThemedView>
  );
}
