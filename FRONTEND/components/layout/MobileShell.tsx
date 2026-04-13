import React from 'react';

/**
 * MobileShell – Same UI layout on mobile and web.
 * - Single column, max-width 428px, centered on desktop (web).
 * - Fixed viewport height + min-h-0 so nested flex children (e.g. Explore grid) scroll inside the shell, not the whole page.
 * - Job tools (`/job/*`) use the same centered column; inner job chrome uses design-bible navy (`bg-background` on JobMobileLayout).
 */
export function MobileShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mobile-shell relative z-0 mx-auto flex h-[100dvh] max-h-[100dvh] min-h-0 w-full max-w-moxe-shell flex-col overflow-hidden bg-black">
      {children}
    </div>
  );
}

