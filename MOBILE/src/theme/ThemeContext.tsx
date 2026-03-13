import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { spacing, radius, typography } from './tokens';

export type ThemeMode = 'instagram' | 'atlassian';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  storyRing: string[];
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

const instagramColors: ThemeColors = {
  background: '#000000',
  surface: '#111111',
  text: '#ffffff',
  textSecondary: '#8e8e8e',
  border: '#262626',
  primary: '#0095f6',
  accent: '#e1306c',
  success: '#00c853',
  danger: '#ff5252',
  warning: '#ffab00',
  storyRing: ['#f09433', '#e1306c', '#833ab4', '#405de6'],
};

const atlassianColors: ThemeColors = {
  background: '#f4f5f7',
  surface: '#ffffff',
  text: '#172b4d',
  textSecondary: '#5e6c84',
  border: '#dfe1e6',
  primary: '#0052cc',
  accent: '#6554c0',
  success: '#36b37e',
  danger: '#ff5630',
  warning: '#ffab00',
  storyRing: ['#0052cc', '#6554c0'],
};

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('instagram');
  const theme: Theme = useMemo(
    () => ({
      mode,
      colors: mode === 'instagram' ? instagramColors : atlassianColors,
      spacing,
      radius,
      typography,
    }),
    [mode]
  );
  const setTheme = useCallback((m: ThemeMode) => setMode(m), []);
  const toggleTheme = useCallback(
    () => setMode((prev) => (prev === 'instagram' ? 'atlassian' : 'instagram')),
    []
  );
  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
