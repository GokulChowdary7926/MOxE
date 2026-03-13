/**
 * Mock data for Your Activity detail screens: time spent, account history, link history.
 */

export type DailyUsageEntry = {
  date: string; // YYYY-MM-DD
  minutes: number;
  label?: string;
};

export const mockDailyUsage: DailyUsageEntry[] = [
  { date: new Date(Date.now() - 0).toISOString().slice(0, 10), minutes: 42, label: 'Today' },
  { date: new Date(Date.now() - 864e5).toISOString().slice(0, 10), minutes: 38 },
  { date: new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10), minutes: 55 },
  { date: new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10), minutes: 28 },
  { date: new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 10), minutes: 61 },
  { date: new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10), minutes: 45 },
  { date: new Date(Date.now() - 6 * 864e5).toISOString().slice(0, 10), minutes: 33 },
];

export type AccountHistoryEntry = {
  id: string;
  type: string;
  description: string;
  createdAt: string;
};

export const mockAccountHistory: AccountHistoryEntry[] = [
  { id: 'ah1', type: 'USERNAME_CHANGED', description: 'Changed username', createdAt: new Date(Date.now() - 2 * 864e5).toISOString() },
  { id: 'ah2', type: 'EMAIL_CHANGED', description: 'Updated email', createdAt: new Date(Date.now() - 5 * 864e5).toISOString() },
  { id: 'ah3', type: 'PASSWORD_CHANGED', description: 'Password changed', createdAt: new Date(Date.now() - 14 * 864e5).toISOString() },
  { id: 'ah4', type: 'PROFILE_UPDATED', description: 'Updated profile picture', createdAt: new Date(Date.now() - 21 * 864e5).toISOString() },
];

export type LinkHistoryEntry = {
  id: string;
  url: string;
  title?: string;
  clickedAt: string;
};

export const mockLinkHistory: LinkHistoryEntry[] = [
  { id: 'lh1', url: 'https://help.moxe.example.com/privacy', title: 'Privacy Policy', clickedAt: new Date(Date.now() - 1 * 864e5).toISOString() },
  { id: 'lh2', url: 'https://moxe.example.com/terms', title: 'Terms of Service', clickedAt: new Date(Date.now() - 3 * 864e5).toISOString() },
  { id: 'lh3', url: 'https://blog.moxe.example.com/new-features', title: 'New features', clickedAt: new Date(Date.now() - 7 * 864e5).toISOString() },
];
