import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Play } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { UI } from '../../constants/uiTheme';
import { mockPosts } from '../../mocks/posts';

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

  const items: ArchiveItem[] = mockPosts.slice(0, 12).map((p) => ({
    id: p.id,
    thumbUrl: p.media?.[0]?.url ?? '',
    isVideo: false,
  })).filter((i) => i.thumbUrl);

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

        {items.length === 0 ? (
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
                  <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                  <span className={UI.gridItemPlayIcon}>
                    <Play className="w-3 h-3 text-white fill-white" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ThemedView>
  );
}
