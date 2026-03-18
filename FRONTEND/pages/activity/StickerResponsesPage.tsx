import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown, User } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

type StickerItem = { id: string; response: string; timeAgo: string; pollFrom: string };

export default function StickerResponsesPage() {
  const [items] = useState<StickerItem[]>([]);

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Sticker responses</span>
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
            <span className="text-[#737373] text-xs w-full">Delete multiple interactions.</span>
          </div>
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No sticker responses yet.</div>
          ) : (
            <ul className="divide-y divide-[#262626]">
              {items.map((item) => (
                <li key={item.id}>
                  <div className={`${UI.listRow} text-white`}>
                    <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#737373]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">You voted</p>
                      <p className="text-sm text-[#a8a8a8]">{item.response}</p>
                      <p className="text-xs text-[#737373] mt-0.5">{item.timeAgo} · Poll from {item.pollFrom}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
