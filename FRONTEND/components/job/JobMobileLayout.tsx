import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
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
} from "lucide-react";

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
    <div className="flex flex-col min-h-[100dvh] min-h-screen w-full max-w-[428px] mx-auto bg-[#F4F5F7] dark:bg-[#161A1D]">
      {/* Top bar – Atlassian-style */}
      <header
        className="flex-shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-[#1D2125] border-b border-[#DFE1E6] dark:border-[#2C333A] safe-area-pt"
        style={{ minHeight: 56 }}
      >
        <Link
          to="/"
          className="flex items-center gap-1 text-[#0052CC] dark:text-[#2684FF] font-medium text-sm px-2 py-1.5 rounded hover:bg-[#DEEBFF] dark:hover:bg-[#1D2125]"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </Link>
        <h1 className="text-base font-semibold text-[#172B4D] dark:text-[#E6EDF3] truncate flex-1 text-center">
          MOxE Job
        </h1>
        <div className="w-14" />
      </header>

      {/* Main content – scrollable */}
      <div className="flex-1 min-h-0 overflow-auto px-4 py-4 pb-24">{children}</div>

      {/* Bottom navigation – Atlassian-style */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto z-30 flex items-stretch bg-white dark:bg-[#1D2125] border-t border-[#DFE1E6] dark:border-[#2C333A] safe-area-pb"
        style={{ height: 56 }}
      >
        {MAIN_TABS.map(({ path: to, label, Icon }) => {
          const active = isActive(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 ${
                active
                  ? "text-[#0052CC] dark:text-[#2684FF]"
                  : "text-[#5E6C84] dark:text-[#8C9BAB]"
              }`}
            >
              <Icon
                className="w-6 h-6 flex-shrink-0"
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-[10px] font-medium truncate max-w-full">
                {label}
              </span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-w-0 py-2 ${
            moreOpen || MORE_ITEMS.some((i) => path.startsWith(i.path))
              ? "text-[#0052CC] dark:text-[#2684FF]"
              : "text-[#5E6C84] dark:text-[#8C9BAB]"
          }`}
        >
          <LayoutGrid
            className="w-6 h-6 flex-shrink-0"
            strokeWidth={moreOpen ? 2.5 : 2}
          />
          <span className="text-[10px] font-medium truncate">More</span>
        </button>
      </nav>

      {/* More sheet – full-screen overlay list */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setMoreOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setMoreOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <div
            className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto z-50 rounded-t-2xl bg-white dark:bg-[#1D2125] shadow-xl max-h-[85vh] overflow-hidden flex flex-col safe-area-pb"
            style={{ animation: "slideUp 0.25s ease-out" }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#DFE1E6] dark:border-[#2C333A]">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-[#E6EDF3]">
                All tools
              </h2>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="p-2 rounded-lg text-[#5E6C84] dark:text-[#8C9BAB] hover:bg-[#F4F5F7] dark:hover:bg-[#2C333A]"
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
                  className={`flex items-center gap-3 px-4 py-3 active:bg-[#DEEBFF] dark:active:bg-[#2C333A] ${
                    path.startsWith(to)
                      ? "bg-[#DEEBFF]/50 dark:bg-[#2C333A]"
                      : ""
                  }`}
                  style={{ minHeight: 48 }}
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#F4F5F7] dark:bg-[#2C333A] text-[#0052CC] dark:text-[#2684FF]">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-[#172B4D] dark:text-[#E6EDF3]">
                    {label}
                  </span>
                  <ChevronLeft className="w-5 h-5 text-[#5E6C84] dark:text-[#8C9BAB] rotate-180" />
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
