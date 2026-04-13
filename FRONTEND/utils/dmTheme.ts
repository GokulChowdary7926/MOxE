/** Preset chat appearance for DMs (MOxE web). Class strings are literals for Tailwind JIT. */

export const DM_THEME_IDS = ['default', 'ocean', 'rose', 'forest', 'midnight'] as const;
export type DmThemeId = (typeof DM_THEME_IDS)[number];

export function isDmThemeId(v: string | undefined | null): v is DmThemeId {
  return !!v && (DM_THEME_IDS as readonly string[]).includes(v);
}

export type DmThemeSkin = {
  shell: string;
  header: string;
  scroll: string;
  composer: string;
  mine: string;
  theirs: string;
};

export const DM_THEME_SKINS: Record<DmThemeId, DmThemeSkin> = {
  default: {
    shell: 'bg-[#07090c]',
    header: 'bg-[#0b0f14] border-b border-white/10',
    scroll: 'bg-[#07090c]',
    composer: 'bg-[#0b0f14] border-t border-white/10',
    mine: 'bg-[#1f6feb] text-white shadow-md rounded-[14px]',
    theirs: 'bg-[#1a1f27] text-white border border-[#2a3342] rounded-[14px]',
  },
  ocean: {
    shell: 'bg-[#061a1f]',
    header: 'bg-[#0a252b] border-b border-cyan-500/25',
    scroll: 'bg-[#061a1f]',
    composer: 'bg-[#0a252b] border-t border-cyan-500/25',
    mine: 'bg-[#0d9488] text-white shadow-md rounded-[14px]',
    theirs: 'bg-[#134e4a] text-white border border-teal-500/35 rounded-[14px]',
  },
  rose: {
    shell: 'bg-[#1a0f14]',
    header: 'bg-[#261018] border-rose-500/25',
    scroll: 'bg-[#1a0f14]',
    composer: 'bg-[#261018] border-rose-500/25',
    mine: 'bg-[#db2777] text-white shadow-md rounded-[14px]',
    theirs: 'bg-[#3f1628] text-white border border-rose-900/40 rounded-[14px]',
  },
  forest: {
    shell: 'bg-[#0c140f]',
    header: 'bg-[#121f16] border-b border-emerald-600/25',
    scroll: 'bg-[#0c140f]',
    composer: 'bg-[#121f16] border-t border-emerald-600/25',
    mine: 'bg-[#16a34a] text-white shadow-md rounded-[14px]',
    theirs: 'bg-[#14532d] text-white border border-emerald-800/40 rounded-[14px]',
  },
  midnight: {
    shell: 'bg-[#0a0a12]',
    header: 'bg-[#12121c] border-b border-violet-500/25',
    scroll: 'bg-[#0a0a12]',
    composer: 'bg-[#12121c] border-t border-violet-500/25',
    mine: 'bg-[#7c3aed] text-white shadow-md rounded-[14px]',
    theirs: 'bg-[#1e1b2e] text-white border border-violet-900/40 rounded-[14px]',
  },
};

export const DM_THEME_LABELS: Record<DmThemeId, string> = {
  default: 'Default',
  ocean: 'Ocean',
  rose: 'Rose',
  forest: 'Forest',
  midnight: 'Midnight',
};

export function getDmThemeSkin(id: string | null | undefined): DmThemeSkin {
  return isDmThemeId(id) ? DM_THEME_SKINS[id] : DM_THEME_SKINS.default;
}
