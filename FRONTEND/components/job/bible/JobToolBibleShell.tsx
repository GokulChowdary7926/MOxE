import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { JOB_BIBLE_DRAWER_NAV, JOB_TOOL_LEADING_BACK, type BibleDrawerItem } from './jobBibleDrawerNav';
import { JOB_MOBILE } from '../jobMobileStyles';

function drawerItemActive(pathname: string, to: string): boolean {
  if (to === '/job/overview/home') {
    return pathname.startsWith('/job/overview');
  }
  if (to === '/job/know') {
    return pathname === '/job/know' || pathname.startsWith('/job/know/');
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

type JobToolBibleShellProps = {
  /** e.g. "MOxE FLOW" */
  toolTitle: string;
  /** Material symbol ligature */
  toolIconMaterial: string;
  children: React.ReactNode;
  /** Optional: extra nav entries below modules (per-tool) */
  extraNavItems?: BibleDrawerItem[];
  /**
   * `undefined` → default Job overview path. string → custom. `null` → hide control.
   */
  leadingBackTo?: string | null;
};

/**
 * Mobile-only chrome: compact tool bar + modules as a bottom sheet (not a persistent web sidebar).
 */
export function JobToolBibleShell({
  toolTitle,
  toolIconMaterial,
  children,
  extraNavItems = [],
  leadingBackTo,
}: JobToolBibleShellProps) {
  const backTarget = leadingBackTo === undefined ? JOB_TOOL_LEADING_BACK : leadingBackTo;
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const close = useCallback(() => setOpen(false), []);
  const allNav = [...JOB_BIBLE_DRAWER_NAV, ...extraNavItems];

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <div className="relative min-h-0 w-full">
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/60"
            onClick={close}
            aria-label="Close navigation"
          />
          <div
            className="fixed bottom-0 left-1/2 z-[60] flex w-full max-w-moxe-shell -translate-x-1/2 max-h-[min(92vh,100dvh)] flex-col rounded-t-[1.25rem] border-t border-[#2d3449]/30 bg-[#060e20] shadow-[0_-12px_40px_rgba(0,0,0,0.5)] safe-area-pb"
            role="dialog"
            aria-modal="true"
            aria-label="MOxE modules"
          >
            <div className="flex shrink-0 justify-center pt-2 pb-1" aria-hidden>
              <div className="h-1 w-10 rounded-full bg-on-surface-variant/30" />
            </div>
            <div className="flex shrink-0 items-center justify-between border-b border-[#2d3449]/15 px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="material-symbols-outlined shrink-0 text-2xl text-primary">terminal</span>
                <span className="truncate font-[Inter,system-ui,sans-serif] text-sm font-black uppercase tracking-wide text-primary">
                  MOxE modules
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-[#2d3449]/40 active:scale-95"
                aria-label="Close modules"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 no-scrollbar">
              <nav className="space-y-0.5 pb-2">
                {allNav.map(({ to, label, icon }) => {
                  const active = drawerItemActive(pathname, to);
                  return (
                    <Link
                      key={`${to}-${label}`}
                      to={to}
                      onClick={close}
                      className={`flex items-center gap-3 rounded-xl py-3 pl-3 pr-2 font-[Inter,system-ui,sans-serif] text-[11px] font-bold uppercase tracking-widest transition-all active:scale-[0.99] ${
                        active
                          ? 'bg-gradient-to-r from-on-primary-container to-primary text-on-primary shadow-md'
                          : 'text-slate-400 hover:bg-[#2d3449]/50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">{icon}</span>
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="shrink-0 border-t border-[#2d3449]/15 px-4 py-3">
              <div className="flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-surface-container-high text-xs font-bold text-tertiary">
                  MX
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-on-surface">Workspace</p>
                  <p className="text-[10px] uppercase tracking-tighter text-slate-500">Job Professional</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className={`${JOB_MOBILE.toolBar} relative z-40`}>
        <div className="flex shrink-0 items-center">
          {backTarget ? (
            <Link
              to={backTarget}
              className={JOB_MOBILE.toolBarIconBtn}
              aria-label="Back to home feed"
            >
              <span className="font-headline text-[22px] font-bold leading-none text-primary" aria-hidden>
                &lt;
              </span>
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={JOB_MOBILE.toolBarIconBtn}
            aria-label="Open modules menu"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        </div>
        <span className="material-symbols-outlined shrink-0 text-[24px] text-primary">{toolIconMaterial}</span>
        <div className="min-w-0 flex-1">
          <p className={JOB_MOBILE.toolBarEyebrow}>Current tool</p>
          <h2 className={JOB_MOBILE.toolBarTitle}>{toolTitle}</h2>
        </div>
      </div>

      <div className="space-y-5 pb-2">{children}</div>
    </div>
  );
}
