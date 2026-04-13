import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { UI } from '../../constants/uiTheme';

/**
 * Activity — comments you’ve received (MOxE social shell).
 */
export default function CommentsActivityPage() {
  const items: { id: string; text: string; postId: string; createdAt: string; fromName: string }[] = [];

  return (
    <ThemedView className={`min-h-screen flex flex-col ${UI.bg}`}>
      <MobileShell>
        <header className={`${UI.header} flex-shrink-0`}>
          <Link to="/activity" className={UI.headerBack} aria-label="Back">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <span className={UI.headerTitle}>Comments</span>
          <div className="w-11" />
        </header>

        <div className="flex-1 overflow-auto pb-20 px-4">
          {items.length === 0 ? (
            <p className="text-center text-[#8e8e8e] text-sm py-16">No comments yet.</p>
          ) : (
            <ul className="divide-y divide-[#262626]">
              {items.map((item) => (
                <li key={item.id} className="py-4">
                  <Link to={`/post/${item.postId}`} className="block active:opacity-80">
                    <p className="text-[12px] text-[#8e8e8e] mb-1">{item.fromName}</p>
                    <p className="text-[15px] text-white leading-snug">{item.text}</p>
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
