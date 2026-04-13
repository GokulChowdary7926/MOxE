import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../services/api";
import {
  AtSign,
  Bell,
  CalendarDays,
  CalendarX,
  ChevronUp,
  Clock,
  Info,
  ListOrdered,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { TrackBottomNav, type TrackTabKey } from "./TrackBottomNav";
import { TrackTopBar } from "./TrackTopBar";

type IssuePriority = "Low" | "Medium" | "High";

type Issue = {
  id: string;
  summary: string;
  description: string;
  priority: IssuePriority;
  /** Board column name from Track API */
  status: string;
  columnId: string;
  assignee?: string;
  issueType?: string;
  storyPoints?: number;
  attachments?: Array<{ id: string; name: string }>;
  createdAt?: string;
  updatedAt?: string;
};

type ApiAccountBrief = { id: string; displayName?: string | null; username?: string | null };
type ApiIssueRow = {
  id: string;
  summary: string;
  description?: string | null;
  priority: string;
  issueType: string;
  storyPoints?: number | null;
  columnId: string;
  assignee?: ApiAccountBrief | null;
  createdAt?: string;
  updatedAt?: string;
  attachments?: Array<{ id: string; fileName?: string | null; name?: string | null }>;
};
type ApiBoardColumn = { id: string; name: string; order: number; issues: ApiIssueRow[] };
type ApiBoardProject = {
  id: string;
  name: string;
  columns: ApiBoardColumn[];
};
type ApiTrackProject = { id: string; name: string; template?: string };

type TrackAgileReportsPayload = {
  empty: boolean;
  projectId: string;
  projectName: string;
  doneColumnName: string;
  window: string;
  velocityWeeks: { label: string; points: number }[];
  velocityChangePct: number;
  priorityMix: { critical: number; high: number; medium: number; low: number; total: number };
  burndown: { label: string; remaining: number; ideal: number }[];
  summary: {
    completedInRange: number;
    completedPointsInRange: number;
    openIssues: number;
    openPointsNow: number;
    medianCycleDays: number | null;
    onTimeSprintPct: number | null;
    initialScope: number;
  };
  throughput: { assigneeId: string | null; displayName: string; points: number }[];
};

type JobInsightsMetrics = {
  totalApplications: number;
  applicationsInRange: number;
  applicationsChange: number;
  trackProjects: number;
  flowCards: number;
};

function mapApiPriority(p: string | undefined): IssuePriority {
  const u = (p || "MEDIUM").toUpperCase();
  if (u === "HIGH" || u === "HIGHEST") return "High";
  if (u === "LOW" || u === "LOWEST") return "Low";
  return "Medium";
}

function formatIssueType(t: string | undefined) {
  const raw = (t || "TASK").replace(/_/g, " ").toLowerCase();
  return raw.replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapApiIssueToIssue(api: ApiIssueRow, columnName: string): Issue {
  const assignee = api.assignee?.displayName?.trim() || api.assignee?.username?.trim() || undefined;
  const attachments = (api.attachments || []).map((a) => ({
    id: a.id,
    name: (a.fileName || a.name || "attachment") as string,
  }));
  return {
    id: api.id,
    summary: api.summary,
    description: api.description ?? "",
    priority: mapApiPriority(api.priority),
    status: columnName,
    columnId: api.columnId,
    assignee,
    issueType: formatIssueType(api.issueType),
    storyPoints: api.storyPoints ?? undefined,
    attachments: attachments.length ? attachments : undefined,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

function buildTrackQuery(filters: { query: string; priority: "Any" | IssuePriority }) {
  const p = new URLSearchParams();
  const q = filters.query.trim();
  if (q) p.set("q", q);
  if (filters.priority !== "Any") p.set("priority", filters.priority.toUpperCase());
  const s = p.toString();
  return s ? `?${s}` : "";
}

type PageKey = "tab" | "issueDetail" | "createProject" | "initializeSprint" | "createTask";
/** Dark dashboard shell (MOxE TRACK reference: monolith board) */
const TRACK_PAGE_BG = "#0A0A0C";
const TRACK_PRIMARY = "#0052CC";
const TRACK_PRIMARY_SHADOW = "0 10px 22px rgba(0,82,204,0.35)";
const TRACK_OUTLINE = "#2D2D35";
const TRACK_PANEL_BORDER = `1px solid ${TRACK_OUTLINE}`;
const TRACK_PANEL_BG = "#131315";
const TRACK_CARD_BG = "#141417";
const TRACK_CARD_BORDER = `1px solid ${TRACK_OUTLINE}`;
const TRACK_RADIUS_PANEL = 22;
const TRACK_RADIUS_CARD = 14;
const TRACK_SURFACE = {
  panel: { background: TRACK_PANEL_BG, border: TRACK_PANEL_BORDER, borderRadius: TRACK_RADIUS_PANEL },
  card: { background: TRACK_CARD_BG, border: TRACK_CARD_BORDER, borderRadius: TRACK_RADIUS_CARD },
  cardMuted: { background: "#141417", border: TRACK_CARD_BORDER, borderRadius: TRACK_RADIUS_PANEL },
  cardDeeper: { background: "#0E1015", border: TRACK_CARD_BORDER, borderRadius: TRACK_RADIUS_CARD },
  input: { background: TRACK_CARD_BG, border: TRACK_CARD_BORDER, color: "#E6EDF3", outline: "none" as const },
  buttonSecondary: { background: TRACK_CARD_BG, border: TRACK_CARD_BORDER, color: "#E6EDF3" },
  buttonPrimary: {
    background: TRACK_PRIMARY,
    color: "#fff",
    border: "none",
    boxShadow: TRACK_PRIMARY_SHADOW,
  },
};

function priorityColor(priority: IssuePriority) {
  switch (priority) {
    case "High":
      return "#FF5630";
    case "Medium":
      return "#FFAB00";
    default:
      return "#36B37E";
  }
}

type QuickEntryDraft = {
  summary: string;
  description: string;
  priority: IssuePriority;
  issueType: string;
};

function formatAssignee(name?: string) {
  return name && name.trim() ? name : "Unassigned";
}

function formatIssueDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function ModalShell(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { open, title, onClose, children, footer } = props;
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.45)" }}
      />
      <div
        className="relative w-full max-w-full shadow-xl overflow-hidden"
        style={{
          background: TRACK_PANEL_BG,
          border: TRACK_PANEL_BORDER,
          borderBottom: "none",
          borderTopLeftRadius: TRACK_RADIUS_PANEL,
          borderTopRightRadius: TRACK_RADIUS_PANEL,
        }}
      >
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: TRACK_PANEL_BORDER }}>
          <div className="text-[30px] leading-[1.08] font-extrabold tracking-[-0.02em]" style={{ color: "#E6EDF3" }}>
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl active:opacity-80"
            aria-label="Close"
            style={{ color: "#E6EDF3" }}
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto px-4 py-3">{children}</div>
        {footer ? (
          <div className="px-4 py-3" style={{ borderTop: TRACK_PANEL_BORDER }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function initialsFromDisplay(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildBurndownChartPaths(rows: { remaining: number; ideal: number }[]) {
  if (rows.length < 2) {
    return { fillD: "", actualD: "", idealD: "" };
  }
  const max = Math.max(1, ...rows.flatMap((r) => [r.remaining, r.ideal]));
  const x0 = 36;
  const x1 = 392;
  const yTop = 24;
  const yBot = 124;
  const yBase = 132;
  const n1 = rows.length - 1;
  const toY = (v: number) => yTop + (1 - v / max) * (yBot - yTop);
  let idealD = "";
  let actualD = "";
  rows.forEach((r, i) => {
    const x = x0 + (i / n1) * (x1 - x0);
    const yi = toY(r.ideal);
    const ya = toY(r.remaining);
    idealD += i === 0 ? `M ${x} ${yi}` : ` L ${x} ${yi}`;
    actualD += i === 0 ? `M ${x} ${ya}` : ` L ${x} ${ya}`;
  });
  const lastX = x1;
  const fillD = `${actualD} L ${lastX} ${yBase} L ${x0} ${yBase} Z`;
  return { fillD, actualD, idealD };
}

function TrackAgileReportsCharts({
  reportsData,
  reportsLoading,
  reportsError,
  jobInsightsMetrics,
}: {
  reportsData: TrackAgileReportsPayload | null;
  reportsLoading: boolean;
  reportsError: string | null;
  jobInsightsMetrics: JobInsightsMetrics | null;
}) {
  if (reportsLoading) {
    return (
      <p className="text-sm py-6" style={{ color: "#8C9BAB" }}>
        Loading analytics…
      </p>
    );
  }
  if (reportsError) {
    return (
      <p className="text-sm py-3 px-4 rounded-xl" style={{ background: "rgba(255,86,48,0.12)", color: "#FF5630" }}>
        {reportsError}
      </p>
    );
  }
  if (!reportsData) {
    return null;
  }
  if (reportsData.empty) {
    return (
      <div className="rounded-2xl p-8 text-center space-y-2" style={TRACK_SURFACE.cardMuted}>
        <p className="font-semibold" style={{ color: "#E6EDF3" }}>
          No issues in {reportsData.projectName}
        </p>
        <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "#8C9BAB" }}>
          Add work to the backlog or board to see velocity, burndown, and priority mix. Data comes from{" "}
          <span style={{ color: TRACK_PRIMARY }}>/api/job/analytics/track-agile</span> for the selected project and range.
        </p>
      </div>
    );
  }

  const maxV = Math.max(1, ...reportsData.velocityWeeks.map((w) => w.points));
  const pm = reportsData.priorityMix;
  const ptot = pm.total > 0;
  const pct = (n: number) => (ptot ? Math.round((n / pm.total) * 100) : 0);
  const { fillD, actualD, idealD } = buildBurndownChartPaths(reportsData.burndown);
  const sum = reportsData.summary;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl p-4 min-w-0" style={TRACK_SURFACE.cardMuted}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#E6EDF3" }}>
                Sprint velocity
              </div>
              <p className="text-xs mt-1" style={{ color: "#8C9BAB" }}>
                Story points completed in <span className="font-semibold" style={{ color: "#E6EDF3" }}>{reportsData.doneColumnName}</span>{" "}
                per rolling week.
              </p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
              style={{ background: "rgba(0,82,204,0.2)", color: TRACK_PRIMARY }}
            >
              {reportsData.velocityChangePct >= 0 ? "+" : ""}
              {reportsData.velocityChangePct}% vs prior week
            </span>
          </div>
          <div className="flex items-end gap-3 h-40 pt-2">
            {reportsData.velocityWeeks.map((s, idx) => {
              const h = (s.points / maxV) * 100;
              const live = idx === reportsData.velocityWeeks.length - 1;
              return (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                  <div
                    className="w-full flex flex-col justify-end h-32 rounded-lg overflow-hidden"
                    style={{ background: "#0E0E10", border: TRACK_CARD_BORDER }}
                  >
                    <div
                      className="w-full rounded-b-lg transition-all"
                      style={{
                        height: `${h}%`,
                        minHeight: 8,
                        background: live
                          ? "linear-gradient(180deg, #003D9B, #0052CC)"
                          : "linear-gradient(180deg, rgba(0,82,204,0.45), rgba(0,82,204,0.15))",
                        borderTop: live ? `2px solid ${TRACK_PRIMARY}` : undefined,
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold truncate w-full text-center"
                    style={{ color: live ? TRACK_PRIMARY : "#8C9BAB" }}
                  >
                    {s.label}
                    {live ? " · Latest" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 min-w-0">
          <div className="rounded-2xl p-4 flex-1" style={TRACK_SURFACE.card}>
            <div className="text-[11px]" style={{ color: "#8C9BAB" }}>
              On-time (due date)
            </div>
            <div className="text-3xl font-bold mt-1" style={{ color: "#E6EDF3" }}>
              {sum.onTimeSprintPct == null ? "—" : `${sum.onTimeSprintPct}%`}
            </div>
            <div className="text-[11px] mt-1 flex items-center gap-1" style={{ color: "#8C9BAB" }}>
              {sum.onTimeSprintPct == null ? "No completed issues with due dates in range" : "Done issues vs due date"}
            </div>
          </div>
          <div
            className="rounded-2xl p-4 flex-1"
            style={{
              background: "linear-gradient(145deg, #003D9B, #0052CC)",
              border: "1px solid rgba(0,82,204,0.45)",
              boxShadow: TRACK_PRIMARY_SHADOW,
            }}
          >
            <div className="text-[11px]" style={{ color: "#DAE2FF" }}>
              Median cycle time
            </div>
            <div className="text-3xl font-bold mt-1" style={{ color: "#fff" }}>
              {sum.medianCycleDays == null ? "—" : `${sum.medianCycleDays}d`}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "#DAE2FF" }}>
              Create → done, issues completed in range
            </div>
          </div>
          <div className="rounded-2xl p-4 flex-1" style={TRACK_SURFACE.card}>
            <div className="text-[11px]" style={{ color: "#8C9BAB" }}>
              Open on board
            </div>
            <div className="text-3xl font-bold mt-1" style={{ color: "#E6EDF3" }}>
              {sum.openIssues}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "#8C9BAB" }}>
              ~{sum.openPointsNow} pts outside {reportsData.doneColumnName}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl p-4 min-w-0" style={TRACK_SURFACE.cardMuted}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#E6EDF3" }}>
              Burndown
            </div>
            <span className="text-[10px]" style={{ color: "#8C9BAB" }}>
              Scope in range · ideal vs remaining
            </span>
          </div>
          <svg viewBox="0 0 400 140" className="w-full h-36" aria-hidden>
            <defs>
              <linearGradient id="trackBurnFillLive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(0,82,204,0.35)" />
                <stop offset="100%" stopColor="rgba(0,82,204,0.02)" />
              </linearGradient>
            </defs>
            {[24, 48, 72, 96, 120].map((y) => (
              <line key={y} x1="36" y1={y} x2="392" y2={y} stroke="rgba(140,155,171,0.15)" strokeWidth="1" />
            ))}
            {idealD ? (
              <path d={idealD} fill="none" stroke="rgba(140,155,171,0.45)" strokeWidth="2" strokeDasharray="6 4" />
            ) : null}
            {fillD ? <path d={fillD} fill="url(#trackBurnFillLive)" /> : null}
            {actualD ? (
              <path
                d={actualD}
                fill="none"
                stroke={TRACK_PRIMARY}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            <text x="36" y="134" fill="#8C9BAB" fontSize="9">
              Start
            </text>
            <text x="340" y="134" fill="#8C9BAB" fontSize="9">
              Now
            </text>
          </svg>
          <div className="flex flex-wrap gap-4 mt-1 text-[10px]" style={{ color: "#8C9BAB" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: "rgba(140,155,171,0.6)" }} />
              Ideal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: TRACK_PRIMARY }} />
              Remaining work
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-4 min-w-0" style={TRACK_SURFACE.cardMuted}>
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#E6EDF3" }}>
            Priority mix (current)
          </div>
          <div className="flex h-3 rounded-full overflow-hidden mb-4" style={{ background: "#0E0E10", border: TRACK_CARD_BORDER }}>
            {ptot ? (
              <>
                <div style={{ width: `${pct(pm.critical)}%`, background: "#FF5630" }} title="Critical" />
                <div style={{ width: `${pct(pm.high)}%`, background: "#FF991F" }} title="High" />
                <div style={{ width: `${pct(pm.medium)}%`, background: "#FFAB00" }} title="Medium" />
                <div style={{ width: `${pct(pm.low)}%`, background: "#36B37E" }} title="Low" />
              </>
            ) : null}
          </div>
          <ul className="space-y-2.5 text-[11px]">
            {(
              [
                { label: "Critical", n: pm.critical, color: "#FF5630" },
                { label: "High", n: pm.high, color: "#FF991F" },
                { label: "Medium", n: pm.medium, color: "#FFAB00" },
                { label: "Low", n: pm.low, color: "#36B37E" },
              ] as const
            ).map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                  <span className="truncate" style={{ color: "#8C9BAB" }}>
                    {row.label}
                  </span>
                </span>
                <span className="font-bold tabular-nums shrink-0" style={{ color: "#E6EDF3" }}>
                  {ptot ? `${pct(row.n)}%` : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={TRACK_SURFACE.cardMuted}>
        <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: TRACK_OUTLINE }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "#E6EDF3" }}>
            Throughput by assignee
          </div>
          <span className="text-[10px]" style={{ color: "#8C9BAB" }}>
            Points in {reportsData.doneColumnName} · window
          </span>
        </div>
        <div className="overflow-x-auto">
          {reportsData.throughput.length === 0 ? (
            <p className="px-4 py-6 text-sm" style={{ color: "#8C9BAB" }}>
              No completed issues in this range.
            </p>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr style={{ color: "#8C9BAB", borderBottom: `1px solid ${TRACK_OUTLINE}` }}>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Points</th>
                  <th className="px-4 py-3 font-semibold text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {reportsData.throughput.map((row) => (
                  <tr key={row.displayName + String(row.assigneeId)} style={{ borderBottom: `1px solid ${TRACK_OUTLINE}` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{
                            background: "rgba(0,82,204,0.2)",
                            color: TRACK_PRIMARY,
                            border: `1px solid rgba(0,82,204,0.35)`,
                          }}
                        >
                          {initialsFromDisplay(row.displayName)}
                        </div>
                        <span className="font-semibold truncate" style={{ color: "#E6EDF3" }}>
                          {row.displayName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums font-bold" style={{ color: "#F9F5F8" }}>
                      {row.points}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Minus className="w-4 h-4 inline" style={{ color: "#8C9BAB" }} strokeWidth={2.5} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {jobInsightsMetrics ? (
          [
            {
              title: "Job applications",
              value: String(jobInsightsMetrics.applicationsInRange),
              hint: `${jobInsightsMetrics.applicationsChange >= 0 ? "+" : ""}${jobInsightsMetrics.applicationsChange}% vs prior window · account`,
              icon: <ShieldCheck className="w-5 h-5" style={{ color: "#36B37E" }} strokeWidth={2} />,
            },
            {
              title: "Track projects",
              value: String(jobInsightsMetrics.trackProjects),
              hint: "Total across your job workspace",
              icon: <Info className="w-5 h-5" style={{ color: "#FFAB00" }} strokeWidth={2} />,
            },
            {
              title: "Flow cards",
              value: String(jobInsightsMetrics.flowCards),
              hint: "From /api/job/analytics/insights",
              icon: <Clock className="w-5 h-5" style={{ color: TRACK_PRIMARY }} strokeWidth={2} />,
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl p-4" style={TRACK_SURFACE.card}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                  {card.title}
                </div>
                {card.icon}
              </div>
              <div className="text-2xl font-bold mt-2" style={{ color: "#E6EDF3" }}>
                {card.value}
              </div>
              <div className="text-[11px] mt-1 leading-snug" style={{ color: "#8C9BAB" }}>
                {card.hint}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm" style={{ color: "#8C9BAB" }}>
            Job-wide metrics unavailable.
          </p>
        )}
      </div>
    </>
  );
}

export function TrackAgileApp({
  initialTab,
  initialAlertsSubTab,
  /** When true, hide agile top/bottom bars (use under `JobToolBibleShell` + `JobMobileLayout`). */
  suppressAgileChrome = false,
}: {
  initialTab: TrackTabKey;
  initialAlertsSubTab?: "alerts" | "reports";
  suppressAgileChrome?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TrackTabKey>(initialTab);
  const [alertsSubTab, setAlertsSubTab] = useState<"alerts" | "reports">(
    initialAlertsSubTab ?? "alerts",
  );
  const [reportsRange, setReportsRange] = useState<"sprint" | "30d">("sprint");
  const [reportsData, setReportsData] = useState<TrackAgileReportsPayload | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [jobInsightsMetrics, setJobInsightsMetrics] = useState<JobInsightsMetrics | null>(null);
  const [page, setPage] = useState<PageKey>("tab");
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueDetail, setIssueDetail] = useState<Issue | null>(null);
  const [issueDetailLoading, setIssueDetailLoading] = useState(false);

  const [projects, setProjects] = useState<ApiTrackProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [boardProject, setBoardProject] = useState<ApiBoardProject | null>(null);
  const [backlogRows, setBacklogRows] = useState<ApiIssueRow[]>([]);
  const [trackLoadError, setTrackLoadError] = useState<string | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [movingIssueId, setMovingIssueId] = useState<string | null>(null);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);

  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [newProjectName, setNewProjectName] = useState("");

  const [quickDraft, setQuickDraft] = useState<QuickEntryDraft>({
    summary: "",
    description: "",
    priority: "Medium",
    issueType: "Task",
  });

  useEffect(() => {
    setActiveTab(initialTab);
    setAlertsSubTab(initialAlertsSubTab ?? "alerts");
  }, [initialTab, initialAlertsSubTab]);

  const [filters, setFilters] = useState({
    query: "",
    priority: "Any" as "Any" | IssuePriority,
    assignee: "Any" as "Any" | string,
  });

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const refreshTrackData = useCallback(async () => {
    if (!selectedProjectId) {
      setBoardProject(null);
      setBacklogRows([]);
      return;
    }
    const q = buildTrackQuery({ query: filters.query, priority: filters.priority });
    setTrackLoading(true);
    setTrackLoadError(null);
    try {
      const [board, backlog] = await Promise.all([
        apiFetch<ApiBoardProject>(`job/track/projects/${selectedProjectId}/board${q}`),
        apiFetch<ApiIssueRow[]>(`job/track/projects/${selectedProjectId}/backlog${q}`),
      ]);
      setBoardProject(board);
      setBacklogRows(backlog);
    } catch (e: unknown) {
      setTrackLoadError(e instanceof Error ? e.message : "Failed to load board");
      setBoardProject(null);
      setBacklogRows([]);
    } finally {
      setTrackLoading(false);
    }
  }, [selectedProjectId, filters.query, filters.priority]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<ApiTrackProject[]>("job/track/projects");
        if (cancelled) return;
        setProjects(list);
        setSelectedProjectId((prev) => prev ?? (list[0]?.id ?? null));
      } catch (e: unknown) {
        if (!cancelled) setTrackLoadError(e instanceof Error ? e.message : "Failed to load projects");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshTrackData();
  }, [refreshTrackData]);

  useEffect(() => {
    if (alertsSubTab !== "reports" || !selectedProjectId) {
      setReportsData(null);
      setReportsError(null);
      setJobInsightsMetrics(null);
      return;
    }
    let cancelled = false;
    const range = reportsRange === "30d" ? "30d" : "sprint";
    const insightRange = reportsRange === "30d" ? "30d" : "7d";
    (async () => {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const [rep, ins] = await Promise.all([
          apiFetch<TrackAgileReportsPayload>(
            `job/analytics/track-agile?projectId=${encodeURIComponent(selectedProjectId)}&range=${range}`,
          ),
          apiFetch<{ metrics: JobInsightsMetrics }>(`job/analytics/insights?range=${insightRange}`),
        ]);
        if (cancelled) return;
        setReportsData(rep);
        setJobInsightsMetrics(ins.metrics);
      } catch (e: unknown) {
        if (!cancelled) {
          setReportsError(e instanceof Error ? e.message : "Failed to load reports");
          setReportsData(null);
          setJobInsightsMetrics(null);
        }
      } finally {
        if (!cancelled) setReportsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [alertsSubTab, selectedProjectId, reportsRange]);

  useEffect(() => {
    if (page !== "issueDetail" || !selectedIssueId) {
      setIssueDetail(null);
      setIssueDetailLoading(false);
      return;
    }
    let cancelled = false;
    setIssueDetailLoading(true);
    (async () => {
      try {
        const raw = await apiFetch<
          ApiIssueRow & { column?: { id: string; name: string } | null }
        >(`job/track/issues/${selectedIssueId}`);
        if (cancelled) return;
        const colName = raw.column?.name || "—";
        setIssueDetail(mapApiIssueToIssue(raw, colName));
      } catch {
        if (!cancelled) setIssueDetail(null);
      } finally {
        if (!cancelled) setIssueDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, selectedIssueId]);

  const assigneeOptions = useMemo(() => {
    const names = new Set<string>();
    boardProject?.columns?.forEach((c) =>
      c.issues.forEach((r) => {
        const n = r.assignee?.displayName?.trim() || r.assignee?.username?.trim();
        if (n) names.add(n);
      }),
    );
    backlogRows.forEach((r) => {
      const n = r.assignee?.displayName?.trim() || r.assignee?.username?.trim();
      if (n) names.add(n);
    });
    return Array.from(names).sort();
  }, [boardProject, backlogRows]);

  const boardColumns = useMemo(() => {
    if (!boardProject?.columns?.length) return [];
    return boardProject.columns.map((col) => {
      const issues = col.issues
        .map((row) => mapApiIssueToIssue(row, col.name))
        .filter((i) => {
          if (filters.assignee === "Any") return true;
          return formatAssignee(i.assignee) === filters.assignee;
        });
      return { id: col.id, name: col.name, issues };
    });
  }, [boardProject, filters.assignee]);

  const backlogIssues = useMemo(() => {
    return backlogRows
      .map((row) => mapApiIssueToIssue(row, "Backlog"))
      .filter((i) => {
        if (filters.assignee === "Any") return true;
        return formatAssignee(i.assignee) === filters.assignee;
      });
  }, [backlogRows, filters.assignee]);

  const handleMoveIssue = async (issueId: string, targetColumnId: string) => {
    if (!selectedProjectId || movingIssueId) return;
    let currentColumnId: string | null = null;
    boardProject?.columns.forEach((c) => {
      if (c.issues.some((row) => row.id === issueId)) currentColumnId = c.id;
    });
    if (currentColumnId === targetColumnId) return;
    setMovingIssueId(issueId);
    try {
      await apiFetch(`job/track/issues/${issueId}/move`, {
        method: "PATCH",
        body: { targetColumnId },
      });
      await refreshTrackData();
    } finally {
      setMovingIssueId(null);
    }
  };

  const selectedIssue = issueDetail;

  const onOpenIssue = (id: string) => {
    setSelectedIssueId(id);
    setPage("issueDetail");
  };

  const closeIssue = () => {
    setPage("tab");
  };

  const resetToTab = (tab: TrackTabKey) => {
    setActiveTab(tab);
    setPage("tab");
  };

  const fabTitle = activeTab === "sprints" ? "Create Task" : "Quick Entry";

  const navigate = useNavigate();

  useEffect(() => {
    const ensureLink = (id: string, href: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };
    ensureLink(
      "moxe-track-manrope-font",
      "https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap",
    );
    ensureLink(
      "moxe-track-material-symbols",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    );
  }, []);

  return (
    <div
      className={suppressAgileChrome ? "min-h-0 w-full min-w-0 flex-1" : "min-h-[100dvh] w-full min-w-0"}
      style={{
        background: TRACK_PAGE_BG,
        color: "#F1F3FF",
        fontFamily: "Manrope, Inter, system-ui, sans-serif",
      }}
    >
      {!suppressAgileChrome ? (
      <TrackTopBar
        showBack={page !== "tab"}
        onBack={() => {
          if (page !== "tab") {
            setPage("tab");
            return;
          }
          navigate(-1);
        }}
        breadcrumbLeft="Project"
        breadcrumbRight={
          page === "issueDetail" && selectedIssueId
            ? selectedIssueId.slice(0, 12)
            : selectedProject?.name
              ? selectedProject.name.slice(0, 28)
              : "—"
        }
        title={page === "issueDetail" ? "Issue Detail" : activeTab === "board" ? "Board" : activeTab === "backlog" ? "Backlog Management" : activeTab === "sprints" ? "Sprints" : "Alerts / Reports"}
        subtitle={
          page === "issueDetail"
            ? "Issue detail and workflow context"
            : activeTab === "board"
              ? "Kanban view with issue cards"
              : activeTab === "backlog"
                ? "Triage, filters, and quick entry"
                : activeTab === "sprints"
                  ? "Sprint timeline and creation"
                  : alertsSubTab === "alerts"
                    ? "Operational alerts & severities"
                    : "Performance reports overview"
        }
        onFilter={() => {
          if (page !== "tab") return;
          setFiltersOpen(true);
        }}
      />
      ) : null}

      <div className={suppressAgileChrome ? "px-4 py-2 pb-28" : "px-4 py-4 pb-24"}>
        {suppressAgileChrome && page === "tab" ? (
          <div className="-mx-1 mb-3 flex flex-col gap-2 border-b border-[#2d3449]/30 pb-3">
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {(
                [
                  { key: "board" as const, label: "Board" },
                  { key: "backlog" as const, label: "Backlog" },
                  { key: "sprints" as const, label: "Sprints" },
                  { key: "alerts" as const, label: "Alerts" },
                ] as const
              ).map(({ key, label }) => {
                const on = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => resetToTab(key)}
                    className={`flex-none rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-transform active:scale-[0.98] ${
                      on ? "bg-primary text-on-primary shadow-lg shadow-primary/15" : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {activeTab === "alerts" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAlertsSubTab("alerts")}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                    alertsSubTab === "alerts" ? "bg-secondary/20 text-secondary" : "text-on-surface-variant"
                  }`}
                >
                  Signals
                </button>
                <button
                  type="button"
                  onClick={() => setAlertsSubTab("reports")}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide ${
                    alertsSubTab === "reports" ? "bg-secondary/20 text-secondary" : "text-on-surface-variant"
                  }`}
                >
                  Reports
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        {page === "tab" ? (
          <>
            {activeTab === "board" ? (
              <section className="space-y-4" data-testid="agile-board">
                {trackLoadError ? (
                  <div
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ background: "rgba(255,86,48,0.12)", border: "1px solid rgba(255,86,48,0.35)", color: "#FFDDD6" }}
                    role="alert"
                  >
                    {trackLoadError}
                  </div>
                ) : null}
                <div
                  className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: TRACK_PANEL_BG, border: TRACK_PANEL_BORDER }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8C9BAB" }}>
                    Project
                  </span>
                  <select
                    className="min-w-[160px] flex-1 rounded-lg px-2 py-1.5 text-sm"
                    style={TRACK_SURFACE.input}
                    aria-label="Track project"
                    value={selectedProjectId ?? ""}
                    onChange={(e) => setSelectedProjectId(e.target.value || null)}
                    disabled={!projects.length}
                  >
                    {projects.length === 0 ? (
                      <option value="">No projects yet</option>
                    ) : (
                      projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    )}
                  </select>
                  {trackLoading ? (
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#8C9BAB" }}>
                      Loading…
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#8C9BAB" }}>
                      Board
                    </span>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest"
                      style={{
                        background: "#262528",
                        color: "#E6EDF3",
                        border: "1px solid #2C333A",
                      }}
                    >
                      {boardColumns.reduce((acc, c) => acc + c.issues.length, 0)} issues
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNewProjectName("");
                        setPage("createProject");
                      }}
                      className="rounded-xl px-3 py-2 active:opacity-90"
                      style={TRACK_SURFACE.buttonSecondary}
                    >
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        New project
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickEntryOpen(true)}
                      disabled={!selectedProjectId}
                      className="rounded-xl active:opacity-90 disabled:opacity-40"
                      style={{ ...TRACK_SURFACE.buttonPrimary, padding: "10px 12px", boxShadow: TRACK_PRIMARY_SHADOW }}
                    >
                      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Quick entry
                      </span>
                    </button>
                  </div>
                </div>

                {!selectedProjectId ? (
                  <p className="text-sm" style={{ color: "#8C9BAB" }}>
                    Create a project to load your board from MOxE Track.
                  </p>
                ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {boardColumns.map((col) => {
                    const nameLower = col.name.toLowerCase();
                    const isDoneCol =
                      nameLower.includes("done") || nameLower.includes("verified") || nameLower.includes("fixed");
                    const isDoingCol = nameLower.includes("progress") || nameLower.includes("review");
                    return (
                      <div
                        key={col.id}
                        className="min-w-[300px] w-[300px] shrink-0 rounded-lg p-3"
                        style={TRACK_SURFACE.cardMuted}
                      >
                        <div className="flex items-center justify-between px-1 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3
                              className="text-[11px] font-bold uppercase tracking-[0.15em] truncate"
                              style={{ color: "#F1F3FF" }}
                            >
                              {col.name}
                            </h3>
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded"
                              style={{
                                background: isDoingCol ? TRACK_PRIMARY : "rgba(30,30,36,0.6)",
                                color: isDoingCol ? "#fff" : "#9CA3AF",
                                border: `1px solid ${isDoingCol ? TRACK_PRIMARY : TRACK_OUTLINE}`,
                              }}
                            >
                              {col.issues.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="rounded p-1 active:opacity-70"
                            style={{ color: "#9CA3AF" }}
                            aria-label={`${col.name} column menu`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                        <div
                          className={`space-y-3 ${isDoneCol ? "opacity-50 grayscale" : ""}`}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const id = e.dataTransfer.getData("text/moxe-issue-id");
                            if (id && col.id) void handleMoveIssue(id, col.id);
                          }}
                        >
                          {col.issues.map((i) => (
                            <div
                              key={i.id}
                              role="button"
                              tabIndex={0}
                              draggable={!movingIssueId}
                              onDragStart={(e) => {
                                e.dataTransfer.setData("text/moxe-issue-id", i.id);
                                e.dataTransfer.effectAllowed = "move";
                              }}
                              onClick={() => onOpenIssue(i.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onOpenIssue(i.id);
                                }
                              }}
                              className="w-full text-left rounded-lg p-4 transition-colors active:scale-[0.99] cursor-grab active:cursor-grabbing"
                              style={{
                                background: TRACK_CARD_BG,
                                border: TRACK_CARD_BORDER,
                                boxShadow: "none",
                                opacity: movingIssueId === i.id ? 0.55 : 1,
                              }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <span
                                  className="text-[10px] font-bold tracking-[0.12em] truncate max-w-[180px]"
                                  style={{ color: "#9CA3AF" }}
                                  title={i.id}
                                >
                                  {i.id}
                                </span>
                                {i.priority === "High" ? (
                                  <ChevronUp className="w-5 h-5 shrink-0 text-red-500" strokeWidth={2.5} aria-hidden />
                                ) : (
                                  <span
                                    aria-hidden
                                    className="w-2 h-2 rounded-full mt-1 shrink-0"
                                    style={{ background: priorityColor(i.priority) }}
                                  />
                                )}
                              </div>
                              <p
                                className={`text-sm font-semibold leading-snug mb-4 line-clamp-2 ${
                                  isDoneCol ? "line-through" : ""
                                }`}
                                style={{ color: "#F1F3FF" }}
                              >
                                {i.summary}
                              </p>
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                                  style={{
                                    background: "rgba(0,82,204,0.15)",
                                    color: TRACK_PRIMARY,
                                    border: `1px solid rgba(0,82,204,0.2)`,
                                  }}
                                >
                                  {i.issueType ?? "Task"}
                                </span>
                                <span
                                  className="text-[9px] font-bold tracking-wider px-2 py-1 rounded"
                                  style={{
                                    background: "rgba(30,30,36,0.8)",
                                    color: "#9CA3AF",
                                    border: `1px solid ${TRACK_OUTLINE}`,
                                  }}
                                >
                                  {i.storyPoints ?? 0} PTS
                                </span>
                              </div>
                            </div>
                          ))}
                          {col.issues.length === 0 ? (
                            <div className="text-xs px-1 py-4 text-center rounded-lg border border-dashed" style={{ color: "#9CA3AF", borderColor: TRACK_OUTLINE }}>
                              Drop issues here or none match filters.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </section>
            ) : null}

            {activeTab === "backlog" ? (
              <section className="space-y-4">
                <div className="mb-1">
                  <h3 className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.02em]" style={{ color: "#F9F5F8" }}>
                    Backlog Management
                  </h3>
                  <p className="text-[16px] mt-1" style={{ color: "#ADAAAD" }}>
                    Prioritize tasks and plan upcoming sprint velocity.
                  </p>
                </div>

                <div className="rounded-2xl p-3" style={{ background: TRACK_PANEL_BG, border: TRACK_PANEL_BORDER }}>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setNewProjectName("");
                        setPage("createProject");
                      }}
                      className="rounded-xl px-3 py-2 active:opacity-80"
                      style={{ ...TRACK_SURFACE.card, color: "#F1F3FF" }}
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">Create Project</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(true)}
                      className="rounded-xl px-3 py-2 active:opacity-80"
                      style={{
                          ...TRACK_SURFACE.card,
                        color: "#F1F3FF",
                      }}
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">
                        <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                        Filters
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickEntryOpen(true)}
                      className="rounded-xl px-3 py-2 active:opacity-90"
                      style={{ ...TRACK_SURFACE.buttonPrimary }}
                    >
                      <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                        Create Issue
                      </span>
                    </button>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: TRACK_PANEL_BG,
                    border: TRACK_PANEL_BORDER,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" style={{ color: "#4D8EFF" }} />
                      <span className="text-sm font-bold" style={{ color: "#F1F3FF" }}>
                        Active Sprint: Apollo 11
                      </span>
                    </div>
                    <span
                      className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider"
                      style={{ background: "#005235", color: "#82F9BE" }}
                    >
                      Active
                    </span>
                  </div>
                  <div className="space-y-2">
                    {backlogIssues.slice(0, 3).map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => onOpenIssue(i.id)}
                        className="w-full text-left rounded-xl px-3 py-3 active:opacity-90"
                        style={TRACK_SURFACE.cardDeeper}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold tracking-wider" style={{ color: "#B2C5FF" }}>
                              {i.id}
                            </div>
                            <p className="text-sm font-semibold mt-1" style={{ color: "#F1F3FF" }}>
                              {i.summary}
                            </p>
                          </div>
                          <span className="text-xs font-bold" style={{ color: "#C3C6D6" }}>
                            {i.storyPoints ?? 0}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-2xl p-3"
                  style={{
                    background: TRACK_PANEL_BG,
                    border: TRACK_PANEL_BORDER,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: "#F1F3FF" }}>
                      Product Backlog
                    </span>
                    <span className="text-xs" style={{ color: "#C3C6D6" }}>
                      {backlogIssues.length} issues
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {backlogIssues.map((i) => (
                      <button
                        key={i.id}
                        type="button"
                        onClick={() => onOpenIssue(i.id)}
                        className="w-full text-left rounded-xl px-3 py-3 active:opacity-90"
                        style={{
                          background: "#161A1D",
                          border: `1px solid #2C333A`,
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold tracking-wider" style={{ color: "#B2C5FF" }}>
                                {i.id}
                              </span>
                              <span
                                className="text-[10px] font-semibold px-2 py-1 rounded-full"
                                style={{
                                  background: "#2C333A",
                                  color: "#E6EDF3",
                                  border: `1px solid #2C333A`,
                                }}
                              >
                                {i.issueType ?? "Task"}
                              </span>
                            </div>
                                <div className="text-xs mt-1 truncate" style={{ color: "#C3C6D6" }}>
                              {i.summary}
                            </div>
                            <div className="text-[11px] mt-2" style={{ color: "#8C9BAB" }}>
                              Assigned to {formatAssignee(i.assignee)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div
                              aria-hidden
                              className="w-2.5 h-2.5 rounded-full mt-1"
                              style={{ background: priorityColor(i.priority) }}
                            />
                            <MoreHorizontal className="w-5 h-5" style={{ opacity: 0.75 }} />
                          </div>
                        </div>
                      </button>
                    ))}
                    {backlogIssues.length === 0 ? (
                      <div className="text-xs" style={{ color: "#8C9BAB" }}>
                        {selectedProjectId
                          ? "No backlog items match filters."
                          : "Select or create a project to see backlog issues."}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "sprints" ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#8DABFF" }}>
                      Planning Phase
                    </div>
                    <div className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.02em]" style={{ color: "#F9F5F8" }}>
                      Initialize Sprint
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPage("initializeSprint")}
                    className="rounded-xl px-3 py-2 active:opacity-90"
                    style={{ ...TRACK_SURFACE.buttonPrimary, boxShadow: TRACK_PRIMARY_SHADOW }}
                  >
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      Initialize sprint
                    </span>
                  </button>
                </div>

                <div
                  className="rounded-2xl p-3"
                  style={TRACK_SURFACE.cardMuted}
                >
                  <div className="grid gap-3">
                    {[
                      { id: "Sprint 24", status: "ACTIVE", range: "Mar 18 - Apr 1" },
                      { id: "Sprint 25", status: "PLANNED", range: "Apr 1 - Apr 15" },
                      { id: "Sprint 23", status: "COMPLETED", range: "Mar 4 - Mar 18" },
                    ].map((s) => {
                      const chipBg = s.status === "ACTIVE" ? "#113D8A" : s.status === "COMPLETED" ? "#0B3B2D" : "#2C333A";
                      const chipColor = s.status === "ACTIVE" ? "#B2C5FF" : s.status === "COMPLETED" ? "#36B37E" : "#E6EDF3";
                      return (
                        <div
                          key={s.id}
                          className="rounded-xl px-3 py-3"
                          style={TRACK_SURFACE.card}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-[11px] font-bold uppercase tracking-[0.15em] truncate" style={{ color: "#F1F3FF" }}>
                                {s.id}
                              </div>
                              <div className="text-xs mt-1" style={{ color: "#8C9BAB" }}>
                                {s.range}
                              </div>
                            </div>
                            <span
                              className="text-[10px] font-semibold px-2 py-1 rounded-full"
                              style={{
                                background: chipBg,
                                color: chipColor,
                              }}
                            >
                              {s.status}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: "#8C9BAB" }}>
                              <Timer className="w-4 h-4" strokeWidth={2} />
                              Sprint cadence ready
                            </div>
                            <button
                              type="button"
                              onClick={() => setPage("createTask")}
                              className="rounded-xl px-3 py-2 active:opacity-90"
                              style={{
                                background: TRACK_PRIMARY,
                                color: "#fff",
                                boxShadow: "0 8px 18px rgba(0,82,204,0.25)",
                              }}
                            >
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest">
                                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                                Create task
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            {activeTab === "alerts" ? (
              <section className="space-y-4">
                <div className="flex flex-col gap-3 justify-between mb-1">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: TRACK_PRIMARY }}>
                      {alertsSubTab === "alerts" ? "System status" : "Signal center"}
                    </div>
                    <div className="text-[32px] leading-[1.08] font-extrabold tracking-[-0.02em]" style={{ color: "#F9F5F8" }}>
                      {alertsSubTab === "alerts" ? "Recent activity" : "Alerts & reports"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAlertsSubTab("alerts")}
                      className="rounded-xl px-3 py-2 active:opacity-90"
                      style={{
                        background: alertsSubTab === "alerts" ? TRACK_PRIMARY : TRACK_CARD_BG,
                        border: `1px solid ${TRACK_OUTLINE}`,
                        color: alertsSubTab === "alerts" ? "#fff" : "#E6EDF3",
                        boxShadow: alertsSubTab === "alerts" ? TRACK_PRIMARY_SHADOW : "none",
                      }}
                    >
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        <Bell className="w-4 h-4" strokeWidth={2.5} />
                        Alerts
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlertsSubTab("reports")}
                      className="rounded-xl px-3 py-2 active:opacity-90"
                      style={{
                        background: alertsSubTab === "reports" ? TRACK_PRIMARY : TRACK_CARD_BG,
                        border: `1px solid ${TRACK_OUTLINE}`,
                        color: alertsSubTab === "reports" ? "#fff" : "#E6EDF3",
                        boxShadow: alertsSubTab === "reports" ? TRACK_PRIMARY_SHADOW : "none",
                      }}
                    >
                      <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                        Reports
                      </span>
                    </button>
                  </div>
                </div>

                {alertsSubTab === "alerts" ? (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="rounded-xl px-4 py-2 text-sm font-semibold active:opacity-90"
                        style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER, color: "#E6EDF3" }}
                      >
                        Mark all read
                      </button>
                      <button
                        type="button"
                        className="rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 active:opacity-90"
                        style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER, color: "#E6EDF3" }}
                      >
                        <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                        Filters
                      </button>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 px-1" style={{ color: "#8C9BAB" }}>
                        Priority alerts
                      </p>
                      <div className="space-y-3">
                        <div
                          className="rounded-xl p-5 flex gap-4 relative overflow-hidden"
                          style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER }}
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: "#FF5630" }} />
                          <div
                            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
                            style={{ background: "rgba(255,86,48,0.12)" }}
                          >
                            <CalendarX className="w-6 h-6" style={{ color: "#FF5630" }} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-bold text-sm leading-tight" style={{ color: "#F1F3FF" }}>
                                Missed deadline: Architecture review
                              </h3>
                              <span className="text-xs font-medium shrink-0" style={{ color: "#8C9BAB" }}>
                                14m ago
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed mb-3" style={{ color: "#8C9BAB" }}>
                              Project <span className="font-semibold" style={{ color: "#E6EDF3" }}>&quot;Deep Space UI&quot;</span> missed phase 1 sign-off. Immediate action required to prevent sprint lag.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider active:opacity-90"
                                style={{ background: "#FF5630", color: "#fff" }}
                              >
                                Reschedule
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider active:opacity-90"
                                style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER, color: "#E6EDF3" }}
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>

                        <div
                          className="rounded-xl p-5 flex gap-4"
                          style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER }}
                        >
                          <div
                            className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
                            style={{ background: "rgba(0,82,204,0.15)" }}
                          >
                            <AtSign className="w-6 h-6" style={{ color: TRACK_PRIMARY }} strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <h3 className="font-bold text-sm leading-tight" style={{ color: "#F1F3FF" }}>
                                Sarah Chen mentioned you
                              </h3>
                              <span className="text-xs font-medium shrink-0" style={{ color: "#8C9BAB" }}>
                                2h ago
                              </span>
                            </div>
                            <p
                              className="text-sm italic pl-4 py-1 my-2 border-l-2"
                              style={{ color: "#8C9BAB", borderColor: "rgba(140,155,171,0.25)" }}
                            >
                              &quot;Hey @Architect, could you check the container tokens for the new dark mode surface?&quot;
                            </p>
                            <button type="button" className="text-xs font-bold active:opacity-80" style={{ color: TRACK_PRIMARY }}>
                              Reply to Sarah
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-4 px-1" style={{ color: "#8C9BAB" }}>
                        Workflow updates
                      </p>
                      <div className="space-y-2">
                        {[
                          {
                            icon: <ListOrdered className="w-5 h-5" style={{ color: "#C084FC" }} strokeWidth={2} />,
                            body: (
                              <>
                                <span className="font-semibold" style={{ color: "#E6EDF3" }}>
                                  David Wright
                                </span>{" "}
                                moved{" "}
                                <span className="font-semibold" style={{ color: "#E6EDF3" }}>
                                  API Integration
                                </span>{" "}
                                to{" "}
                                <span className="font-bold px-2 py-0.5 rounded" style={{ background: "rgba(54,179,126,0.15)", color: "#36B37E" }}>
                                  Done
                                </span>
                              </>
                            ),
                            when: "4h ago",
                          },
                          {
                            icon: <Zap className="w-5 h-5" style={{ color: TRACK_PRIMARY }} strokeWidth={2} />,
                            body: (
                              <>
                                <span className="font-bold" style={{ color: TRACK_PRIMARY }}>
                                  Sprint 24: &quot;Neon Velocity&quot;
                                </span>{" "}
                                has started. 18 tasks pending.
                              </>
                            ),
                            when: "6h ago",
                          },
                          {
                            icon: <ListOrdered className="w-5 h-5" style={{ color: "#8C9BAB" }} strokeWidth={2} />,
                            body: (
                              <>
                                New task added to{" "}
                                <span className="font-semibold" style={{ color: "#E6EDF3" }}>
                                  Backlog
                                </span>
                                : &quot;Refactor Auth Middleware&quot;
                              </>
                            ),
                            when: "Yesterday",
                          },
                        ].map((row, i) => (
                          <div
                            key={i}
                            className="rounded-xl p-4 flex items-center gap-4"
                            style={{
                              background: "#0E0E10",
                              border: TRACK_CARD_BORDER,
                            }}
                          >
                            <div
                              className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                              style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER }}
                            >
                              {row.icon}
                            </div>
                            <p className="flex-1 text-sm min-w-0" style={{ color: "#8C9BAB" }}>
                              {row.body}
                            </p>
                            <span className="text-xs font-medium whitespace-nowrap shrink-0" style={{ color: "#8C9BAB" }}>
                              {row.when}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="py-10 flex flex-col items-center text-center opacity-50">
                      <div
                        className="w-24 h-24 mb-5 rounded-full flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #1E1E24, #141417)" }}
                      >
                        <Sparkles className="w-10 h-10" style={{ color: "#8C9BAB" }} strokeWidth={1.5} />
                      </div>
                      <h4 className="font-bold text-lg mb-1" style={{ color: "#F1F3FF" }}>
                        You&apos;re all caught up
                      </h4>
                      <p className="text-sm max-w-[240px]" style={{ color: "#8C9BAB" }}>
                        Older notifications are archived and can be viewed in history.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: TRACK_PRIMARY }}>
                          Performance insight
                        </div>
                        <h3 className="text-[28px] leading-[1.08] font-extrabold tracking-[-0.02em]" style={{ color: "#F9F5F8" }}>
                          Team analytics
                        </h3>
                      </div>
                      <div className="flex gap-1 rounded-xl p-1 shrink-0" style={{ background: TRACK_CARD_BG, border: TRACK_CARD_BORDER }}>
                        {(
                          [
                            { id: "sprint" as const, label: "Current sprint" },
                            { id: "30d" as const, label: "Last 30 days" },
                          ] as const
                        ).map((opt) => {
                          const on = reportsRange === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setReportsRange(opt.id)}
                              className="px-3 py-2 rounded-lg text-[11px] font-bold transition-colors active:opacity-90"
                              style={
                                on
                                  ? { background: TRACK_PRIMARY, color: "#fff", boxShadow: TRACK_PRIMARY_SHADOW }
                                  : { color: "#8C9BAB", background: "transparent" }
                              }
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <TrackAgileReportsCharts
                      reportsLoading={reportsLoading}
                      reportsError={reportsError}
                      reportsData={reportsData}
                      jobInsightsMetrics={jobInsightsMetrics}
                    />
                    <p className="text-[11px] px-1" style={{ color: "#8C9BAB" }}>
                      Project charts use <span style={{ color: TRACK_PRIMARY }}>/api/job/analytics/track-agile</span>; job-wide tiles use{" "}
                      <span style={{ color: TRACK_PRIMARY }}>/api/job/analytics/insights</span>. No issues in the project shows a clear empty state.
                    </p>
                  </div>
                )}
              </section>
            ) : null}
          </>
        ) : null}

        {page === "issueDetail" ? (
          <section className="space-y-4">
            {issueDetailLoading ? (
              <p className="text-sm" style={{ color: "#8C9BAB" }}>
                Loading issue…
              </p>
            ) : null}
            {!issueDetailLoading && !selectedIssue ? (
              <p className="text-sm" style={{ color: "#8C9BAB" }}>
                Could not load this issue.
              </p>
            ) : null}
            {selectedIssue ? (
            <>
            <div className="rounded-2xl p-4" style={TRACK_SURFACE.panel}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#8C9BAB" }}>
                    {selectedProject?.name ?? "Project"} / <span style={{ color: "#E6EDF3" }}>{selectedIssue.id}</span>
                  </div>
                  <div className="text-[34px] leading-[1.08] font-extrabold mt-1 tracking-[-0.02em]" style={{ color: "#F9F5F8" }}>
                    {selectedIssue.summary}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}>
                      {selectedIssue.issueType ?? "Task"}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "#161A1D", border: `1px solid ${priorityColor(selectedIssue.priority)}`, color: priorityColor(selectedIssue.priority) }}>
                      {selectedIssue.priority}
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full" style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#8C9BAB" }}>
                      {selectedIssue.status}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="rounded-xl active:opacity-80"
                  style={{ ...TRACK_SURFACE.buttonSecondary, padding: 10 }}
                  aria-label="More actions"
                >
                  <MoreHorizontal className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 active:opacity-90"
                  style={TRACK_SURFACE.buttonPrimary}
                  aria-label="Edit"
                >
                  <span className="inline-flex items-center gap-2">
                    <Pencil className="w-4 h-4" strokeWidth={2.5} />
                    Edit
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 active:opacity-90"
                  style={TRACK_SURFACE.buttonSecondary}
                >
                  <span className="inline-flex items-center gap-2">
                    <Paperclip className="w-4 h-4" strokeWidth={2.5} />
                    Attach
                  </span>
                </button>
                <button
                  type="button"
                  className="rounded-xl px-3 py-2 active:opacity-90"
                  style={TRACK_SURFACE.buttonSecondary}
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" strokeWidth={2.5} />
                    Comment
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={TRACK_SURFACE.card}>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                    Assignee
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#E6EDF3" }}>
                    {formatAssignee(selectedIssue.assignee)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                    Story points
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#E6EDF3" }}>
                    {selectedIssue.storyPoints ?? 0}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                    Created
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#E6EDF3" }}>
                    {formatIssueDate(selectedIssue.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                    Updated
                  </div>
                  <div className="text-sm font-semibold mt-1" style={{ color: "#E6EDF3" }}>
                    {formatIssueDate(selectedIssue.updatedAt)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                  Description
                </div>
                <div className="text-sm mt-2" style={{ color: "#E6EDF3", lineHeight: 1.45 }}>
                  {selectedIssue.description}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                    Attachments
                  </div>
                  <div className="text-[11px]" style={{ color: "#8C9BAB" }}>
                    {selectedIssue.attachments?.length ?? 0}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {(selectedIssue.attachments ?? []).map((a) => (
                    <div key={a.id} className="rounded-xl p-3" style={TRACK_SURFACE.card}>
                      <div className="text-xs font-semibold" style={{ color: "#E6EDF3" }}>
                        {a.name}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "#8C9BAB" }}>
                        Preview available
                      </div>
                    </div>
                  ))}
                  {(selectedIssue.attachments?.length ?? 0) === 0 ? (
                    <div className="text-xs" style={{ color: "#8C9BAB" }}>
                      No attachments.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-4" style={TRACK_SURFACE.card}>
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold" style={{ color: "#8C9BAB" }}>
                  Activity
                </div>
                <div className="text-[11px]" style={{ color: "#8C9BAB" }}>
                  3 updates
                </div>
              </div>
              <div className="mt-3 space-y-3">
                {[
                  { who: "A. Johnson", text: "Moved issue to In Progress", when: "2h ago" },
                  { who: "System", text: "Notification sent to stakeholders", when: "Yesterday" },
                  { who: "M. Patel", text: "Added sprint wizard notes", when: "Mar 27" },
                ].map((t, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={TRACK_SURFACE.card}
                    >
                      <Info className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold" style={{ color: "#E6EDF3" }}>
                        {t.who}
                      </div>
                      <div className="text-xs mt-1" style={{ color: "#8C9BAB" }}>
                        {t.text}
                      </div>
                      <div className="text-[11px] mt-1" style={{ color: "#8C9BAB" }}>
                        {t.when}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={"Add a comment..."}
                  readOnly
                  aria-label="Comment input"
                  className="flex-1 rounded-xl px-3 py-3 text-sm"
                  style={TRACK_SURFACE.input}
                />
                <button
                  type="button"
                  className="rounded-xl px-3 py-3 active:opacity-90"
                  style={TRACK_SURFACE.buttonPrimary}
                >
                  Send
                </button>
              </div>
            </div>
            </>
            ) : null}
          </section>
        ) : null}

        {page === "createProject" ? (
          <section className="space-y-4">
            <div className="rounded-2xl p-4" style={TRACK_SURFACE.panel}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#8DABFF" }}>
                    Setup
                  </div>
                  <div className="text-lg font-extrabold tracking-tight" style={{ color: "#F9F5F8" }}>
                    Initialize New Project
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="rounded-xl px-3 py-2 active:opacity-80"
                  style={TRACK_SURFACE.buttonSecondary}
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center gap-2 flex-1">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold"
                        style={{
                          background: step === 1 ? TRACK_PRIMARY : "#161A1D",
                          border: `1px solid ${step === 1 ? TRACK_PRIMARY : "#2C333A"}`,
                          color: step === 1 ? "#fff" : "#8C9BAB",
                        }}
                      >
                        {step}
                      </div>
                      {step !== 3 ? (
                        <div className="h-1.5 flex-1" style={{ background: step === 1 ? TRACK_PRIMARY : "#2C333A", borderRadius: 999 }} />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="text-xs mt-3" style={{ color: "#8C9BAB" }}>
                  Step 1 of 3
                </div>
                <div className="text-xs mt-2" style={{ color: "#8C9BAB" }}>
                  Configure the core identity of your workspace.
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                    Project name
                  </div>
                  <input
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ ...TRACK_SURFACE.input, marginTop: 8 }}
                    placeholder="e.g. Mobile Revamp (min. 3 characters)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    aria-label="Project name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Template
                    </div>
                    <div
                      className="rounded-xl px-3 py-2.5 text-sm"
                      style={{ ...TRACK_SURFACE.card, marginTop: 8 }}
                    >
                      KANBAN
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Workspace
                    </div>
                    <div
                      className="rounded-xl px-3 py-2.5 text-sm"
                      style={{ ...TRACK_SURFACE.card, marginTop: 8 }}
                    >
                      TRACK
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
                  style={TRACK_SURFACE.buttonSecondary}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creatingProject || newProjectName.trim().length < 3}
                  onClick={async () => {
                    const name = newProjectName.trim();
                    if (name.length < 3) return;
                    setCreatingProject(true);
                    setTrackLoadError(null);
                    try {
                      const created = await apiFetch<{ id: string; name: string }>("job/track/projects", {
                        method: "POST",
                        body: { name, template: "KANBAN" },
                      });
                      setProjects((prev) => {
                        const rest = prev.filter((p) => p.id !== created.id);
                        return [{ id: created.id, name: created.name }, ...rest];
                      });
                      setSelectedProjectId(created.id);
                      setNewProjectName("");
                      setPage("tab");
                    } catch (e: unknown) {
                      setTrackLoadError(e instanceof Error ? e.message : "Failed to create project");
                    } finally {
                      setCreatingProject(false);
                    }
                  }}
                  className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest disabled:opacity-40"
                  style={TRACK_SURFACE.buttonPrimary}
                >
                  {creatingProject ? "Creating…" : "Create project"}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {page === "initializeSprint" ? (
          <section className="space-y-4">
            <div className="rounded-2xl p-4" style={TRACK_SURFACE.panel}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#8DABFF" }}>
                    Scheduling
                  </div>
                  <div className="text-lg font-extrabold tracking-tight" style={{ color: "#F9F5F8" }}>
                    Sprint Initialization
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#8C9BAB" }}>
                    Define dates and goal for your next sprint.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="rounded-xl px-3 py-2 active:opacity-80"
                  style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Start date
                    </div>
                    <div
                      className="rounded-xl px-3 py-2.5 text-sm mt-2"
                      style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                    >
                      Mar 31
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      End date
                    </div>
                    <div
                      className="rounded-xl px-3 py-2.5 text-sm mt-2"
                      style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                    >
                      Apr 14
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                    Goal
                  </div>
                  <textarea
                    readOnly
                    value={"Deliver the first working Track agile layout with board + issue detail."}
                    aria-label="Sprint goal"
                    className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                    style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3", outline: "none" }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 rounded-xl px-3 py-2.5" style={{ background: "#161A1D", border: "1px solid #2C333A" }}>
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                    Quick checklist
                  </div>
                  <div className="text-xs mt-2" style={{ color: "#E6EDF3" }}>
                    <div className="flex items-center gap-2"><CalendarDays className="w-4 h-4" strokeWidth={2.5} /> Dates valid</div>
                    <div className="flex items-center gap-2 mt-1"><Info className="w-4 h-4" strokeWidth={2.5} /> Goal included</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
                  style={{ ...TRACK_SURFACE.buttonPrimary }}
                >
                  Create sprint
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {page === "createTask" ? (
          <section className="space-y-4">
            <div className="rounded-2xl p-4" style={TRACK_SURFACE.panel}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#8DABFF" }}>
                    Task Composer
                  </div>
                  <div className="text-lg font-extrabold tracking-tight" style={{ color: "#F9F5F8" }}>
                    Create Task
                  </div>
                  <div className="text-xs mt-1" style={{ color: "#8C9BAB" }}>
                    Add a new issue card to your board.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="rounded-xl px-3 py-2 active:opacity-80"
                  style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                >
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4">
                <div className="space-y-2.5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Summary
                    </div>
                    <input
                      className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                      style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3", outline: "none" }}
                      placeholder="e.g. Add issue detail actions"
                      readOnly
                      value={"Add issue detail actions"}
                      aria-label="Task summary"
                    />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Description
                    </div>
                    <textarea
                      readOnly
                      value={"Add edit, attach, and comment actions to the new issue detail header."}
                      aria-label="Task description"
                      className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                      style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3", outline: "none" }}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Priority
                    </div>
                    <div
                      className="rounded-xl px-3 py-2.5 text-sm mt-2 flex items-center justify-between"
                      style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                    >
                      <span>High</span>
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: priorityColor("High") }}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                        Type
                      </div>
                      <div
                        className="rounded-xl px-3 py-2.5 text-sm mt-2"
                        style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                      >
                        Task
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                        Assignee
                      </div>
                      <div
                        className="rounded-xl px-3 py-2.5 text-sm mt-2"
                        style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                      >
                        A. Johnson
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl p-3" style={{ background: "#161A1D", border: "1px solid #2C333A" }}>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                      Quick preview
                    </div>
                    <div className="mt-2 rounded-xl p-3" style={{ background: "#0E1015", border: "1px solid #2C333A" }}>
                      <div className="text-xs font-bold" style={{ color: "#E6EDF3" }}>TRACK-846</div>
                      <div className="text-xs mt-1" style={{ color: "#8C9BAB" }}>
                        Add issue detail actions
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
                  style={{ background: "#161A1D", border: "1px solid #2C333A", color: "#E6EDF3" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setPage("tab")}
                  className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
                  style={{ ...TRACK_SURFACE.buttonPrimary }}
                >
                  Create task
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {/* Floating action button */}
      {page !== "issueDetail" ? (
        <button
          type="button"
          onClick={() => {
            if (activeTab === "sprints") setPage("createTask");
            else setQuickEntryOpen(true);
          }}
          aria-label={fabTitle}
          className={`fixed right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full ${suppressAgileChrome ? "bottom-28" : "bottom-20"}`}
          style={{
            background: TRACK_PRIMARY,
            color: "#fff",
            boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
          }}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </button>
      ) : null}

      {!suppressAgileChrome ? (
        <TrackBottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            if (page === "issueDetail") return;
            resetToTab(tab);
          }}
        />
      ) : null}

      <ModalShell
        open={quickEntryOpen}
        title="Quick Entry"
        onClose={() => setQuickEntryOpen(false)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setQuickEntryOpen(false);
              }}
              className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
              style={TRACK_SURFACE.buttonSecondary}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={creatingIssue || !selectedProjectId || !quickDraft.summary.trim()}
              onClick={async () => {
                if (!selectedProjectId || !quickDraft.summary.trim()) return;
                setCreatingIssue(true);
                setTrackLoadError(null);
                try {
                  const issueTypeRaw = quickDraft.issueType.toUpperCase().replace(/\s+/g, "_");
                  await apiFetch(`job/track/projects/${selectedProjectId}/issues`, {
                    method: "POST",
                    body: {
                      summary: quickDraft.summary.trim(),
                      description: quickDraft.description.trim() || undefined,
                      priority: quickDraft.priority.toUpperCase(),
                      issueType: issueTypeRaw === "TASK" || issueTypeRaw === "STORY" || issueTypeRaw === "BUG" || issueTypeRaw === "EPIC" ? issueTypeRaw : "TASK",
                    },
                  });
                setQuickEntryOpen(false);
                  setQuickDraft({ summary: "", description: "", priority: "Medium", issueType: "Task" });
                  await refreshTrackData();
                } catch (e: unknown) {
                  setTrackLoadError(e instanceof Error ? e.message : "Failed to create issue");
                } finally {
                  setCreatingIssue(false);
                }
              }}
              className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest disabled:opacity-40"
              style={TRACK_SURFACE.buttonPrimary}
            >
              {creatingIssue ? "Saving…" : "Create issue"}
            </button>
          </div>
        }
      >
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
              Add an issue quickly
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
              Template: Task
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
              Summary
            </div>
            <input
              value={quickDraft.summary}
              onChange={(e) => setQuickDraft((d) => ({ ...d, summary: e.target.value }))}
              aria-label="Quick summary"
              className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
              style={TRACK_SURFACE.input}
              placeholder="e.g. Fix header spacing"
            />
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
              Description
            </div>
            <textarea
              value={quickDraft.description}
              onChange={(e) => setQuickDraft((d) => ({ ...d, description: e.target.value }))}
              aria-label="Quick description"
              className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
              style={TRACK_SURFACE.input}
              placeholder="Optional details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                Priority
              </div>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                style={TRACK_SURFACE.input}
                aria-label="Issue priority"
                value={quickDraft.priority}
                onChange={(e) =>
                  setQuickDraft((d) => ({ ...d, priority: e.target.value as IssuePriority }))
                }
              >
                {(["Low", "Medium", "High"] as const).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                Type
              </div>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                style={TRACK_SURFACE.input}
                aria-label="Issue type"
                value={quickDraft.issueType}
                onChange={(e) => setQuickDraft((d) => ({ ...d, issueType: e.target.value }))}
              >
                {(["Task", "Story", "Bug", "Epic"] as const).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell
        open={filtersOpen}
        title="Filters"
        onClose={() => setFiltersOpen(false)}
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(false);
              }}
              className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
              style={TRACK_SURFACE.buttonSecondary}
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setFiltersOpen(false);
              }}
              className="flex-1 rounded-xl px-3 py-2.5 active:opacity-90 text-[11px] font-bold uppercase tracking-widest"
              style={TRACK_SURFACE.buttonPrimary}
            >
              Apply
            </button>
          </div>
        }
      >
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" strokeWidth={2} style={{ color: "#8C9BAB" }} />
            <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
              Search
            </div>
          </div>

          <input
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
            className="w-full rounded-xl px-3 py-2.5 text-sm"
            style={TRACK_SURFACE.input}
            aria-label="Filter query"
            placeholder="Search issues..."
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                Priority
              </div>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                style={TRACK_SURFACE.input}
                aria-label="Filter by priority"
                value={filters.priority}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, priority: e.target.value as "Any" | IssuePriority }))
                }
              >
                {(["Any", "Low", "Medium", "High"] as const).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "#8C9BAB" }}>
                Assignee
              </div>
              <select
                className="w-full rounded-xl px-3 py-2.5 text-sm mt-2"
                style={TRACK_SURFACE.input}
                aria-label="Filter by assignee"
                value={filters.assignee}
                onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
              >
                <option value="Any">Any</option>
                {assigneeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs" style={{ color: "#8C9BAB" }}>
            Filters apply on this device. The board and backlog reflect your current selections.
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

