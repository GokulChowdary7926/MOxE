import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { fetchApi } from "../../services/api";
import { readApiError } from "../../utils/readApiError";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchApi(path, init);
  if (!res.ok) throw new Error(await readApiError(res));
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

type StageRow = { id: string; name: string; order: number; color?: string | null };

type PipelineCard = {
  key: string;
  kind: "application" | "recruitment";
  candidateId: string;
  name: string;
  role: string;
  match: number;
  initials: string;
  live?: boolean;
};

type TrackJob = { id: string; title: string };

type CandidatesPayload = {
  job: { id: string; title: string } | null;
  applications: Array<{
    id: string;
    kind?: string;
    pipelineStageId: string | null;
    rating: number | null;
    status?: string;
    account?: { displayName?: string | null; username?: string | null };
  }>;
  recruitmentCandidates: Array<{
    id: string;
    kind?: string;
    pipelineStageId: string | null;
    rating: number | null;
    status?: string;
    firstName: string;
    lastName: string;
    currentTitle?: string | null;
  }>;
  stages: StageRow[];
};

function MsIcon({ name, className = "", filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: filled ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      }}
      data-icon={name}
    >
      {name}
    </span>
  );
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Match ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MsIcon
          key={i}
          name="star"
          filled={i <= n}
          className={`text-sm ${i <= n ? "text-[#58a6ff]" : "text-[#484f58]"}`}
        />
      ))}
    </div>
  );
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function clampStars(r: number | null | undefined): number {
  if (r == null || Number.isNaN(r)) return 3;
  return Math.min(5, Math.max(1, Math.round(r)));
}

function buildBuckets(
  payload: CandidatesPayload,
  stageIds: string[],
  defaultStageId: string
): Record<string, PipelineCard[]> {
  const buckets: Record<string, PipelineCard[]> = {};
  for (const id of stageIds) buckets[id] = [];

  const jobTitle = payload.job?.title ?? "Role";

  const resolveStage = (sid: string | null | undefined) => {
    if (sid && buckets[sid]) return sid;
    return defaultStageId;
  };

  for (const a of payload.applications) {
    const display = a.account?.displayName?.trim() || a.account?.username || "Applicant";
    const card: PipelineCard = {
      key: `application:${a.id}`,
      kind: "application",
      candidateId: a.id,
      name: display,
      role: jobTitle,
      match: clampStars(a.rating),
      initials: initialsFromName(display),
      live: a.status === "INTERVIEW" || a.status === "OFFER",
    };
    buckets[resolveStage(a.pipelineStageId)].push(card);
  }

  for (const c of payload.recruitmentCandidates) {
    const display = `${c.firstName} ${c.lastName}`.trim() || "Candidate";
    const card: PipelineCard = {
      key: `recruitment:${c.id}`,
      kind: "recruitment",
      candidateId: c.id,
      name: display,
      role: c.currentTitle?.trim() || jobTitle,
      match: clampStars(c.rating),
      initials: initialsFromName(display),
      live: c.status === "INTERVIEW" || c.status === "OFFER",
    };
    buckets[resolveStage(c.pipelineStageId)].push(card);
  }

  return buckets;
}

type CandidatePipelinePanelProps = {
  /** Preferred: job posting id from parent (e.g. Recruiter) — use with onJobChange for shared state. */
  jobId?: string | null;
  /** @deprecated use jobId */
  jobPostingId?: string | null;
  /** When set, job selection is controlled by the parent (Talent + Pipeline stay in sync). */
  onJobChange?: (jobId: string | null) => void;
  /** Open MOxE Track candidate detail (e.g. Recruiter profile + resume). */
  onOpenCandidate?: (sel: { kind: "application" | "recruitment"; candidateId: string }) => void;
};

export default function CandidatePipelinePanel({
  jobId: jobIdProp,
  jobPostingId,
  onJobChange,
  onOpenCandidate,
}: CandidatePipelinePanelProps) {
  const parentJobId = jobIdProp ?? jobPostingId ?? null;
  const controlled = onJobChange != null;
  const [jobs, setJobs] = useState<TrackJob[]>([]);
  /** Used only when not controlled */
  const [internalJobId, setInternalJobId] = useState<string | null>(null);
  const [stageList, setStageList] = useState<StageRow[]>([]);
  const [columns, setColumns] = useState<Record<string, PipelineCard[]>>({});
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCands, setLoadingCands] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [fromStageId, setFromStageId] = useState<string | null>(null);
  const [movingKey, setMovingKey] = useState<string | null>(null);

  useEffect(() => {
    const ensure = (id: string, href: string) => {
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    };
    ensure(
      "moxe-pipeline-material-symbols",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    );
    ensure(
      "moxe-pipeline-fonts",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Manrope:wght@700;800;900&display=swap",
    );
  }, []);

  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    setError(null);
    try {
      const rows = await apiJson<TrackJob[]>("job/track/jobs?myOnly=true&status=ALL");
      setJobs(Array.isArray(rows) ? rows : []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load jobs";
      setError(msg);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (jobs.length === 0) {
      if (controlled) onJobChange(null);
      else setInternalJobId(null);
      return;
    }
    if (controlled) {
      if (parentJobId && jobs.some((j) => j.id === parentJobId)) return;
      onJobChange(jobs[0]?.id ?? null);
      return;
    }
    setInternalJobId((prev) => {
      if (parentJobId && jobs.some((j) => j.id === parentJobId)) return parentJobId;
      if (prev && jobs.some((j) => j.id === prev)) return prev;
      return jobs[0].id;
    });
  }, [jobs, parentJobId, controlled, onJobChange]);

  const effectiveJobId = controlled
    ? parentJobId && jobs.some((j) => j.id === parentJobId)
      ? parentJobId
      : jobs[0]?.id ?? null
    : internalJobId;

  const loadCandidates = useCallback(async (jid: string) => {
    setLoadingCands(true);
    setError(null);
    try {
      const data = await apiJson<CandidatesPayload>(`job/track/jobs/${jid}/candidates`);
      const stages = [...(data.stages ?? [])].sort((a, b) => a.order - b.order);
      setStageList(stages);
      if (stages.length === 0) {
        setColumns({});
        return;
      }
      const ids = stages.map((s) => s.id);
      const defaultId = ids[0];
      setColumns(buildBuckets(data, ids, defaultId));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load candidates";
      setError(msg);
      setStageList([]);
      setColumns({});
    } finally {
      setLoadingCands(false);
    }
  }, []);

  useEffect(() => {
    if (!effectiveJobId) return;
    void loadCandidates(effectiveJobId);
  }, [effectiveJobId, loadCandidates]);

  const orderedStages = useMemo(() => stageList, [stageList]);

  const onDragStart = (stageId: string, card: PipelineCard) => {
    setDragKey(card.key);
    setFromStageId(stageId);
  };

  const onDrop = async (toStageId: string) => {
    if (!dragKey || !fromStageId || fromStageId === toStageId) {
      setDragKey(null);
      setFromStageId(null);
      return;
    }

    const fromList = columns[fromStageId] ?? [];
    const card = fromList.find((c) => c.key === dragKey);
    if (!card) {
      setDragKey(null);
      setFromStageId(null);
      return;
    }

    setMovingKey(card.key);
    try {
      await apiJson(`job/track/candidates/${card.kind}/${card.candidateId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ pipelineStageId: toStageId }),
      });
      setDragKey(null);
      setFromStageId(null);
      toast.success("Moved");
      if (effectiveJobId) await loadCandidates(effectiveJobId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Move failed";
      toast.error(msg);
      setDragKey(null);
      setFromStageId(null);
    } finally {
      setMovingKey(null);
    }
  };

  const selectedTitle = jobs.find((j) => j.id === effectiveJobId)?.title ?? "";

  return (
    <div className="space-y-6 font-[Inter,system-ui,sans-serif] text-[#dae2fd]">
      <header className="relative overflow-hidden rounded-xl border border-[#45464d]/20 bg-[#171f33] p-6 pl-8 border-l-4 border-l-[#ffb3ad]">
        <div className="relative z-10 flex flex-col gap-4 justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ffb3ad]">MOxE TRACK</p>
            <h1 className="font-['Manrope',system-ui,sans-serif] text-3xl font-black tracking-tight text-[#dae2fd]">
              Candidate pipeline
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[#c6c6cd]">
              Kanban by your job&apos;s pipeline stages. Drag cards to move — updates persist via{" "}
              <code className="rounded bg-[#0d1117] px-1 text-[11px]">PATCH …/candidates/:kind/:id/move</code>.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-[220px] flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8b949e]">Job posting</label>
              <select
                value={effectiveJobId ?? ""}
                disabled={loadingJobs || jobs.length === 0}
                onChange={(e) => {
                  const v = e.target.value || null;
                  if (controlled) onJobChange(v);
                  else setInternalJobId(v);
                }}
                className="mt-1 w-full rounded-xl border border-[#45464d]/40 bg-[#131b2e] px-4 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#58a6ff]"
              >
                {jobs.length === 0 ? (
                  <option value="">No jobs — create one in Track</option>
                ) : (
                  jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => effectiveJobId && void loadCandidates(effectiveJobId)}
                disabled={!effectiveJobId || loadingCands}
                className="flex items-center gap-2 rounded-xl border border-[#45464d]/30 bg-[#131b2e] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#dae2fd] hover:bg-[#222a3d] active:scale-95 disabled:opacity-50"
              >
                <MsIcon name="refresh" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-[#4edea3]/5 to-transparent" />
      </header>

      {error ? (
        <p className="rounded-lg border border-[#f85149]/40 bg-[#f8514918] px-4 py-3 text-sm text-[#ffb3ad]">{error}</p>
      ) : null}

      {loadingJobs || loadingCands ? (
        <p className="text-sm text-[#8b949e]">{loadingJobs ? "Loading jobs…" : "Loading pipeline…"}</p>
      ) : null}

      {!loadingJobs && jobs.length > 0 && orderedStages.length === 0 && effectiveJobId ? (
        <div className="rounded-xl border border-dashed border-[#30363d] bg-[#0d1117]/80 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-[#e6edf3]">No pipeline for this job</p>
          <p className="mt-2 text-xs text-[#8b949e]">
            Add a pipeline with stages in Track for <span className="text-[#dae2fd]">{selectedTitle || "this job"}</span> to
            use the Kanban board.
          </p>
        </div>
      ) : null}

      {orderedStages.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
          {orderedStages.map((stage) => {
            const list = columns[stage.id] ?? [];
            return (
              <section
                key={stage.id}
                className="flex min-w-[280px] w-[min(100%,320px)] shrink-0 flex-col gap-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => void onDrop(stage.id)}
              >
                <div className="flex items-center justify-between rounded-xl border border-[#30363d]/80 bg-[#21262d] px-4 py-3">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-[#e6edf3]">{stage.name}</h2>
                  <span className="rounded-full border border-[#30363d]/80 bg-[#0d1117] px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-[#8b949e]">
                    {list.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {list.map((card) => (
                    <article
                      key={card.key}
                      draggable={movingKey !== card.key}
                      onDragStart={() => onDragStart(stage.id, card)}
                      className={`cursor-grab rounded-xl border border-[#30363d]/80 bg-[#161b22] p-5 shadow-sm transition-shadow active:cursor-grabbing hover:border-[#484f58] ${
                        movingKey === card.key ? "opacity-60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#30363d] text-xs font-black text-[#e6edf3]">
                            {card.initials}
                          </div>
                          {card.live && (
                            <span
                              className="absolute bottom-0 right-0 h-3 w-3 animate-pulse rounded-full border-2 border-[#161b22] bg-[#36B37E]"
                              title="Active stage"
                            />
                          )}
                        </div>
                      </div>
                      <h3 className="mt-3 text-sm font-bold text-[#e6edf3]">{card.name}</h3>
                      <p className="mt-1 text-xs text-[#8b949e]">{card.role}</p>
                      <div className="mt-3 flex items-center justify-between border-t border-[#30363d]/80 pt-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#8b949e]">Match</span>
                        <Stars n={card.match} />
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-[9px] font-bold uppercase tracking-tight text-[#8b949e]">
                        <MsIcon name="drag_indicator" className="text-base text-[#484f58]" />
                        Drag to move
                      </div>
                      {onOpenCandidate ? (
                        <button
                          type="button"
                          className="mt-3 w-full rounded-lg border border-[#30363d]/80 bg-[#21262d] py-2 text-[10px] font-black uppercase tracking-widest text-[#58a6ff] hover:bg-[#30363d]/80"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCandidate({ kind: card.kind, candidateId: card.candidateId });
                          }}
                        >
                          View profile
                        </button>
                      ) : null}
                    </article>
                  ))}

                  {list.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#30363d] bg-[#0d1117]/80 py-12 text-center text-[#8b949e]">
                      <MsIcon name="inbox" className="mb-2 text-3xl text-[#484f58]" />
                      <p className="text-xs font-medium text-[#8b949e]">No candidates</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
