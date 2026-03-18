import React, { useEffect } from 'react';

/** Always apply dark theme on documentElement so all pages use dark. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  return <>{children}</>;
}
