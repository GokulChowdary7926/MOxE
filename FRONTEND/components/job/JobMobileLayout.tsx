import React from "react";
import { Link, useLocation } from "react-router-dom";
import { JOB_MOBILE } from "./jobMobileStyles";
import { getJobBottomNavForPath } from "./jobBottomNavConfig";
type JobMobileLayoutProps = {
  children: React.ReactNode;
};

/** Design-bible Material Symbol: inactive FILL 0, active FILL 1 */
function BottomNavIcon({ name, filled }: { name: string; filled: boolean }) {
  return (
    <span
      className="material-symbols-outlined text-[22px]"
      aria-hidden
      style={{ fontVariationSettings: filled ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400" }}
    >
      {name}
    </span>
  );
}

export function JobMobileLayout({ children }: JobMobileLayoutProps) {
  const location = useLocation();
  const path = location.pathname;
  const bottomNavItems = getJobBottomNavForPath(path);

  const chrome = (
    <>
      <main className={`${JOB_MOBILE.content} safe-area-pt`}>{children}</main>

      <nav
        className="pointer-events-auto fixed bottom-0 left-1/2 z-[52] flex h-[4.5rem] w-full max-w-moxe-shell -translate-x-1/2 items-stretch justify-around border-t border-outline-variant/20 bg-[#0b1326]/92 px-1 pt-1 shadow-2xl backdrop-blur-xl safe-area-pb"
        aria-label="Job tools contextual navigation"
      >
        {bottomNavItems.map(({ path: to, label, symbol, match }) => {
          const active = match(path);
          return (
            <Link
              key={`${label}-${to}`}
              to={to}
              className={`flex min-w-0 max-w-[20%] flex-1 flex-col items-center justify-center gap-0.5 text-on-surface-variant transition-colors ${
                active ? "text-primary" : "opacity-55 hover:opacity-90"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <BottomNavIcon name={symbol} filled={active} />
              <span className={JOB_MOBILE.bottomNavLabel}>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return <div className={JOB_MOBILE.shell}>{chrome}</div>;
}
