import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, Play } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

export default function NotInterestedPage() {
  const [items] = useState<{ id: string; thumbUrl: string; isVideo?: boolean }[]>([]);

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Not interested</span>
          <button type="button" className={UI.headerAction}>Select</button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto border-b border-[#262626] flex-wrap">
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              Newest to oldest <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
            <span className="text-[#737373] text-xs">Remove multiple photos and reels.</span>
          </div>
          <p className="text-[#a8a8a8] text-sm px-4 py-3">
            These are posts that you said you weren&apos;t interested in. When you remove a post from this list, you may see more suggested posts like it on MOxE.
          </p>
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No posts marked as not interested.</div>
          ) : (
            <div className={UI.grid2}>
              {items.map((item) => (
                <Link key={item.id} to={`/post/${item.id}`} className="relative block">
                  <div className={`${UI.gridItem} relative`}>
                    <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                    {item.isVideo && (
                      <span className={UI.gridItemPlayIcon}>
                        <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
