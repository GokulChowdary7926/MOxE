import React from "react";
import { SlidersHorizontal } from "lucide-react";

export type TrackTopBarProps = {
  breadcrumbLeft?: string;
  breadcrumbRight?: string;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showFilter?: boolean;
  onBack?: () => void;
  onFilter?: () => void;
};

/** Track header — dark theme only (aligned with MOxE shell). */
export function TrackTopBar({
  breadcrumbLeft = "Project",
  breadcrumbRight = "TRACK-842",
  title,
  subtitle,
  showBack = true,
  showFilter = true,
  onBack = () => {},
  onFilter,
}: TrackTopBarProps) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "rgba(19,19,21,0.88)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid #48474A22",
      }}
    >
      <div className="px-4 py-3.5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center active:opacity-80 tabular-nums"
          style={{ color: "#0052CC" }}
        >
          <span className="text-[22px] leading-none font-semibold" aria-hidden>
            {'<'}
          </span>
        </button>

        <div className="flex-1 min-w-0">
          {!showBack ? (
            <div className="text-[22px] leading-none font-extrabold tracking-[-0.04em] truncate" style={{ color: "#F9F5F8" }}>
              MOxE TRACK
            </div>
          ) : null}
          <div className="text-[15px] leading-[1.2] font-extrabold truncate mt-1" style={{ color: "#8C9BAB" }}>
            {breadcrumbLeft} / <span style={{ color: "#E6EDF3" }}>{breadcrumbRight}</span>
          </div>
          {title ? (
            <div
              className="text-[43px] leading-[1.03] font-extrabold truncate mt-1 tracking-[-0.02em]"
              style={{ color: "#E6EDF3" }}
            >
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div className="text-[16px] leading-[1.2] truncate mt-1" style={{ color: "#8C9BAB" }}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {showFilter ? (
          <button
            type="button"
            onClick={onFilter}
            aria-label="Filter"
            className="rounded-xl p-2 active:opacity-80"
            style={{ color: "#E6EDF3" }}
          >
            <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
          </button>
        ) : (
          <div className="w-10" aria-hidden />
        )}
      </div>
    </header>
  );
}
