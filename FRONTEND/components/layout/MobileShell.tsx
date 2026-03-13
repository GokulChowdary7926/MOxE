import React from 'react';

/**
 * MobileShell – Same UI layout on mobile and web.
 * - Single column, max-width 428px, centered on desktop (web).
 * - Dark background; header, content, and bottom nav use this same width.
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell w-full max-w-[428px] min-h-screen min-h-dvh mx-auto flex flex-col bg-black">
      {children}
    </div>
  );
}

