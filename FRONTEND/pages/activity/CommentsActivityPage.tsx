import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

export default function CommentsActivityPage() {
  const items: { id: string; text: string; postId: string }[] = [];

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Comments</span>
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
            <div className="px-4 py-12 text-center text-[#737373] text-sm">No comments yet.</div>
          ) : (
            <ul className="divide-y divide-[#262626]">
              {items.map((item) => (
                <li key={item.id}>
                  <Link to={`/post/${item.postId}`} className={UI.listRow}>
                    <span className="text-white text-sm">{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
