/**
 * Static UI copy + structure per tool — mirrors patterns in `HTML UI.html` (hero, chips, command cards).
 * Rendered via `JobDesignBiblePanel`: hidden in production unless `VITE_SHOW_JOB_DESIGN_BIBLE=true`; dev = collapsed details.
 */

export type BibleUiChip = { label: string; active?: boolean };
export type BibleUiCard = {
  tag: string;
  title: string;
  body: string;
  icon: string;
  borderClass?: string;
};

export type BibleUiToolConfig = {
  toolTitle: string;
  toolIcon: string;
  eyebrow: string;
  headline: string;
  description: string;
  chips: BibleUiChip[];
  cards: BibleUiCard[];
};

export const JOB_BIBLE_UI: Record<string, BibleUiToolConfig> = {
  work: {
    toolTitle: 'MOxE WORK',
    toolIcon: 'work',
    eyebrow: 'Operations Board',
    headline: 'Portfolio execution',
    description:
      'Queue work, align owners, and ship against business projects. Same card density and chips as FLOW Command Center in the design bible.',
    chips: [
      { label: 'Active (8)', active: true },
      { label: 'Planning (3)' },
      { label: 'Blocked (1)' },
      { label: 'Done (24)' },
    ],
    cards: [
      {
        tag: 'Delivery',
        title: 'Normalize hiring workflows across regions',
        body: 'Unify MOxE Track + Recruiter checkpoints for tier-2 approvals.',
        icon: 'assignment',
        borderClass: 'border-l-4 border-on-primary-container',
      },
      {
        tag: 'Finance',
        title: 'Quarterly vendor reconciliation',
        body: 'Close books for MOxE Build spend and Compass contracts.',
        icon: 'payments',
        borderClass: 'border-l-4 border-secondary',
      },
      {
        tag: 'Program',
        title: 'Launch readiness review',
        body: 'Status page, Alert routes, and Atlas goals sign-off.',
        icon: 'rocket_launch',
        borderClass: 'border border-outline-variant/15 bg-surface-container-lowest/50',
      },
    ],
  },
  status: {
    toolTitle: 'MOxE STATUS',
    toolIcon: 'monitoring',
    eyebrow: 'Public command',
    headline: 'Live service health',
    description: 'Surface availability, incidents, and subscriber updates — bible-style status dashboard.',
    chips: [
      { label: 'All', active: true },
      { label: 'Degraded' },
      { label: 'Maintenance' },
    ],
    cards: [
      { tag: 'Core', title: 'API mesh', body: 'Operational · p99 within SLO', icon: 'dns', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Data', title: 'Analytics pipeline', body: 'Scheduled maintenance 02:00 UTC', icon: 'database', borderClass: 'border-l-4 border-secondary' },
      { tag: 'Edge', title: 'CDN & auth', body: 'Nominal across regions', icon: 'public', borderClass: 'border border-outline-variant/15' },
    ],
  },
  know: {
    toolTitle: 'MOxE KNOW',
    toolIcon: 'auto_stories',
    eyebrow: 'Knowledge mesh',
    headline: 'Wiki & runbooks',
    description: 'Spaces, labels, and drafts with MOxE-wide search — tactical wiki shell from the bible.',
    chips: [
      { label: 'Activity', active: true },
      { label: 'Spaces' },
      { label: 'Labels' },
      { label: 'Drafts' },
    ],
    cards: [
      { tag: 'Runbook', title: 'Incident commander checklist', body: 'Alert → Track → Status comms loop.', icon: 'menu_book', borderClass: 'border-l-4 border-primary' },
      { tag: 'Policy', title: 'Access review cadence', body: 'Quarterly MFA + seat hygiene.', icon: 'gavel', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  code: {
    toolTitle: 'MOxE CODE',
    toolIcon: 'code',
    eyebrow: 'Dev fabric',
    headline: 'Repositories & review',
    description: 'Create repos, branches, and PRs with terminal-first aesthetics from MOxE CODE screens.',
    chips: [
      { label: 'Repos', active: true },
      { label: 'PRs' },
      { label: 'Security' },
    ],
    cards: [
      { tag: 'Repo', title: 'moxe/core-api', body: 'Default branch protected · 12 open PRs', icon: 'folder_special', borderClass: 'border-l-4 border-on-primary-container' },
      { tag: 'Hotfix', title: 'release/auth-patch-2', body: 'Needs reviewers from Access admins', icon: 'emergency', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  flow: {
    toolTitle: 'MOxE FLOW',
    toolIcon: 'schema',
    eyebrow: 'Operations Board',
    headline: 'Delivery pipeline',
    description: 'Boards, swimlanes, and execution cards — lifted from FLOW Command Center layouts.',
    chips: [
      { label: 'Backlog (12)', active: true },
      { label: 'In Progress (4)' },
      { label: 'Review (2)' },
      { label: 'Done (28)' },
    ],
    cards: [
      {
        tag: 'Marketing',
        title: 'Finalize launch narrative for Track integration',
        body: 'Owners: creative + PM · due Oct 12',
        icon: 'campaign',
        borderClass: 'border-l-4 border-on-primary-container',
      },
      {
        tag: 'Operations',
        title: 'Hardware audit — sector 7',
        body: 'Logistics + Build sign-off',
        icon: 'precision_manufacturing',
        borderClass: 'border-l-4 border-secondary',
      },
    ],
  },
  build: {
    toolTitle: 'MOxE BUILD',
    toolIcon: 'construction',
    eyebrow: 'Execution plane',
    headline: 'CI/CD pipelines',
    description: 'Pipeline runs, artifacts, and environment gates styled like BUILD screens in the bible.',
    chips: [
      { label: 'Pipelines', active: true },
      { label: 'Artifacts' },
      { label: 'Policies' },
    ],
    cards: [
      { tag: 'Main', title: 'deploy-prod-east', body: 'Last run: succeeded · 4m 12s', icon: 'bolt', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Canary', title: 'rollout-web-428', body: 'Awaiting manual promote', icon: 'published_with_changes', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  compass: {
    toolTitle: 'MOxE COMPASS',
    toolIcon: 'explore',
    eyebrow: 'Service catalog',
    headline: 'Operations map',
    description: 'Register services, health checks, and ownership — COMPASS registry patterns from HTML bible.',
    chips: [
      { label: 'Catalog', active: true },
      { label: 'Health' },
      { label: 'New' },
    ],
    cards: [
      { tag: 'Auth', title: 'Authentication service', body: 'OPERATIONAL · multi-region', icon: 'verified_user', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Mesh', title: 'Event bus', body: 'DEGRADED · elevated latency', icon: 'hub', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  atlas: {
    toolTitle: 'MOxE ATLAS',
    toolIcon: 'emoji_events',
    eyebrow: 'Mission control',
    headline: 'Objectives & key results',
    description: 'Alignment tree, missions, and KRs — ATLAS executive visuals from the bible.',
    chips: [
      { label: 'Objectives', active: true },
      { label: 'Tree' },
      { label: 'Risks' },
    ],
    cards: [
      { tag: 'O1', title: 'Ship Job tools parity', body: 'KR: 100% routes bible-compliant', icon: 'flag', borderClass: 'border-l-4 border-primary' },
      { tag: 'O2', title: 'Reliability wins', body: 'KR: MTTR under 15m for Alert', icon: 'shield_moon', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  video: {
    toolTitle: 'MOxE VIDEO',
    toolIcon: 'videocam',
    eyebrow: 'Broadcast',
    headline: 'Recordings & live',
    description: 'Studio-grade capture grid with MOxE accents.',
    chips: [{ label: 'Library', active: true }, { label: 'Live' }, { label: 'Clips' }],
    cards: [
      { tag: 'Keynote', title: 'Q3 roadmap', body: '45:12 · processed', icon: 'movie', borderClass: 'border-l-4 border-primary' },
      { tag: 'Standup', title: 'Squad North · Oct 2', body: 'Auto-transcribed', icon: 'interpreter_mode', borderClass: 'border-l-4 border-outline-variant' },
    ],
  },
  chat: {
    toolTitle: 'MOxE CHAT',
    toolIcon: 'forum',
    eyebrow: 'Tactical comms',
    headline: 'Tickets & threads',
    description: 'Command-channel layout from CHAT bible screens.',
    chips: [{ label: 'My tickets', active: true }, { label: 'Channels' }, { label: 'Archive' }],
    cards: [
      { tag: 'P1', title: 'Auth latency regression', body: 'Assigned · 3 replies', icon: 'support_agent', borderClass: 'border-l-4 border-on-primary-container' },
      { tag: 'FYI', title: 'Launch comms template', body: 'Pinned in #status', icon: 'chat', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  source: {
    toolTitle: 'MOxE SOURCE',
    toolIcon: 'hub',
    eyebrow: 'Change fabric',
    headline: 'Repos & sync',
    description: 'Branch sync, imports, and change feeds.',
    chips: [{ label: 'Changes', active: true }, { label: 'Mirrors' }, { label: 'Policies' }],
    cards: [
      { tag: 'Sync', title: 'upstream/main → moxe/main', body: 'Clean · last run 2m ago', icon: 'sync', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Import', title: 'Bulk repo ingest', body: '12 queued', icon: 'cloud_upload', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  'code-search': {
    toolTitle: 'MOxE CODE SEARCH',
    toolIcon: 'search',
    eyebrow: 'Search terminal',
    headline: 'Query the mesh',
    description: 'Regex, path filters, and MOxE symbol graph — terminal aesthetic from bible.',
    chips: [{ label: 'Code', active: true }, { label: 'Symbols' }, { label: 'History' }],
    cards: [
      { tag: 'Hit', title: 'TrackService.updateStatus', body: 'BACKEND/src/services/job/track.service.ts', icon: 'data_object', borderClass: 'border-l-4 border-primary' },
      { tag: 'Hit', title: 'JobToolBibleShell', body: 'FRONTEND/components/job/bible/…', icon: 'widgets', borderClass: 'border-l-4 border-outline-variant' },
    ],
  },
  ai: {
    toolTitle: 'MOxE AI',
    toolIcon: 'psychology',
    eyebrow: 'Tactical AI',
    headline: 'Analysis & generation',
    description: 'Data analysis command deck from MOxE AI bible.',
    chips: [{ label: 'Analyze', active: true }, { label: 'Generate' }, { label: 'History' }],
    cards: [
      { tag: 'Run', title: 'Pipeline anomaly scout', body: 'Confidence 0.92 · suggestions ready', icon: 'auto_awesome', borderClass: 'border-l-4 border-secondary' },
      { tag: 'Draft', title: 'Status comms v2', body: 'Awaiting human publish', icon: 'edit_note', borderClass: 'border-l-4 border-primary' },
    ],
  },
  strategy: {
    toolTitle: 'MOxE STRATEGY',
    toolIcon: 'strategy',
    eyebrow: 'Executive command',
    headline: 'Portfolio & risk',
    description: 'Initiatives, allocation, and risk tiles per STRATEGY bible.',
    chips: [{ label: 'Portfolio', active: true }, { label: 'Timeline' }, { label: 'Risks' }],
    cards: [
      { tag: 'Bet', title: 'Global Track rollout', body: 'On track · dependencies green', icon: 'trending_up', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Risk', title: 'Vendor concentration', body: 'Mitigation in flight', icon: 'crisis_alert', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  profile: {
    toolTitle: 'MOxE PROFILE',
    toolIcon: 'person',
    eyebrow: 'Identity',
    headline: 'Job presence & privacy',
    description: 'Command-screen privacy layout from PROFILE bible.',
    chips: [{ label: 'Public', active: true }, { label: 'Teams' }, { label: 'Security' }],
    cards: [
      { tag: 'Visibility', title: 'Recruiter headline', body: 'Visible to org', icon: 'badge', borderClass: 'border-l-4 border-primary' },
      { tag: 'Tokens', title: 'API keys', body: '2 active · rotate in 9d', icon: 'key', borderClass: 'border-l-4 border-outline-variant' },
    ],
  },
  integration: {
    toolTitle: 'MOxE INTEGRATION',
    toolIcon: 'sync_alt',
    eyebrow: 'Mesh sync',
    headline: 'Connectors & rules',
    description: 'Sync rules and webhooks — INTEGRATION bible styling.',
    chips: [{ label: 'Connections', active: true }, { label: 'Rules' }, { label: 'Logs' }],
    cards: [
      { tag: 'HRIS', title: 'Workday ↔ Track', body: 'Incremental sync · healthy', icon: 'link', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'CI', title: 'GitHub → Build', body: 'Webhook v2', icon: 'electrical_services', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  scrum: {
    toolTitle: 'MOxE SCRUM',
    toolIcon: 'view_kanban',
    eyebrow: 'Ceremony hub',
    headline: 'Sprints & standups',
    description: 'Scrum boards, velocity, commitments.',
    chips: [{ label: 'Sprint', active: true }, { label: 'Backlog' }, { label: 'Retro' }],
    cards: [
      { tag: 'Sprint 42', title: 'Commitment', body: '32 pts planned · 6 carry-over', icon: 'event_repeat', borderClass: 'border-l-4 border-primary' },
      { tag: 'Standup', title: 'Today 09:30', body: 'Blockers: 1', icon: 'groups', borderClass: 'border-l-4 border-outline-variant' },
    ],
  },
  teams: {
    toolTitle: 'MOxE TEAMS',
    toolIcon: 'groups_2',
    eyebrow: 'People fabric',
    headline: 'Rosters & channels',
    description: 'Groups, roles, and MOxE seats.',
    chips: [{ label: 'Teams', active: true }, { label: 'Guests' }, { label: 'Roles' }],
    cards: [
      { tag: 'Squad', title: 'Platform North', body: '12 members · 2 on-call', icon: 'shield_person', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Guest', title: 'Vendor auditors', body: 'Time-bound access', icon: 'supervisor_account', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  docs: {
    toolTitle: 'MOxE DOCS',
    toolIcon: 'description',
    eyebrow: 'Library',
    headline: 'Documents & briefs',
    description: 'Authoring and library grid per DOCS bible.',
    chips: [{ label: 'Library', active: true }, { label: 'Drafts' }, { label: 'Shared' }],
    cards: [
      { tag: 'Memo', title: 'Q3 marketing strategy', body: 'Published · v3', icon: 'article', borderClass: 'border-l-4 border-primary' },
      { tag: 'Spec', title: 'API error taxonomy', body: 'Review requested', icon: 'integration_instructions', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  agile: {
    toolTitle: 'MOxE AGILE',
    toolIcon: 'view_column',
    eyebrow: 'Delivery',
    headline: 'Boards & backlog',
    description: 'Agile program views aligned with TRACK backlog bible.',
    chips: [{ label: 'Board', active: true }, { label: 'Epics' }, { label: 'Releases' }],
    cards: [
      { tag: 'Epic', title: 'Customer trust', body: '12 stories · 3 in flight', icon: 'track_changes', borderClass: 'border-l-4 border-on-primary-container' },
      { tag: 'Release', title: 'R2026.04', body: 'Feature freeze Friday', icon: 'new_releases', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  analytics: {
    toolTitle: 'MOxE ANALYTICS',
    toolIcon: 'bar_chart',
    eyebrow: 'Telemetry',
    headline: 'Insights & KPIs',
    description: 'Bento analytics from TEAM ANALYTICS bible slices.',
    chips: [{ label: 'Velocity', active: true }, { label: 'Quality' }, { label: 'People' }],
    cards: [
      { tag: 'KPI', title: 'Cycle time', body: '↓ 6% vs last sprint', icon: 'speed', borderClass: 'border-l-4 border-tertiary' },
      { tag: 'Quality', title: 'Defect escape', body: 'Within guardrails', icon: 'bug_report', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  access: {
    toolTitle: 'MOxE ACCESS',
    toolIcon: 'admin_panel_settings',
    eyebrow: 'Governance',
    headline: 'Permissions & policy',
    description: 'Seat rules, MFA posture, and tool entitlements — aligned with ACCESS bible screens.',
    chips: [
      { label: 'Policies', active: true },
      { label: 'Members' },
      { label: 'Audits' },
    ],
    cards: [
      {
        tag: 'Policy',
        title: 'Job tools entitlement',
        body: 'JOB accounts inherit Track, Know, Flow, and Ops modules per subscription tier.',
        icon: 'verified_user',
        borderClass: 'border-l-4 border-primary',
      },
      {
        tag: 'Review',
        title: 'Quarterly access review',
        body: 'Managers confirm seat assignments and guest expirations.',
        icon: 'fact_check',
        borderClass: 'border-l-4 border-secondary',
      },
    ],
  },
  alert: {
    toolTitle: 'MOxE ALERT',
    toolIcon: 'notifications_active',
    eyebrow: 'Signals',
    headline: 'On-call & coverage',
    description: 'Schedules, routes, and urgent feeds from ALERT bible.',
    chips: [{ label: 'Feed', active: true }, { label: 'Schedules' }, { label: 'Rules' }],
    cards: [
      { tag: 'Urgent', title: 'Auth SLO burn', body: 'Page sent ·_ack required_', icon: 'priority_high', borderClass: 'border-l-4 border-on-primary-container' },
      { tag: 'Rotation', title: 'Primary: you', body: 'Next handoff 18:00', icon: 'schedule', borderClass: 'border-l-4 border-secondary' },
    ],
  },
  recruiter: {
    toolTitle: 'MOxE TRACK · RECRUIT',
    toolIcon: 'groups',
    eyebrow: 'Talent OS',
    headline: 'Hiring command',
    description: 'Dashboard, talent search, pipeline, offers — recruiter hub chrome from bible.',
    chips: [
      { label: 'Dashboard', active: true },
      { label: 'Talent' },
      { label: 'Pipeline' },
      { label: 'Offers' },
    ],
    cards: [
      { tag: 'Req', title: 'Senior designer', body: '12 candidates · 3 onsite', icon: 'work', borderClass: 'border-l-4 border-primary' },
      { tag: 'Offer', title: 'Jane Doe · signed', body: 'Starts Nov 3', icon: 'contract', borderClass: 'border-l-4 border-tertiary' },
    ],
  },
  track: {
    toolTitle: 'MOxE TRACK',
    toolIcon: 'analytics',
    eyebrow: 'Applications',
    headline: 'Board + jobs',
    description: 'Kanban, postings, and pipelines — activity bible cues.',
    chips: [
      { label: 'Board', active: true },
      { label: 'Jobs' },
      { label: 'Mentions' },
    ],
    cards: [
      { tag: 'Move', title: 'Application status changed', body: 'You: Screening → Interview', icon: 'swap_vert', borderClass: 'border-l-4 border-primary' },
      { tag: 'Job', title: 'New posting: Staff engineer', body: 'Remote · posted 2h ago', icon: 'post_add', borderClass: 'border-l-4 border-secondary' },
    ],
  },
};
