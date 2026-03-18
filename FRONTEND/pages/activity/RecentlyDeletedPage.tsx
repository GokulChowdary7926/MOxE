import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

type DeletedItem = { id: string; thumbUrl?: string; daysLeft: number };

export default function RecentlyDeletedPage() {
  const [items] = useState<DeletedItem[]>([]);

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Recently Deleted</span>
          <div className="w-14" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-[#a8a8a8] text-sm px-4 py-3">
            Only you can see these stories. They will be permanently deleted after the number of days shown. After that, you won&apos;t be able to restore them.
          </p>
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No recently deleted content.</div>
          ) : (
            <div className={UI.grid3}>
              {items.map((item) => (
                <div key={item.id} className="relative">
                  <div className={`${UI.gridItem} relative`}>
                    {item.thumbUrl ? (
                      <img src={item.thumbUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#262626]" />
                    )}
                  </div>
                  <p className="text-[#737373] text-xs text-center py-1">{item.daysLeft} days</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
