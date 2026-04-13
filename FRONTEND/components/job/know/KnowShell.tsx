import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { JobBibleReferenceSection, JobToolBibleShell } from '../bible';

type KnowNavKey = 'activity' | 'spaces' | 'labels' | 'drafts' | 'profile';

const KNOW_NAV: Array<{
  key: KnowNavKey;
  label: string;
  to: string;
  symbol: string;
}> = [
  { key: 'activity', label: 'Activity', to: '/job/know/activity', symbol: 'notifications' },
  { key: 'spaces', label: 'Spaces', to: '/job/know/spaces', symbol: 'folder' },
  { key: 'labels', label: 'Labels', to: '/job/know/labels', symbol: 'label' },
  { key: 'drafts', label: 'Drafts', to: '/job/know/drafts', symbol: 'draft' },
  { key: 'profile', label: 'Profile', to: '/job/know/profile', symbol: 'person' },
];

function isKnowTabActive(pathname: string, tabPath: string): boolean {
  if (tabPath === '/job/know/activity') {
    return (
      pathname === '/job/know' ||
      pathname === '/job/know/' ||
      pathname.startsWith('/job/know/activity') ||
      pathname.startsWith('/job/know/pages/')
    );
  }
  return pathname === tabPath || pathname.startsWith(`${tabPath}/`);
}

function TabIcon({ name, filled }: { name: string; filled: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-[18px] shrink-0"
      aria-hidden
      style={{ fontVariationSettings: filled ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}
    >
      {name}
    </span>
  );
}

/**
 * Know sub-routes only — no duplicate app chrome (JobMobileLayout owns header + 5-tab bottom bar).
 * Horizontal tabs match design-bible navy / primary accent pattern.
 */
export function KnowShell() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <JobToolBibleShell toolTitle="MOxE KNOW" toolIconMaterial="auto_stories">
    <div className="-mx-4 flex w-full min-w-0 flex-col">
      <div className="sticky top-0 z-20 border-b border-outline-variant/20 bg-surface-container-low/95 px-4 py-3 backdrop-blur-xl">
        <p className="mb-2 font-['Inter',system-ui,sans-serif] text-[10px] font-bold uppercase tracking-widest text-primary">
          Knowledge base
        </p>
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto pb-0.5">
          {KNOW_NAV.map(({ to, label, symbol }) => {
            const active = isKnowTabActive(path, to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 font-['Inter',system-ui,sans-serif] text-[11px] font-bold uppercase tracking-tight transition-colors ${
                  active
                    ? 'border-primary/40 bg-primary/15 text-primary shadow-sm'
                    : 'border-outline-variant/30 bg-surface-container/50 text-on-surface-variant active:opacity-100'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <TabIcon name={symbol} filled={active} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 w-full flex-1 px-4 pt-4">
        <Outlet />
        <JobBibleReferenceSection toolKey="know" />
      </div>
    </div>
    </JobToolBibleShell>
  );
}
