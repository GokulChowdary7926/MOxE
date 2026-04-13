import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Heart, Send, Store } from 'lucide-react';

/**
 * MOxE home top bar: wordmark left; create, store, activity, DMs right.
 * Does not include bottom navigation (handled separately).
 */
export function SocialTopBar() {
  const iconBtn =
    'w-10 h-10 flex items-center justify-center text-white active:opacity-60 rounded-full hover:bg-white/5';

  return (
    <header className="flex shrink-0 items-center justify-between h-12 px-2 border-b border-moxe-border bg-black safe-area-pt">
      <Link
        to="/"
        className="pl-1 text-[25px] font-semibold italic leading-none text-white tracking-tight select-none"
        style={{ fontFamily: '"Georgia", "Times New Roman", serif' }}
      >
        MOxE
      </Link>
      <div className="flex items-center">
        <Link to="/create" className={iconBtn} aria-label="Create" data-testid="create-post-button">
          <Plus className="w-6 h-6" strokeWidth={2} />
        </Link>
        <Link to="/store" className={iconBtn} aria-label="Store" data-testid="store-access-button">
          <Store className="w-6 h-6" strokeWidth={2} />
        </Link>
        <Link to="/notifications" className={iconBtn} aria-label="Activity">
          <Heart className="w-6 h-6" strokeWidth={2} />
        </Link>
        <Link to="/messages" className={iconBtn} aria-label="Messages">
          <Send className="w-6 h-6 -rotate-12" strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
