import React from "react";
import type { LucideIcon } from "lucide-react";
import { Grid3X3, ListChecks, Radar, Bell } from "lucide-react";

export type TrackTabKey = "board" | "backlog" | "sprints" | "alerts";

export type TrackBottomNavProps = {
  activeTab: TrackTabKey;
  onTabChange: (tab: TrackTabKey) => void;
};

/** MOxE Job tools primary (distinct from social accent blue). Dark theme only. */
const TRACK_NAV_PRIMARY = "#0052CC";

const NAV_ITEMS: Array<{
  key: TrackTabKey;
  label: string;
  Icon: LucideIcon;
}> = [
  { key: "board", label: "Board", Icon: Grid3X3 },
  { key: "backlog", label: "Backlog", Icon: ListChecks },
  { key: "sprints", label: "Sprints", Icon: Radar },
  { key: "alerts", label: "Alerts", Icon: Bell },
];

export function TrackBottomNav({ activeTab, onTabChange }: TrackBottomNavProps) {
  const borderColor = "#48474A33";
  const bgColor = "rgba(19,19,21,0.82)";

  return (
    <nav
      aria-label="Track navigation"
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl"
      style={{
        background: bgColor,
        borderTop: `1px solid ${borderColor}`,
        maxWidth: 428,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ key, label, Icon }) => {
          const active = key === activeTab;
          const activeColor = TRACK_NAV_PRIMARY;
          const inactiveColor = "#8C9BAB";
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-[14px] m-1"
              style={{
                color: active ? activeColor : inactiveColor,
                background: active ? "rgba(0,82,204,0.2)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px rgba(0,82,204,0.35)" : undefined,
              }}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] truncate mt-1">{label}</span>
              {active ? (
                <span className="mt-1 w-8 h-[2px] rounded-full" style={{ background: activeColor }} />
              ) : (
                <span className="mt-1 w-8 h-[2px]" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
