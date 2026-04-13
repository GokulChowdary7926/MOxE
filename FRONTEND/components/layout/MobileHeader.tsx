import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Minimal global mobile header.
 * We intentionally avoid a global right icon strip so pages can define their own actions.
 */
export default function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 bg-black border-b border-[#262626] safe-area-pt">
      <div className="flex items-center h-12 px-3">
        <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="MOxE Home">
          <img src="/logo.png" alt="MOxE" className="w-9 h-9 rounded-lg shrink-0 object-cover" />
          <span className="font-bold text-lg tracking-tight hidden sm:inline text-white">MOxE</span>
        </Link>
      </div>
    </header>
  );
}
