/**
 * MOxE Job – mobile app column inside `MobileShell` (428px centered rail). Navy canvas, coral primary accents.
 *
 * Typography follows a **mobile-first scale** (readable body ~15px, UI chrome ~10–12px, never below 10px for labels).
 */

export const JOB_MOBILE = {
  /** Fills the shell column; parent `MobileShell` provides max-w-moxe-shell + black letterbox on wide viewports. */
  shell:
    'flex flex-col flex-1 min-h-0 h-full w-full min-w-0 bg-background text-on-background font-body antialiased selection:bg-primary/25 text-[15px] leading-normal',

  /** Per-tool sub-header (menu + icon + title) — sticky under safe area in Job mobile shell */
  toolBar:
    'sticky top-0 z-30 -mx-4 mb-1 flex min-h-[52px] items-center gap-2 border-b border-outline-variant/20 bg-surface-container-low/95 px-3 py-2 backdrop-blur-xl',
  toolBarEyebrow:
    'font-[Inter,system-ui,sans-serif] text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant',
  toolBarTitle:
    'truncate font-headline text-[15px] font-bold leading-tight tracking-tight text-on-surface',
  toolBarIconBtn:
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-primary transition-transform active:scale-95',

  /** Bottom tab labels — 10px minimum for legibility */
  bottomNavLabel:
    'line-clamp-2 max-w-[20vw] text-center font-[Inter,system-ui,sans-serif] text-[10px] font-bold uppercase leading-tight tracking-tight',

  header:
    'flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/15 safe-area-pt',
  headerHeight: 56,
  content:
    'flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-3 pb-28 w-full min-w-0 text-[15px]',
  nav: 'fixed bottom-0 left-0 right-0 w-full z-30 flex items-stretch bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] safe-area-pb',
  navHeight: 56,

  /** Touch targets – min 44px for tap areas */
  touchMin: 'min-h-[44px] min-w-[44px]',
  touchPadding: 'px-4 py-3',

  /** Page title & description — mobile body scale */
  pageTitle: 'text-[17px] font-semibold leading-snug text-[#172B4D] dark:text-[#E6EDF3] mb-1',
  pageDesc: 'text-[14px] leading-relaxed text-[#5E6C84] dark:text-[#8C9BAB] mb-4',

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
  error:
    'rounded-xl border border-error/35 bg-error-container/20 px-4 py-3 text-sm text-error font-[Inter,system-ui,sans-serif]',
  success: 'p-4 rounded-xl bg-[#E3FCEF] dark:bg-green-900/20 text-[#006644] dark:text-green-300 text-sm',

  /** More sheet */
  sheetOverlay: 'fixed inset-0 bg-black/40 z-40',
  sheet:
    'fixed bottom-0 left-0 right-0 w-full z-50 rounded-t-2xl bg-white dark:bg-[#1D2125] shadow-xl max-h-[85vh] overflow-hidden flex flex-col safe-area-pb',
  sheetHeader: 'flex items-center justify-between px-4 py-3 border-b border-[#DFE1E6] dark:border-[#2C333A]',
  sheetTitle: 'text-base font-semibold text-[#172B4D] dark:text-[#E6EDF3]',
  sheetItem:
    'flex items-center gap-3 px-4 py-3 min-h-[52px] active:bg-[#DEEBFF] dark:active:bg-[#2C333A]',
  sheetItemActive: 'bg-[#DEEBFF]/50 dark:bg-[#2C333A]',

  /** MOxE TRACK / bible-dark: cards on surface-container (same family as HTML UI.html) */
  trackCard:
    'rounded-[14px] border border-outline-variant/25 bg-surface-container overflow-hidden',
  trackSection:
    'rounded-[14px] border border-outline-variant/20 bg-surface-container-low p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]',
  trackSectionTitle:
    'text-[10px] font-bold uppercase tracking-[0.14em] text-primary mb-1 font-[Inter,system-ui,sans-serif]',
  trackSectionHeading:
    'font-headline text-[18px] leading-[1.2] font-extrabold tracking-[-0.02em] text-on-surface mb-2',
  trackBody: 'text-[14px] leading-relaxed text-on-surface-variant font-[Inter,system-ui,sans-serif]',
  trackToolCard:
    'flex items-start gap-3 rounded-[14px] border border-outline-variant/25 bg-surface-container p-3 min-h-[72px] transition-opacity active:opacity-90',
  trackToolIconChip:
    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-surface-container-high text-primary',
  trackToolLabel: 'text-[15px] font-semibold leading-tight text-on-surface',
  trackToolDesc: 'mt-0.5 text-[13px] leading-snug text-on-surface-variant',
  /** “More” sheet icon chip – matches overview */
  sheetIconChip:
    'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] bg-surface-container-high text-primary',

  /** Dark job forms (Compass, Atlas, shared filters) — HTML UI.html aligned */
  formLabel: 'mb-1 block text-[11px] font-bold uppercase tracking-wide text-on-surface-variant',
  formInput:
    'w-full min-h-[44px] rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-transparent',
  formTextarea:
    'w-full min-h-[88px] rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/55 focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-transparent',
  formSelect:
    'w-full min-h-[44px] rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/35',
  formPanel: 'rounded-xl border border-outline-variant/20 bg-surface-container p-4 space-y-3',
  formMuted: 'text-sm text-on-surface-variant',
} as const;
