import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';

export default function HighlightsActivityPage() {
  const [items] = useState<{ id: string; coverUrl?: string; icon?: string }[]>([]);

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Highlights</span>
          <button type="button" className={UI.headerAction}>Select</button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto border-b border-[#262626] flex-wrap">
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              Newest to oldest <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
            <button type="button" className={`flex items-center gap-1 px-3 py-2 rounded-lg ${UI.filterPill} ${UI.filterPillInactive}`}>
              All dates <ChevronDown className="w-4 h-4 ml-0.5" />
            </button>
            <span className="text-[#737373] text-xs">Delete multiple highlights.</span>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No highlights yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 p-4">
              {items.map((item) => (
                <Link key={item.id} to={`/highlights/${item.id}`} className="block aspect-[4/5] rounded-lg overflow-hidden bg-[#262626]">
                  {item.coverUrl ? (
                    <img src={ensureAbsoluteMediaUrl(item.coverUrl)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-end p-2">
                      <span className="text-2xl">{item.icon ?? '📌'}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
