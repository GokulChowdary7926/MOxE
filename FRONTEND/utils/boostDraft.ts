const KEY = 'moxe_boost_draft_v1';

export type BoostDraft = {
  goalId?: string;
  goalLabel?: string;
  audienceSummary?: string;
  audienceName?: string;
  dailyBudget?: number;
  durationDays?: number;
};

export function readBoostDraft(): BoostDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return {};
    const o = JSON.parse(raw) as unknown;
    return o && typeof o === 'object' ? (o as BoostDraft) : {};
  } catch {
    return {};
  }
}

export function writeBoostDraft(patch: Partial<BoostDraft>): void {
  const cur = readBoostDraft();
  sessionStorage.setItem(KEY, JSON.stringify({ ...cur, ...patch }));
}

export function clearBoostDraft(): void {
  sessionStorage.removeItem(KEY);
}
