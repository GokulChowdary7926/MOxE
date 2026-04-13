/**
 * Job shell bottom navigation — contextual per tool family (Track, Work, Build, Know, Ops)
 * plus the dashboard “pillar” bar on `/job/overview`.
 */
export type JobShellNavItem = {
  path: string;
  label: string;
  symbol: string;
  match: (pathname: string) => boolean;
};

function p(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isTrackBoard(pathname: string) {
  if (!pathname.startsWith('/job/track')) return false;
  if (pathname.includes('/jobs') || pathname.includes('/pipelines')) return false;
  return true;
}

/** Dashboard hub — same five pillars as global Job home (HTML UI overview). */
export const JOB_COMMAND_BOTTOM_NAV: readonly JobShellNavItem[] = [
  {
    path: '/job/overview/home',
    label: 'Home',
    symbol: 'dashboard',
    match: (pathname) => p(pathname, '/job/overview'),
  },
  {
    path: '/job/track/applications',
    label: 'Track',
    symbol: 'work',
    match: (pathname) =>
      p(pathname, '/job/track') ||
      p(pathname, '/job/recruiter') ||
      p(pathname, '/job/work') ||
      p(pathname, '/job/video') ||
      p(pathname, '/job/chat'),
  },
  {
    path: '/job/build',
    label: 'Build',
    symbol: 'precision_manufacturing',
    match: (pathname) =>
      p(pathname, '/job/build') ||
      p(pathname, '/job/code') ||
      p(pathname, '/job/source') ||
      p(pathname, '/job/code-search'),
  },
  {
    path: '/job/know/activity',
    label: 'Know',
    symbol: 'menu_book',
    match: (pathname) => p(pathname, '/job/know') || p(pathname, '/job/docs'),
  },
  {
    path: '/job/flow',
    label: 'Ops',
    symbol: 'hub',
    match: (pathname) =>
      p(pathname, '/job/flow') ||
      p(pathname, '/job/agile') ||
      p(pathname, '/job/scrum') ||
      p(pathname, '/job/alert') ||
      p(pathname, '/job/access') ||
      p(pathname, '/job/status') ||
      p(pathname, '/job/compass') ||
      p(pathname, '/job/atlas') ||
      p(pathname, '/job/strategy') ||
      p(pathname, '/job/analytics') ||
      p(pathname, '/job/integrations') ||
      p(pathname, '/job/integration') ||
      p(pathname, '/job/teams') ||
      p(pathname, '/job/profile') ||
      p(pathname, '/job/ai'),
  },
] as const;

/** MOxE Track — board, jobs, pipelines, recruiter. */
export const JOB_TRACK_BOTTOM_NAV: readonly JobShellNavItem[] = [
  {
    path: '/job/overview/home',
    label: 'Hub',
    symbol: 'dashboard',
    match: (pathname) => p(pathname, '/job/overview'),
  },
  {
    path: '/job/track/applications',
    label: 'Board',
    symbol: 'view_kanban',
    match: isTrackBoard,
  },
  {
    path: '/job/track/jobs',
    label: 'Jobs',
    symbol: 'work',
    match: (pathname) => pathname.includes('/job/track/jobs'),
  },
  {
    path: '/job/track/pipelines',
    label: 'Pipelines',
    symbol: 'account_tree',
    match: (pathname) => pathname.includes('/job/track/pipelines'),
  },
  {
    path: '/job/recruiter',
    label: 'Recruit',
    symbol: 'groups',
    match: (pathname) => p(pathname, '/job/recruiter'),
  },
] as const;

/** MOxE Work cluster — tasks, video, chat + Track link. */
export const JOB_WORK_BOTTOM_NAV: readonly JobShellNavItem[] = [
  {
    path: '/job/overview/home',
    label: 'Hub',
    symbol: 'dashboard',
    match: (pathname) => p(pathname, '/job/overview'),
  },
  {
    path: '/job/work',
    label: 'Tasks',
    symbol: 'assignment',
    match: (pathname) => p(pathname, '/job/work'),
  },
  {
    path: '/job/video',
    label: 'Video',
    symbol: 'videocam',
    match: (pathname) => p(pathname, '/job/video'),
  },
  {
    path: '/job/chat',
    label: 'Chat',
    symbol: 'forum',
    match: (pathname) => p(pathname, '/job/chat'),
  },
  {
    path: '/job/track/applications',
    label: 'Track',
    symbol: 'analytics',
    match: (pathname) => p(pathname, '/job/track') || p(pathname, '/job/recruiter'),
  },
] as const;

/** Build / Code / Source / Search. */
export const JOB_BUILD_BOTTOM_NAV: readonly JobShellNavItem[] = [
  {
    path: '/job/overview/home',
    label: 'Hub',
    symbol: 'dashboard',
    match: (pathname) => p(pathname, '/job/overview'),
  },
  {
    path: '/job/build',
    label: 'Build',
    symbol: 'construction',
    match: (pathname) => p(pathname, '/job/build'),
  },
  {
    path: '/job/code',
    label: 'Code',
    symbol: 'code',
    match: (pathname) => p(pathname, '/job/code'),
  },
  {
    path: '/job/source',
    label: 'Source',
    symbol: 'hub',
    match: (pathname) => p(pathname, '/job/source'),
  },
  {
    path: '/job/code-search',
    label: 'Search',
    symbol: 'search',
    match: (pathname) => p(pathname, '/job/code-search'),
  },
] as const;

/** Know + Docs. */
export const JOB_KNOW_BOTTOM_NAV: readonly JobShellNavItem[] = [
  {
    path: '/job/overview/home',
    label: 'Hub',
    symbol: 'dashboard',
    match: (pathname) => p(pathname, '/job/overview'),
  },
  {
    path: '/job/know/activity',
    label: 'Feed',
    symbol: 'notifications',
    match: (pathname) =>
      pathname === '/job/know' ||
      pathname === '/job/know/' ||
      p(pathname, '/job/know/activity') ||
      pathname.startsWith('/job/know/pages/') ||
      p(pathname, '/job/know/labels') ||
      p(pathname, '/job/know/profile'),
  },
  {
    path: '/job/docs',
    label: 'Docs',
    symbol: 'description',
    match: (pathname) => p(pathname, '/job/docs'),
  },
  {
    path: '/job/know/spaces',
    label: 'Spaces',
    symbol: 'folder',
    match: (pathname) => p(pathname, '/job/know/spaces'),
  },
  {
    path: '/job/know/drafts',
    label: 'Drafts',
    symbol: 'draft',
    match: (pathname) => p(pathname, '/job/know/drafts'),
  },
] as const;

/** Ops / delivery / health / remaining tools (broad matchers on tab 5). */
export const JOB_OPS_BOTTOM_NAV: readonly JobShellNavItem[] = [
  {
    path: '/job/overview/home',
    label: 'Hub',
    symbol: 'dashboard',
    match: (pathname) => p(pathname, '/job/overview'),
  },
  {
    path: '/job/flow',
    label: 'Delivery',
    symbol: 'schema',
    match: (pathname) =>
      p(pathname, '/job/flow') || p(pathname, '/job/agile') || p(pathname, '/job/scrum'),
  },
  {
    path: '/job/status',
    label: 'Health',
    symbol: 'monitoring',
    match: (pathname) =>
      p(pathname, '/job/status') || p(pathname, '/job/compass') || p(pathname, '/job/access'),
  },
  {
    path: '/job/alert',
    label: 'Alert',
    symbol: 'notifications_active',
    match: (pathname) => p(pathname, '/job/alert'),
  },
  {
    path: '/job/analytics',
    label: 'Insights',
    symbol: 'bar_chart',
    match: (pathname) =>
      p(pathname, '/job/analytics') ||
      p(pathname, '/job/strategy') ||
      p(pathname, '/job/ai') ||
      p(pathname, '/job/integrations') ||
      p(pathname, '/job/integration') ||
      p(pathname, '/job/teams') ||
      p(pathname, '/job/profile'),
  },
] as const;

/**
 * Bottom nav items for the current route. Overview uses the five global pillars; deeper tools use
 * family-specific tabs (HTML UI.html mobile bottom bar pattern).
 */
export function getJobBottomNavForPath(pathname: string): readonly JobShellNavItem[] {
  if (pathname.startsWith('/job/overview')) return JOB_COMMAND_BOTTOM_NAV;
  if (pathname.startsWith('/job/track') || pathname.startsWith('/job/recruiter')) return JOB_TRACK_BOTTOM_NAV;
  if (pathname.startsWith('/job/work') || pathname.startsWith('/job/video') || pathname.startsWith('/job/chat'))
    return JOB_WORK_BOTTOM_NAV;
  if (
    pathname.startsWith('/job/build') ||
    pathname.startsWith('/job/code') ||
    pathname.startsWith('/job/source') ||
    pathname.startsWith('/job/code-search')
  )
    return JOB_BUILD_BOTTOM_NAV;
  if (pathname.startsWith('/job/know') || pathname.startsWith('/job/docs')) return JOB_KNOW_BOTTOM_NAV;
  return JOB_OPS_BOTTOM_NAV;
}

/** @deprecated Same as `JOB_COMMAND_BOTTOM_NAV` — kept for older imports. */
export const JOB_SHELL_BOTTOM_NAV = JOB_COMMAND_BOTTOM_NAV;
