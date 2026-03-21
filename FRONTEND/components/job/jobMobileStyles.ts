/**
 * MOxE Job – mobile-first design tokens (Atlassian-style).
 * Use for all Job tools so the app feels native on mobile.
 */

export const JOB_MOBILE = {
  /** Shell */
  shell: 'min-h-[100dvh] w-full max-w-[428px] mx-auto bg-[#F4F5F7] dark:bg-[#161A1D]',
  header:
    'flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-[#1D2125] border-b border-[#DFE1E6] dark:border-[#2C333A] safe-area-pt',
  headerHeight: 56,
  content: 'flex-1 min-h-0 overflow-auto px-4 py-4 pb-28',
  nav: 'fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto z-30 flex items-stretch bg-white dark:bg-[#1D2125] border-t border-[#DFE1E6] dark:border-[#2C333A] safe-area-pb',
  navHeight: 56,

  /** Touch targets – min 44px for tap areas */
  touchMin: 'min-h-[44px] min-w-[44px]',
  touchPadding: 'px-4 py-3',

  /** Page title & description */
  pageTitle: 'text-lg font-semibold text-[#172B4D] dark:text-[#E6EDF3] mb-1',
  pageDesc: 'text-sm text-[#5E6C84] dark:text-[#8C9BAB] mb-4',

  /** Cards */
  card: 'rounded-xl border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] shadow-sm overflow-hidden',
  cardPadding: 'p-4',
  cardSection: 'rounded-xl border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] p-4 shadow-sm',

  /** Tabs (pill or segment) */
  tab: 'flex gap-1 p-1 rounded-xl bg-[#F4F5F7] dark:bg-[#2C333A] overflow-x-auto no-scrollbar',
  tabButton:
    'flex-1 min-w-0 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ' +
    'min-h-[44px] flex items-center justify-center',
  tabActive: 'bg-white dark:bg-[#1D2125] text-[#0052CC] dark:text-[#2684FF] shadow-sm',
  tabInactive: 'text-[#5E6C84] dark:text-[#8C9BAB] active:opacity-80',

  /** Inputs */
  input:
    'w-full px-4 py-3 rounded-xl border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] ' +
    'text-[#172B4D] dark:text-[#E6EDF3] text-base placeholder:text-[#5E6C84] dark:placeholder:text-[#8C9BAB] ' +
    'focus:outline-none focus:ring-2 focus:ring-[#0052CC] dark:focus:ring-[#2684FF] focus:border-transparent',

  /** Buttons */
  btnPrimary:
    'w-full min-h-[44px] px-4 py-3 rounded-xl bg-[#0052CC] dark:bg-[#2684FF] text-white font-semibold text-sm ' +
    'active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center',
  btnSecondary:
    'min-h-[44px] px-4 py-3 rounded-xl border border-[#DFE1E6] dark:border-[#2C333A] ' +
    'bg-white dark:bg-[#1D2125] text-[#172B4D] dark:text-[#E6EDF3] font-medium text-sm ' +
    'active:bg-[#F4F5F7] dark:active:bg-[#2C333A] flex items-center justify-center',
  btnLink: 'text-[#0052CC] dark:text-[#2684FF] font-medium text-sm min-h-[44px] flex items-center',

  /** List items (tappable rows) */
  listRow:
    'flex items-center gap-3 px-4 py-3 rounded-xl active:bg-[#F4F5F7] dark:active:bg-[#2C333A] min-h-[52px]',
  listRowBorder: 'border-b border-[#DFE1E6] dark:border-[#2C333A] last:border-b-0',

  /** Labels & meta */
  label: 'text-xs font-semibold text-[#5E6C84] dark:text-[#8C9BAB] uppercase tracking-wide',
  meta: 'text-xs text-[#5E6C84] dark:text-[#8C9BAB]',
  error: 'p-4 rounded-xl bg-[#FFEBE6] dark:bg-red-900/30 text-[#BF2600] dark:text-red-300 text-sm',
  success: 'p-4 rounded-xl bg-[#E3FCEF] dark:bg-green-900/20 text-[#006644] dark:text-green-300 text-sm',

  /** More sheet */
  sheetOverlay: 'fixed inset-0 bg-black/40 z-40',
  sheet: 'fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto z-50 rounded-t-2xl bg-white dark:bg-[#1D2125] shadow-xl max-h-[85vh] overflow-hidden flex flex-col safe-area-pb',
  sheetHeader: 'flex items-center justify-between px-4 py-3 border-b border-[#DFE1E6] dark:border-[#2C333A]',
  sheetTitle: 'text-base font-semibold text-[#172B4D] dark:text-[#E6EDF3]',
  sheetItem:
    'flex items-center gap-3 px-4 py-3 min-h-[52px] active:bg-[#DEEBFF] dark:active:bg-[#2C333A]',
  sheetItemActive: 'bg-[#DEEBFF]/50 dark:bg-[#2C333A]',
} as const;
