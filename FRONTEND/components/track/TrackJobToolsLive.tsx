/**
 * Live Track Agile / Scrum / Alert surfaces — Prisma-backed APIs (no seed cards).
 * Uses Job tool tokens: #172B4D, #0052CC, #DFE1E6 (see docs/MOXE_JOB_TOOLS_IMPLEMENTATION_SUMMARY.md).
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { fetchApi } from "../../services/api";
import { readApiError } from "../../utils/readApiError";
import type { RootState } from "../../store";

const T = {
  text: "#172B4D",
  muted: "#5E6C84",
  border: "#DFE1E6",
  primary: "#0052CC",
  surface: "#F4F5F7",
};

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchApi(path, init);
  if (!res.ok) throw new Error(await readApiError(res));
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

type TrackProjectRow = {
  id: string;
  name: string;
  template?: string;
  _count?: { issues: number; sprints: number };
};

type BoardIssue = {
  id: string;
  summary: string;
  priority: string;
  storyPoints?: number | null;
  rank: number;
  assignee?: { displayName?: string | null; username?: string | null } | null;
};

type BoardColumn = {
  id: string;
  name: string;
  order: number;
  issues: BoardIssue[];
};

type BoardPayload = {
  id: string;
  name: string;
  columns: BoardColumn[];
};

type SprintRow = {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  goal?: string | null;
  _count?: { issues: number };
};

type AlertScheduleRow = {
  id: string;
  name: string;
  timezone: string;
  rotationType: string;
  handoffTime: string;
};

type AlertRuleRow = {
  id: string;
  name: string;
  severity: string;
  isActive: boolean;
  scheduleId: string;
  schedule: { id: string; name: string; timezone: string };
  _count?: { events: number };
};

function priorityColor(p: string): string {
  const u = (p || "").toUpperCase();
  if (u === "HIGH" || u === "CRITICAL") return "#DE350B";
  if (u === "MEDIUM") return "#FFAB00";
  return "#36B37E";
}

// ----- Agile board -----

export function TrackAgileBoardLive() {
  const [projects, setProjects] = useState<TrackProjectRow[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIssueId, setDragIssueId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiJson<TrackProjectRow[]>("job/track/projects");
      setProjects(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBoard = useCallback(async (pid: string) => {
    setBoardLoading(true);
    setError(null);
    try {
      const b = await apiJson<BoardPayload>(`job/track/projects/${pid}/board`);
      setBoard(b);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load board");
      setBoard(null);
    } finally {
      setBoardLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!projectId) return;
    void loadBoard(projectId);
  }, [projectId, loadBoard]);

  useEffect(() => {
    if (projects.length === 0) {
      setProjectId(null);
      return;
    }
    setProjectId((prev) => (prev && projects.some((p) => p.id === prev) ? prev : projects[0].id));
  }, [projects]);

  const onCreateProject = async () => {
    const name = newProjectName.trim();
    if (name.length < 3) {
      toast.error("Project name must be at least 3 characters");
      return;
    }
    setCreating(true);
    try {
      const p = await apiJson<TrackProjectRow>("job/track/projects", {
        method: "POST",
        body: JSON.stringify({ name, template: "KANBAN" }),
      });
      toast.success("Project created");
      setNewProjectName("");
      await loadProjects();
      setProjectId(p.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const onDrop = async (targetColumnId: string) => {
    if (!dragIssueId || !projectId) {
      setDragIssueId(null);
      return;
    }
    try {
      await apiJson(`job/track/issues/${dragIssueId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ targetColumnId }),
      });
      toast.success("Issue moved");
      await loadBoard(projectId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Move failed");
    } finally {
      setDragIssueId(null);
    }
  };

  return (
    <div className="space-y-4 font-[Inter,system-ui,sans-serif]" style={{ color: T.text }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
            Track project
          </label>
          <select
            value={projectId ?? ""}
            disabled={loading || projects.length === 0}
            onChange={(e) => setProjectId(e.target.value || null)}
            className="mt-1 w-full max-w-md rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2684FF]"
            style={{ borderColor: T.border, background: "#fff", color: T.text }}
          >
            {projects.length === 0 ? (
              <option value="">No projects yet</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p._count?.issues != null ? ` (${p._count.issues} issues)` : ""}
                </option>
              ))
            )}
          </select>
        </div>
        <button
          type="button"
          onClick={() => projectId && void loadBoard(projectId)}
          disabled={!projectId || boardLoading}
          className="rounded-lg border px-4 py-2 text-xs font-bold uppercase tracking-wide text-white disabled:opacity-50"
          style={{ background: T.primary, borderColor: T.primary }}
        >
          Refresh board
        </button>
      </div>

      <div
        className="rounded-xl border p-4"
        style={{ borderColor: T.border, background: T.surface }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
          New project
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Project name (3–100 chars)"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
          />
          <button
            type="button"
            onClick={() => void onCreateProject()}
            disabled={creating}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: T.primary }}
          >
            Create
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {loading || boardLoading ? (
        <p className="text-sm" style={{ color: T.muted }}>
          {loading ? "Loading projects…" : "Loading board…"}
        </p>
      ) : null}

      {board && !boardLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {board.columns
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((col) => (
              <section
                key={col.id}
                className="flex min-w-[260px] max-w-[320px] shrink-0 flex-col gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void onDrop(col.id)}
              >
                <div
                  className="flex items-center justify-between rounded-lg border px-3 py-2"
                  style={{ borderColor: T.border, background: "#fff" }}
                >
                  <h3 className="text-[11px] font-black uppercase tracking-wide">{col.name}</h3>
                  <span className="text-[10px] tabular-nums" style={{ color: T.muted }}>
                    {col.issues?.length ?? 0}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {(col.issues ?? []).map((issue) => (
                    <article
                      key={issue.id}
                      draggable
                      onDragStart={() => setDragIssueId(issue.id)}
                      className="cursor-grab rounded-lg border p-3 shadow-sm active:cursor-grabbing"
                      style={{ borderColor: T.border, background: "#fff" }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase"
                          style={{
                            background: `${priorityColor(issue.priority)}22`,
                            color: priorityColor(issue.priority),
                          }}
                        >
                          {issue.priority}
                        </span>
                        {issue.storyPoints != null ? (
                          <span className="text-[10px] font-bold tabular-nums" style={{ color: T.muted }}>
                            {issue.storyPoints} pts
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-snug">{issue.summary}</p>
                      {issue.assignee ? (
                        <p className="mt-1 text-[11px]" style={{ color: T.muted }}>
                          {issue.assignee.displayName || issue.assignee.username || "Assignee"}
                        </p>
                      ) : null}
                    </article>
                  ))}
                  {(col.issues ?? []).length === 0 ? (
                    <div
                      className="rounded-lg border border-dashed py-8 text-center text-xs"
                      style={{ borderColor: T.border, color: T.muted }}
                    >
                      Drop issues here
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
        </div>
      ) : null}

      {!loading && projects.length === 0 ? (
        <p className="text-sm" style={{ color: T.muted }}>
          Create a Track project above to load your Kanban. Data is stored in your account.
        </p>
      ) : null}
    </div>
  );
}

// ----- Scrum sprints -----

export function TrackScrumLive() {
  const [projects, setProjects] = useState<TrackProjectRow[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [sprints, setSprints] = useState<SprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sprintLoading, setSprintLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sprintName, setSprintName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiJson<TrackProjectRow[]>("job/track/projects");
      setProjects(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSprints = useCallback(async (pid: string) => {
    setSprintLoading(true);
    setError(null);
    try {
      const list = await apiJson<SprintRow[]>(`job/track/projects/${pid}/sprints`);
      setSprints(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sprints");
      setSprints([]);
    } finally {
      setSprintLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (projects.length === 0) {
      setProjectId(null);
      return;
    }
    setProjectId((prev) => (prev && projects.some((p) => p.id === prev) ? prev : projects[0].id));
  }, [projects]);

  useEffect(() => {
    if (!projectId) return;
    void loadSprints(projectId);
  }, [projectId, loadSprints]);

  const active = useMemo(() => sprints.find((s) => s.status === "ACTIVE"), [sprints]);

  const onCreateSprint = async () => {
    const name = sprintName.trim();
    if (name.length < 2) {
      toast.error("Sprint name required");
      return;
    }
    if (!projectId) return;
    setCreating(true);
    try {
      await apiJson(`job/track/projects/${projectId}/sprints`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      toast.success("Sprint created");
      setSprintName("");
      await loadSprints(projectId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 font-[Inter,system-ui,sans-serif]" style={{ color: T.text }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
            Project
          </label>
          <select
            value={projectId ?? ""}
            disabled={loading || projects.length === 0}
            onChange={(e) => setProjectId(e.target.value || null)}
            className="mt-1 w-full max-w-md rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border, background: "#fff" }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => projectId && void loadSprints(projectId)}
          disabled={!projectId || sprintLoading}
          className="rounded-lg px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50"
          style={{ background: T.primary }}
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {active ? (
        <div className="rounded-xl border p-4" style={{ borderColor: T.border, background: T.surface }}>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
            Active sprint
          </p>
          <p className="mt-1 text-lg font-bold">{active.name}</p>
          <p className="text-sm" style={{ color: T.muted }}>
            {active._count?.issues ?? 0} issues linked · status {active.status}
          </p>
          <p className="mt-2 text-xs" style={{ color: T.muted }}>
            Burndown: use issue completion in the board filtered by this sprint (Track → board with sprint filter).
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: T.muted }}>
          No active sprint. Start one from Track or create below.
        </p>
      )}

      <div className="rounded-xl border p-4" style={{ borderColor: T.border, background: "#fff" }}>
        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
          New sprint
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={sprintName}
            onChange={(e) => setSprintName(e.target.value)}
            placeholder="Sprint name"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
          />
          <button
            type="button"
            onClick={() => void onCreateSprint()}
            disabled={creating || !projectId}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: T.primary }}
          >
            Create
          </button>
        </div>
      </div>

      {sprintLoading || loading ? (
        <p className="text-sm" style={{ color: T.muted }}>
          Loading…
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr style={{ color: T.muted }}>
                <th className="border-b py-2 pr-4 font-bold">Sprint</th>
                <th className="border-b py-2 pr-4 font-bold">Status</th>
                <th className="border-b py-2 pr-4 font-bold">Issues</th>
                <th className="border-b py-2 font-bold">Window</th>
              </tr>
            </thead>
            <tbody>
              {sprints.map((s) => (
                <tr key={s.id} className="border-b" style={{ borderColor: T.border }}>
                  <td className="py-2 pr-4 font-medium">{s.name}</td>
                  <td className="py-2 pr-4">{s.status}</td>
                  <td className="py-2 pr-4 tabular-nums">{s._count?.issues ?? 0}</td>
                  <td className="py-2 text-xs" style={{ color: T.muted }}>
                    {s.startDate ? new Date(s.startDate).toLocaleDateString() : "—"} →{" "}
                    {s.endDate ? new Date(s.endDate).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sprints.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: T.muted }}>
              No sprints yet for this project.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ----- Job alerts (on-call rules) -----

export function TrackJobAlertsLive() {
  const accountId = useSelector(
    (s: RootState) => s.account.currentAccount?.id || s.auth.user?.id || null,
  );
  const [schedules, setSchedules] = useState<AlertScheduleRow[]>([]);
  const [rules, setRules] = useState<AlertRuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [schedName, setSchedName] = useState("Primary rotation");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [handoff, setHandoff] = useState("09:00");
  const [creatingSched, setCreatingSched] = useState(false);

  const [ruleScheduleId, setRuleScheduleId] = useState("");
  const [ruleName, setRuleName] = useState("Pipeline SLA");
  const [ruleSeverity, setRuleSeverity] = useState<"CRITICAL" | "WARNING" | "INFO">("WARNING");
  const [creatingRule, setCreatingRule] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([
        apiJson<AlertScheduleRow[]>("alert/schedules"),
        apiJson<AlertRuleRow[]>("alert/rules"),
      ]);
      setSchedules(Array.isArray(s) ? s : []);
      setRules(Array.isArray(r) ? r : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load alerts");
      setSchedules([]);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (schedules.length && !ruleScheduleId) setRuleScheduleId(schedules[0].id);
  }, [schedules, ruleScheduleId]);

  const createSchedule = async () => {
    if (!accountId) {
      toast.error("Sign in required");
      return;
    }
    setCreatingSched(true);
    try {
      await apiJson("alert/schedules", {
        method: "POST",
        body: JSON.stringify({
          name: schedName.trim(),
          timezone,
          rotationType: "WEEKLY",
          handoffTime: handoff,
          participantAccountIds: [accountId],
        }),
      });
      toast.success("Schedule created");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreatingSched(false);
    }
  };

  const createRule = async () => {
    if (!ruleScheduleId) {
      toast.error("Create a schedule first");
      return;
    }
    setCreatingRule(true);
    try {
      await apiJson("alert/rules", {
        method: "POST",
        body: JSON.stringify({
          scheduleId: ruleScheduleId,
          name: ruleName.trim(),
          severity: ruleSeverity,
          condition: { type: "threshold", source: "track", metric: "pipeline_sla" },
        }),
      });
      toast.success("Rule created");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setCreatingRule(false);
    }
  };

  return (
    <div className="space-y-6 font-[Inter,system-ui,sans-serif]" style={{ color: T.text }}>
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}
      {loading ? <p className="text-sm" style={{ color: T.muted }}>Loading schedules and rules…</p> : null}

      <section className="rounded-xl border p-4" style={{ borderColor: T.border, background: T.surface }}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
          On-call schedules
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {schedules.map((sch) => (
            <li key={sch.id} className="flex justify-between rounded-lg border px-3 py-2" style={{ borderColor: T.border, background: "#fff" }}>
              <span className="font-semibold">{sch.name}</span>
              <span className="text-xs" style={{ color: T.muted }}>
                {sch.timezone} · {sch.handoffTime}
              </span>
            </li>
          ))}
        </ul>
        {schedules.length === 0 && !loading ? (
          <p className="mt-2 text-sm" style={{ color: T.muted }}>
            No schedules yet. Create one below (stores in your account).
          </p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <input
            value={schedName}
            onChange={(e) => setSchedName(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
            placeholder="Schedule name"
          />
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
            placeholder="Timezone"
          />
          <input
            value={handoff}
            onChange={(e) => setHandoff(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
            placeholder="HH:MM"
          />
          <button
            type="button"
            onClick={() => void createSchedule()}
            disabled={creatingSched}
            className="rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: T.primary }}
          >
            Add schedule
          </button>
        </div>
      </section>

      <section className="rounded-xl border p-4" style={{ borderColor: T.border, background: "#fff" }}>
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.muted }}>
          Alert rules
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {rules.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2" style={{ borderColor: T.border }}>
              <span className="font-semibold">{rule.name}</span>
              <span className="text-xs" style={{ color: T.muted }}>
                {rule.severity} · {rule.schedule.name} · {rule._count?.events ?? 0} events
              </span>
            </li>
          ))}
        </ul>
        {rules.length === 0 && !loading ? (
          <p className="mt-2 text-sm" style={{ color: T.muted }}>No rules yet.</p>
        ) : null}

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <select
            value={ruleScheduleId}
            onChange={(e) => setRuleScheduleId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
            placeholder="Rule name"
          />
          <select
            value={ruleSeverity}
            onChange={(e) => setRuleSeverity(e.target.value as "CRITICAL" | "WARNING" | "INFO")}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: T.border }}
          >
            <option value="CRITICAL">Critical</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
          <button
            type="button"
            onClick={() => void createRule()}
            disabled={creatingRule || schedules.length === 0}
            className="rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: T.primary }}
          >
            Add rule
          </button>
        </div>
      </section>
    </div>
  );
}
