/**
 * MOxE design tokens – shared spacing, radius, typography.
 * Theme-specific colors live in ThemeContext (MOxE social dark / Job workspace light).
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const typography = {
  caption: 12,
  body: 14,
  bodyLarge: 16,
  title: 18,
  titleLarge: 20,
  headline: 24,
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radius;
export type Typography = keyof typeof typography;
