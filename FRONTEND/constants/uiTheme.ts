/**
 * MOxE UI design system – same layout and look for mobile and web.
 * Dark theme; use these tokens across all screens, sub-screens, pages, sub-pages.
 * Account-type variations: show/hide features via capabilities; layout stays the same.
 */
export const UI = {
  /* Backgrounds */
  bg: 'bg-black',
  bgCard: 'bg-[#262626]',
  bgCardBorder: 'border border-[#363636]',
  surface: 'bg-[#1a1a1a]',

  /* Text */
  text: 'text-white',
  textSecondary: 'text-[#a8a8a8]',
  textMuted: 'text-[#737373]',
  textLink: 'text-[#0095f6]',

  /* Header bar (back + title + action) */
  header: 'sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt',
  headerBack: 'flex items-center gap-1 text-white font-medium active:opacity-70',
  headerTitle: 'absolute left-1/2 -translate-x-1/2 text-white font-semibold',
  headerAction: 'text-[#0095f6] text-sm font-semibold',

  /* Filter/sort pills */
  filterBar: 'flex items-center gap-2 overflow-x-auto py-2 no-scrollbar',
  filterPill: 'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
  filterPillActive: 'bg-[#363636] text-white',
  filterPillInactive: 'bg-[#262626] text-[#737373] border border-[#363636]',

  /* List rows (activity, notifications, messages) */
  listRow: 'flex items-center gap-3 px-4 py-3 active:bg-white/5',
  listAvatar: 'w-11 h-11 rounded-full flex-shrink-0 overflow-hidden',
  listThumb: 'w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden bg-[#262626]',

  /* Content grids (2 or 3 col) */
  grid2: 'grid grid-cols-2 gap-[2px]',
  grid3: 'grid grid-cols-3 gap-[2px]',
  gridItem: 'aspect-square bg-[#262626] overflow-hidden relative',
  gridItemPlayIcon: 'absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center',

  /* Cards (subscription, benefits) */
  card: 'rounded-xl bg-[#262626] border border-[#363636] p-4',
  cardTitle: 'text-white font-bold text-lg',
  benefitItem: 'flex items-start gap-2 py-1.5',
  benefitCheck: 'text-white mt-0.5 shrink-0',

  /* Buttons */
  btnPrimary: 'w-full py-2.5 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50',
  btnSecondary: 'py-2.5 px-4 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm font-semibold',

  /* Tabs (horizontal scroll) */
  tabs: 'flex gap-2 overflow-x-auto no-scrollbar border-b border-[#262626] pb-2',
  tab: 'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
  tabActive: 'bg-[#363636] text-white',
  tabInactive: 'text-[#737373]',

  /* Section headers (Today, Yesterday, etc.) */
  sectionTitle: 'text-white font-bold text-sm pt-4 pb-2 px-4',

  /* Disclaimer / footer text */
  disclaimer: 'text-[#737373] text-xs text-center py-2 px-4',
} as const;
