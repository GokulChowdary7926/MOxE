/**
 * Auth UI tokens via CSS variables (--moxe-*). App is dark-only; these always resolve to dark tokens.
 */
export const AUTH = {
  bg: 'min-h-screen', // parent uses var(--moxe-bg) from body
  container: 'w-full max-w-[350px] flex flex-col items-center',
  card: 'w-full rounded-lg px-10 py-8 mb-3 border bg-[var(--moxe-card)] border-[var(--moxe-border)]',
  logoWrapper: 'mb-8 flex justify-center',
  logoBox:
    'w-12 h-12 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center',
  logoLetter: 'text-white font-bold text-2xl font-serif italic',
  title: 'text-2xl font-semibold text-center mb-2 text-[var(--moxe-text)]',
  subtitle: 'text-sm text-center mb-6 text-[var(--moxe-text-secondary)]',
  input:
    'w-full px-3 py-2.5 rounded border text-sm focus:outline-none border-[var(--moxe-border)] bg-[var(--moxe-input-bg)] text-[var(--moxe-text)] placeholder-[var(--moxe-text-secondary)] focus:border-[var(--moxe-text-secondary)]',
  inputWithLabel:
    'w-full px-3 py-2.5 rounded border text-sm focus:outline-none border-[var(--moxe-border)] bg-[var(--moxe-input-bg)] text-[var(--moxe-text)] placeholder-[var(--moxe-text-secondary)]',
  label: 'block text-xs mb-1.5 text-[var(--moxe-text)]',
  btnPrimary:
    'w-full py-2 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
  btnSecondary:
    'py-2.5 px-4 rounded-lg border bg-[var(--moxe-card)] text-[var(--moxe-text)] text-sm font-semibold border-[var(--moxe-border)]',
  link: 'text-[#0095f6] text-xs font-semibold',
  linkMuted: 'text-sm text-[var(--moxe-text-secondary)]',
  error: 'w-full p-3 rounded-lg text-sm text-center border bg-red-500/10 border-red-500/30 text-red-400',
  info: 'w-full p-3 rounded-lg text-sm text-center border bg-blue-500/10 border-blue-500/30 text-[#0095f6]',
  divider: 'flex items-center gap-4 my-4',
  dividerLine: 'flex-1 h-px bg-[var(--moxe-border)]',
  dividerText: 'text-xs font-semibold uppercase text-[var(--moxe-text-secondary)]',
  footerCard: 'w-full rounded-lg py-6 px-10 border bg-[var(--moxe-card)] border-[var(--moxe-border)]',
  footerText: 'text-sm text-[var(--moxe-text-secondary)]',
  getApp: 'text-sm text-center my-4 text-[var(--moxe-text-secondary)]',
} as const;
