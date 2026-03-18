/**
 * Instagram-style auth UI tokens.
 * Light theme: white/off-white background, dark text, blue accent.
 */
export const AUTH = {
  bg: 'bg-white',
  container: 'w-full max-w-[350px] flex flex-col items-center',
  card: 'w-full border border-[#dbdbdb] rounded-lg bg-white px-10 py-8 mb-3',
  logoWrapper: 'mb-8 flex justify-center',
  logoBox:
    'w-12 h-12 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center',
  logoLetter: 'text-white font-bold text-2xl font-serif italic',
  title: 'text-2xl font-semibold text-black text-center mb-2',
  subtitle: 'text-[#737373] text-sm text-center mb-6',
  input:
    'w-full px-3 py-2.5 rounded border border-[#dbdbdb] bg-[#fafafa] text-black text-sm placeholder-[#737373] focus:outline-none focus:border-[#a8a8a8]',
  inputWithLabel:
    'w-full px-3 py-2.5 rounded border border-[#dbdbdb] bg-[#fafafa] text-black text-sm placeholder-[#737373] focus:outline-none focus:border-[#a8a8a8]',
  label: 'block text-[#262626] text-xs mb-1.5',
  btnPrimary:
    'w-full py-2 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
  btnSecondary:
    'py-2.5 px-4 rounded-lg border border-[#dbdbdb] bg-white text-black text-sm font-semibold',
  link: 'text-[#0095f6] text-xs font-semibold',
  linkMuted: 'text-[#262626] text-sm',
  error: 'w-full p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center',
  info: 'w-full p-3 bg-blue-50 border border-blue-200 text-[#0095f6] rounded-lg text-sm text-center',
  divider: 'flex items-center gap-4 my-4',
  dividerLine: 'flex-1 h-px bg-[#dbdbdb]',
  dividerText: 'text-[#737373] text-xs font-semibold uppercase',
  footerCard: 'w-full border border-[#dbdbdb] rounded-lg bg-white py-6 px-10',
  footerText: 'text-[#262626] text-sm',
  getApp: 'text-[#262626] text-sm text-center my-4',
} as const;
