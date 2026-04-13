/** In-app back target from any Job tool chrome — main MOxE feed (social home). */
export const JOB_TOOL_LEADING_BACK = '/';

/**
 * Module drawer — aligned with `HTML UI.html` side nav (“MOxE MODULES”).
 * Paths match `FRONTEND/pages/job/Job.tsx` routes.
 */
export type BibleDrawerItem = {
  to: string;
  label: string;
  icon: string; // Material SymbolsOutlined ligature name
};

export const JOB_BIBLE_DRAWER_NAV: BibleDrawerItem[] = [
  { to: '/job/overview/home', label: 'Overview', icon: 'dashboard' },
  { to: '/job/track', label: 'MOxE Track', icon: 'analytics' },
  { to: '/job/recruiter', label: 'Recruiter', icon: 'groups' },
  { to: '/job/work', label: 'MOxE Work', icon: 'work' },
  { to: '/job/know', label: 'MOxE Know', icon: 'auto_stories' },
  { to: '/job/code', label: 'MOxE Code', icon: 'code' },
  { to: '/job/status', label: 'MOxE Status', icon: 'monitoring' },
  { to: '/job/flow', label: 'MOxE Flow', icon: 'schema' },
  { to: '/job/access', label: 'MOxE Access', icon: 'admin_panel_settings' },
  { to: '/job/alert', label: 'MOxE Alert', icon: 'notifications_active' },
  { to: '/job/build', label: 'MOxE Build', icon: 'construction' },
  { to: '/job/compass', label: 'MOxE Compass', icon: 'explore' },
  { to: '/job/atlas', label: 'MOxE Atlas', icon: 'emoji_events' },
  { to: '/job/video', label: 'MOxE Video', icon: 'videocam' },
  { to: '/job/chat', label: 'MOxE Chat', icon: 'forum' },
  { to: '/job/source', label: 'MOxE Source', icon: 'hub' },
  { to: '/job/code-search', label: 'Code Search', icon: 'search' },
  { to: '/job/ai', label: 'MOxE AI', icon: 'psychology' },
  { to: '/job/strategy', label: 'MOxE Strategy', icon: 'strategy' },
  { to: '/job/profile', label: 'MOxE Profile', icon: 'person' },
  { to: '/job/integrations', label: 'Integration', icon: 'sync_alt' },
  { to: '/job/scrum', label: 'MOxE Scrum', icon: 'view_kanban' },
  { to: '/job/teams', label: 'MOxE Teams', icon: 'groups_2' },
  { to: '/job/docs', label: 'MOxE Docs', icon: 'description' },
  { to: '/job/agile', label: 'Agile', icon: 'view_column' },
  { to: '/job/analytics', label: 'Analytics', icon: 'bar_chart' },
];

/** Icon for overview grid links — matches longest path prefix. */
export function bibleIconForJobPath(path: string): string {
  const p = path.replace(/\/$/, '');
  const sorted = [...JOB_BIBLE_DRAWER_NAV].sort((a, b) => b.to.length - a.to.length);
  for (const row of sorted) {
    const base = row.to.replace(/\/home$/, '');
    if (p === row.to || p === base || p.startsWith(`${base}/`)) return row.icon;
    if (row.to === '/job/overview/home' && p.startsWith('/job/overview')) return row.icon;
  }
  return 'apps';
}
