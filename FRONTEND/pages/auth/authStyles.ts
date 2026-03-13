/**
 * Instagram-style auth UI tokens.
 * Use across Login, Register, ForgotPassword, PhoneVerification for consistent look.
 */
export const AUTH = {
  bg: 'bg-black',
  container: 'w-full max-w-[360px] flex flex-col items-center',
  input:
    'w-full px-3 py-3 rounded bg-[#262626] border border-[#363636] text-white text-sm placeholder-[#737373] focus:outline-none focus:border-[#737373]',
  inputWithLabel:
    'w-full px-3 py-3 rounded bg-[#262626] border border-[#363636] text-white text-sm placeholder-[#737373] focus:outline-none focus:border-[#737373]',
  label: 'block text-[#a8a8a8] text-xs mb-1.5',
  btnPrimary:
    'w-full py-2.5 rounded-lg bg-[#0095f6] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed',
  btnSecondary:
    'py-2.5 px-4 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm font-semibold',
  link: 'text-[#0095f6] text-sm font-semibold',
  linkMuted: 'text-[#737373] text-sm',
  error: 'w-full p-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-lg text-sm text-center',
  info: 'w-full p-3 bg-[#0095f6]/10 border border-[#0095f6]/30 text-[#0095f6] rounded-lg text-sm text-center',
  divider: 'border-t border-[#262626]',
  logoWrapper: 'mb-8 flex justify-center',
  logoBox:
    'w-12 h-12 rounded-xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center',
  logoLetter: 'text-white font-bold text-2xl font-serif italic',
  title: 'text-2xl font-semibold text-white text-center mb-2',
  subtitle: 'text-[#737373] text-sm text-center mb-6',
} as const;
