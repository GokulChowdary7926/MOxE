import React, { useLayoutEffect } from 'react';

/**
 * Dark theme only (no light mode). Sets CSS variables, Tailwind `.dark`, and persists theme key for legacy callers.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', 'dark');
    root.classList.add('dark');
    root.classList.remove('light');
    try {
      localStorage.setItem('moxe_app_theme', 'dark');
    } catch {
      /* ignore */
    }
  }, []);

  return <>{children}</>;
}
