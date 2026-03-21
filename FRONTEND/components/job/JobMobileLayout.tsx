import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Briefcase,
  Users,
  LayoutGrid,
  Code,
  Video,
  MessageCircle,
  Search,
  Sparkles,
  Target,
  BarChart3,
  User,
  Plug,
  UsersRound,
  FileText,
  Shield,
  BookOpen,
  GitBranch,
  ClipboardList,
  Bell,
  Wrench,
  Compass,
  Trophy,
  ChevronLeft,
} from "lucide-react";
import { JOB_MOBILE } from "./jobMobileStyles";

type JobMobileLayoutProps = {
  children: React.ReactNode;
};

const MAIN_TABS = [
  { path: "/job/overview", label: "Home", Icon: Home },
  { path: "/job/track", label: "Work", Icon: Briefcase },
  { path: "/job/recruiter", label: "Recruit", Icon: Users },
] as const;

const MORE_ITEMS: {
  path: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { path: "/job/agile", label: "Agile", Icon: LayoutGrid },
  { path: "/job/scrum", label: "Scrum", Icon: ClipboardList },
  { path: "/job/code", label: "Code", Icon: Code },
  { path: "/job/video", label: "Video", Icon: Video },
  { path: "/job/chat", label: "Chat", Icon: MessageCircle },
  { path: "/job/source", label: "Source", Icon: GitBranch },
  { path: "/job/code-search", label: "Code Search", Icon: Search },
  { path: "/job/ai", label: "AI", Icon: Sparkles },
  { path: "/job/strategy", label: "Strategy", Icon: Target },
  { path: "/job/analytics", label: "Analytics", Icon: BarChart3 },
  { path: "/job/profile", label: "Profile", Icon: User },
  { path: "/job/integrations", label: "Integrations", Icon: Plug },
  { path: "/job/teams", label: "Teams", Icon: UsersRound },
  { path: "/job/docs", label: "Docs", Icon: FileText },
  { path: "/job/access", label: "Access", Icon: Shield },
  { path: "/job/status", label: "Status", Icon: BarChart3 },
  { path: "/job/know", label: "Know", Icon: BookOpen },
  { path: "/job/flow", label: "Flow", Icon: GitBranch },
  { path: "/job/work", label: "Work", Icon: Briefcase },
  { path: "/job/alert", label: "Alert", Icon: Bell },
  { path: "/job/build", label: "Build", Icon: Wrench },
  { path: "/job/compass", label: "Compass", Icon: Compass },
  { path: "/job/atlas", label: "Goals", Icon: Trophy },
];

export function JobMobileLayout({ children }: JobMobileLayoutProps) {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const path = location.pathname;
  const isActive = (tabPath: string) =>
    path === tabPath ||
    (tabPath !== "/job/overview" && path.startsWith(tabPath));

  return (
    <div className={`flex flex-col ${JOB_MOBILE.shell}`}>
      {/* Top bar – mobile-optimized, safe area */}
      <header className={JOB_MOBILE.header} style={{ minHeight: JOB_MOBILE.headerHeight }}>
        <Link
          to="/"
          className={`flex items-center gap-1 text-[#0052CC] dark:text-[#2684FF] font-medium text-sm rounded-lg active:opacity-80 ${JOB_MOBILE.touchMin} ${JOB_MOBILE.touchPadding}`}
          aria-label="Back to app"
        >
          <ChevronLeft className="w-5 h-5 flex-shrink-0" />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#172B4D] dark:text-[#E6EDF3] truncate flex-1 text-center">
          MOxE
        </h1>
        <div className="w-14 min-w-[56px]" aria-hidden />
      </header>

      {/* Main content – scrollable, room for bottom nav */}
      <main className={JOB_MOBILE.content}>{children}</main>

      {/* Bottom navigation – 44px+ touch targets */}
      <nav className={JOB_MOBILE.nav} style={{ minHeight: JOB_MOBILE.navHeight }} aria-label="Job tools">
        {MAIN_TABS.map(({ path: to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[56px] py-2 ${
                active
                  ? "text-[#0052CC] dark:text-[#2684FF]"
                  : "text-[#5E6C84] dark:text-[#8C9BAB]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                className="w-6 h-6 flex-shrink-0"
                strokeWidth={active ? 2.5 : 2}
                aria-hidden
              />
              <span className="text-[10px] font-medium truncate max-w-full">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 min-h-[56px] py-2 ${
            moreOpen || MORE_ITEMS.some((i) => path.startsWith(i.path))
              ? "text-[#0052CC] dark:text-[#2684FF]"
              : "text-[#5E6C84] dark:text-[#8C9BAB]"
          }`}
          aria-label="More Job tools"
          aria-expanded={moreOpen}
        >
          <LayoutGrid
            className="w-6 h-6 flex-shrink-0"
            strokeWidth={moreOpen ? 2.5 : 2}
            aria-hidden
          />
          <span className="text-[10px] font-medium truncate">More</span>
        </button>
      </nav>

      {/* More sheet – mobile drawer */}
      {moreOpen && (
        <>
          <div
            className={JOB_MOBILE.sheetOverlay}
            onClick={() => setMoreOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMoreOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <div
            className={JOB_MOBILE.sheet}
            style={{ animation: "jobSheetSlideUp 0.25s ease-out" }}
          >
            <div className={JOB_MOBILE.sheetHeader}>
              <h2 className={JOB_MOBILE.sheetTitle}>All tools</h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className={`p-2 rounded-xl text-[#5E6C84] dark:text-[#8C9BAB] active:bg-[#F4F5F7] dark:active:bg-[#2C333A] ${JOB_MOBILE.touchMin}`}
                aria-label="Close"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 py-2">
              {MORE_ITEMS.map(({ path: to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMoreOpen(false)}
                  className={`${JOB_MOBILE.sheetItem} ${path.startsWith(to) ? JOB_MOBILE.sheetItemActive : ""}`}
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#F4F5F7] dark:bg-[#2C333A] text-[#0052CC] dark:text-[#2684FF] flex-shrink-0">
                    <Icon className="w-5 h-5" aria-hidden />
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#172B4D] dark:text-[#E6EDF3] text-left">
                    {label}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-[#5E6C84] dark:text-[#8C9BAB] rotate-180 flex-shrink-0" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes jobSheetSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
