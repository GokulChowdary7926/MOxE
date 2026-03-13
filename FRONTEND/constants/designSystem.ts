/**
 * MOxE Design System – Instagram-inspired, production-ready.
 * Used across Personal, Business, Creator, Job account templates.
 * NO EMPTY STATES: all screens use populated content.
 */

/** Primary gradient (Instagram): purple → pink → orange */
export const GRADIENT = {
  start: '#833AB4',
  mid: '#E1306C',
  end: '#FCAF45',
  /** CSS linear gradient 90deg */
  css: 'linear-gradient(90deg, #833AB4 0%, #E1306C 50%, #FCAF45 100%)',
  /** Vertical (e.g. stories, buttons) */
  cssVertical: 'linear-gradient(180deg, #833AB4 0%, #E1306C 50%, #FCAF45 100%)',
} as const;

/** Light mode (default Instagram) */
export const LIGHT = {
  background: '#FFFFFF',
  card: '#FAFAFA',
  text: '#262626',
  textSecondary: '#8E8E8E',
  separator: '#DBDBDB',
  border: '#DBDBDB',
} as const;

/** Dark mode */
export const DARK = {
  background: '#000000',
  surface: '#121212',
  card: '#262626',
  cardBorder: '#363636',
  text: '#FFFFFF',
  textSecondary: '#A8A8A8',
  textMuted: '#737373',
  separator: '#262626',
  border: '#363636',
} as const;

/** Accent & semantic */
export const ACCENT = {
  blue: '#0095F6',       // Primary CTA, links, follow
  success: '#00C853',    // Success green
  warning: '#FF9800',    // Warning orange
  error: '#ED4956',      // Error red
  /** Account-type accents */
  business: '#00A86B',   // Business (Thick – green)
  creator: '#FFD700',    // Creator (Thick – gold)
  job: '#8A2BE2',        // Job (Purple tier)
  /** Live / close friends */
  live: '#ED4956',       // Live badge red
  closeFriends: '#00C853', // Green ring
} as const;

/** Typography (Instagram-style) */
export const TYPOGRAPHY = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  weight: {
    caption: 300,
    body: 400,
    semibold: 600,
    bold: 700,
  },
  size: {
    caption: '12px',
    body: '14px',
    bodyLg: '16px',
    title: '18px',
    titleLg: '20px',
    headline: '24px',
  },
  lineHeight: {
    caption: 1.4,
    body: 1.5,
    title: 1.3,
    headline: 1.2,
  },
} as const;

/** Spacing (base 8px) */
export const SPACING = {
  base: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  cardPadding: 16,
  /** Profile grid: 3 columns, 2px gap */
  gridGap: 2,
  gridCols: 3,
} as const;

/** Breakpoints (mobile-first) */
export const BREAKPOINTS = {
  mobile: { min: 320, max: 480 },
  tablet: { min: 481, max: 768 },
  desktop: { min: 769 },
} as const;

/** Component specs */
export const COMPONENTS = {
  /** Bottom tab bar: 5 icons */
  bottomNavHeight: 56,
  /** Story tray */
  storyAvatarSize: 56,
  storyRingWidth: 2,
  /** Touch targets */
  iconButtonSize: 44,
  /** Border radius */
  radiusSm: 4,
  radiusMd: 8,
  radiusLg: 16,
  /** Buttons */
  buttonPaddingY: 12,
  buttonPaddingX: 24,
  buttonRadius: 8,
} as const;

/** Tailwind-compatible class names for design system (dark default) */
export const DS = {
  bg: 'bg-black',
  bgCard: 'bg-[#262626]',
  bgSurface: 'bg-[#121212]',
  text: 'text-white',
  textSecondary: 'text-[#a8a8a8]',
  textMuted: 'text-[#737373]',
  border: 'border-[#363636]',
  separator: 'border-[#262626]',
  primary: 'text-[#0095f6] bg-[#0095f6]',
  gradient: 'bg-ig-gradient',
  /** Account accents */
  business: 'text-moxeAccent-business',
  creator: 'text-moxeAccent-creator',
  job: 'text-moxeAccent-job',
  live: 'bg-[#ED4956]',
  closeFriends: 'ring-2 ring-[#00C853]',
  verified: 'text-[#0095f6]',
} as const;
