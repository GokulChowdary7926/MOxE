import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

export default function LikesActivityPage() {
  const items: { id: string; thumbUrl: string }[] = [];

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Likes</span>
          <button type="button" className={UI.headerAction}>Select</button>
        </header>
        <div className="flex-1 overflow-auto pb-20">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#262626]">
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              Newest to oldest <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              All dates <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No likes yet.</div>
          ) : (
            <div className={UI.grid3}>
              {items.map((item) => (
                <Link key={item.id} to={`/post/${item.id}`} className="block">
                  <div className={UI.gridItem}>
                    <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
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
