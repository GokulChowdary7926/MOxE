import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../../services/api";
import { readApiError } from "../../utils/readApiError";

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchApi(path, init);
  if (!res.ok) throw new Error(await readApiError(res));
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

/** Dark theme text (MOxE TRACK) */
const C = {
  onSurface: "#e6edf3",
  onSurfaceVariant: "#8b949e",
} as const;

type RequisitionStatus = "Draft" | "Published" | "On hold";

type Requisition = {
  id: string;
  title: string;
  department: string;
  location: string;
  status: RequisitionStatus;
  applicants: number;
  updatedAt: string;
};

type ApiJobListRow = {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  status: string;
  applicationCount: number;
  updatedAt: string;
};

type JobDetail = {
  id: string;
  title: string;
  companyName: string;
  department: string | null;
  location: string | null;
  status: string;
  applicationCount: number;
  description: string | null;
  requirements: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  bonusPercent: number | null;
  updatedAt: string;
  publishedAt: string | null;
  postedBy?: { displayName?: string | null; username?: string | null } | null;
  hiringManager?: { displayName?: string | null; username?: string | null } | null;
};

function mapStatus(s: string): RequisitionStatus {
  const u = (s || "").toUpperCase();
  if (u === "OPEN") return "Published";
  if (u === "CLOSED") return "On hold";
  return "Draft";
}

function mapJobToRequisition(j: ApiJobListRow): Requisition {
  const updated =
    typeof j.updatedAt === "string" ? j.updatedAt.slice(0, 10) : new Date(j.updatedAt).toISOString().slice(0, 10);
  return {
    id: j.id,
    title: j.title,
    department: j.department?.trim() || "—",
    location: j.location?.trim() || "—",
    status: mapStatus(j.status),
    applicants: j.applicationCount ?? 0,
    updatedAt: updated,
  };
}

type WizardStep = 0 | 1 | 2 | 3;

function MsIcon({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
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

function statusStyles(s: RequisitionStatus): string {
  switch (s) {
    case "Published":
      return "border-emerald-700/60 bg-emerald-950/50 text-emerald-300";
    case "Draft":
      return "border-[#30363d] bg-[#161b22] text-[#8b949e]";
    case "On hold":
      return "border-amber-700/50 bg-amber-950/40 text-amber-200";
    default:
      return "border-[#30363d] bg-[#161b22] text-[#8b949e]";
  }
}

export default function JobRequisitionsPanel() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState<"list" | "wizard" | "detail">("list");
  const [items, setItems] = useState<Requisition[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [sortTitleAsc, setSortTitleAsc] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);

  const [basic, setBasic] = useState({
    title: "",
    department: "",
    location: "",
    headcount: "1",
    employment: "Full-time",
  });
  const [roleBody, setRoleBody] = useState(
    "Own the web experience for MOxE Track. Partner with design and platform on performance, accessibility, and release quality.",
  );
  const [requirements, setRequirements] = useState(
    "5+ years React/TypeScript\nSystem design for large SPAs\nMentorship and code review",
  );
  const [skills, setSkills] = useState<string[]>(["React", "TypeScript", "GraphQL"]);
  const [skillInput, setSkillInput] = useState("");
  const [comp, setComp] = useState({
    min: "165000",
    max: "195000",
    currency: "USD",
    bonusPct: "15",
    equity: "0.06% – 0.12%",
  });
  const [hiringManager, setHiringManager] = useState("");
  const [publishDest, setPublishDest] = useState({ careers: true, linkedin: true, indeed: false });
  const [schedulePublish, setSchedulePublish] = useState(false);

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
      "moxe-jobreq-material-symbols",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    );
    ensure(
      "moxe-jobreq-inter-manrope",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@400;600;700;800;900&display=swap",
    );
  }, []);

  const loadJobs = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const rows = await apiJson<ApiJobListRow[]>("job/track/jobs?myOnly=true&status=ALL");
      setItems((Array.isArray(rows) ? rows : []).map(mapJobToRequisition));
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Could not load requisitions");
      setItems([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const cmp = a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      return sortTitleAsc ? cmp : -cmp;
    });
    return copy;
  }, [items, sortTitleAsc]);

  const selected = useMemo(() => items.find((r) => r.id === selectedId) ?? null, [items, selectedId]);

  const exportCsv = () => {
    const rows = [["id", "title", "department", "location", "status", "applicants", "updatedAt"]];
    for (const r of sortedItems) {
      rows.push([r.id, r.title, r.department, r.location, r.status, String(r.applicants), r.updatedAt]);
    }
    const csv = rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `requisitions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailJob(null);
    setScreen("detail");
    setDetailLoading(true);
    try {
      const j = await apiJson<JobDetail>(`job/track/jobs/${id}`);
      setDetailJob(j);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load job");
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setWizardStep(0);
    setBasic({ title: "", department: "", location: "", headcount: "1", employment: "Full-time" });
    setRoleBody(
      "Define outcomes, scope, and success metrics for this role. AI suggestions appear in the insight card beside the editor.",
    );
    setRequirements("Must-have qualifications\nNice-to-have signals");
    setSkills(["React", "Node.js"]);
    setComp({ min: "", max: "", currency: "USD", bonusPct: "10", equity: "" });
    setHiringManager("");
    setPublishDest({ careers: true, linkedin: true, indeed: false });
    setSchedulePublish(false);
    setScreen("wizard");
  };

  const openEdit = async (r: Requisition) => {
    setEditingId(r.id);
    setWizardStep(0);
    try {
      const j = await apiJson<JobDetail>(`job/track/jobs/${r.id}`);
      setBasic({
        title: j.title,
        department: j.department ?? "",
        location: j.location ?? "",
        headcount: "1",
        employment: "Full-time",
      });
      setRoleBody(j.description || "");
      setRequirements(j.requirements || "");
      setSkills(["React", "Node.js"]);
      setComp({
        min: j.salaryMin != null ? String(j.salaryMin) : "",
        max: j.salaryMax != null ? String(j.salaryMax) : "",
        currency: j.salaryCurrency || "USD",
        bonusPct: j.bonusPercent != null ? String(j.bonusPercent) : "10",
        equity: "",
      });
      setHiringManager(j.hiringManager?.displayName || j.hiringManager?.username || "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load job");
      setBasic({
        title: r.title,
        department: r.department === "—" ? "" : r.department,
        location: r.location === "—" ? "" : r.location,
        headcount: "1",
        employment: "Full-time",
      });
    }
    setScreen("wizard");
  };

  const stepLabels = ["Basic details", "Role definition", "Compensation & team", "Review & publish"];

  const addSkill = () => {
    const t = skillInput.trim();
    if (!t) return;
    if (!skills.includes(t)) setSkills((s) => [...s, t]);
    setSkillInput("");
  };

  const removeSkill = (t: string) => setSkills((s) => s.filter((x) => x !== t));

  const goList = () => {
    setScreen("list");
    setSelectedId(null);
    setDetailJob(null);
  };

  const saveWizard = async () => {
    if (!basic.title.trim() || !basic.department.trim()) {
      toast.error("Title and department are required.");
      return;
    }
    const companyName = basic.department.trim() || "Hiring organization";
    const payload: Record<string, unknown> = {
      title: basic.title.trim(),
      companyName,
      department: basic.department.trim(),
      location: basic.location.trim() || undefined,
      description: roleBody.trim() || undefined,
      requirements: requirements.trim() || undefined,
      salaryMin: comp.min ? Number(comp.min) : undefined,
      salaryMax: comp.max ? Number(comp.max) : undefined,
      salaryCurrency: comp.currency,
      bonusPercent: comp.bonusPct ? Number(comp.bonusPct) : undefined,
    };
    setSaveBusy(true);
    try {
      if (editingId) {
        await apiJson(`job/track/jobs/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Requisition updated.");
      } else {
        const created = await apiJson<{ id: string }>("job/track/jobs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!schedulePublish) {
          const destinations: string[] = [];
          if (publishDest.careers) destinations.push("MOxE_CAREERS");
          if (publishDest.linkedin) destinations.push("LinkedIn");
          if (publishDest.indeed) destinations.push("Indeed");
          await apiJson(`job/track/jobs/${created.id}/publish`, {
            method: "POST",
            body: JSON.stringify({ destinations }),
          });
          toast.success("Requisition created and published.");
        } else {
          toast.success("Requisition saved as draft.");
        }
      }
      await loadJobs();
      setScreen("list");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaveBusy(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border-none bg-[#161b22] px-4 py-3 text-sm font-medium text-[#e6edf3] placeholder:text-[#6e7681]/80 focus:outline-none focus:ring-2 focus:ring-[#58a6ff]/35 min-h-[48px]";
  const labelClass = "mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#8b949e]";

  if (screen === "list") {
    return (
      <div className="space-y-6 font-[Inter,system-ui,sans-serif]" style={{ color: C.onSurface }}>
        <header className="relative overflow-hidden rounded-xl border border-[#30363d]/70 bg-[#21262d] p-6 pl-8 border-l-4 border-l-[#0059bb]">
          <div className="relative z-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#0059bb]">The Precision Architect</p>
            <h1 className="mb-2 font-['Manrope',system-ui,sans-serif] text-3xl font-black tracking-tight text-[#e6edf3]">
              Job requisitions
            </h1>
            <p className="max-w-xl text-sm text-[#8b949e]">
              List, create, and publish roles with hiring-manager approval and channel distribution aligned to MOxE Track.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={openCreate}
                className="rounded-xl bg-gradient-to-br from-[#00113a] to-[#002366] px-6 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-95"
              >
                New requisition
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={sortedItems.length === 0}
                className="rounded-xl border border-[#30363d]/80 bg-[#30363d] px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#e6edf3] transition-colors hover:bg-[#484f58] active:scale-95 disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => void loadJobs()}
                disabled={listLoading}
                className="rounded-xl border border-[#30363d]/80 px-6 py-3 text-xs font-bold uppercase tracking-wider text-[#e6edf3] transition-colors hover:bg-[#30363d] disabled:opacity-50"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-[#0059bb]/5 to-transparent" />
        </header>

        {listError ? (
          <p className="rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">{listError}</p>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-[#30363d]/60 bg-[#21262d] shadow-2xl">
          <div className="flex flex-col gap-3 border-b border-[#30363d]/50 px-4 py-4">
            <h2 className="flex items-center gap-2 font-['Manrope',system-ui,sans-serif] text-lg font-bold text-[#e6edf3]">
              <MsIcon name="work" className="text-xl text-[#0059bb]" />
              Open roles
            </h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSortTitleAsc((s) => !s)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[#8b949e] transition-colors hover:bg-[#30363d]"
                aria-label="Sort by title"
                title={sortTitleAsc ? "Sort Z–A" : "Sort A–Z"}
              >
                <MsIcon name="sort" />
              </button>
            </div>
          </div>

          <div className="hidden">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#161b22]/95">
                  {["Title", "Department", "Location", "Status", "Applicants", "Updated", ""].map((h) => (
                    <th key={h} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#757682]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d]/60">
                {sortedItems.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-[#30363d]/40">
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openDetail(r.id)}
                        className="text-left text-sm font-bold text-[#e6edf3] underline-offset-2 hover:underline"
                      >
                        {r.title}
                      </button>
                      <div className="text-[10px] text-[#757682]">{r.id}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#8b949e]">{r.department}</td>
                    <td className="px-6 py-4 text-sm text-[#8b949e]">{r.location}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-tighter ${statusStyles(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold tabular-nums text-[#e6edf3]">{r.applicants}</td>
                    <td className="px-6 py-4 text-sm text-[#8b949e]">{r.updatedAt}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="text-[#8b949e] hover:text-[#0059bb]"
                        aria-label="Edit"
                      >
                        <MsIcon name="edit" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4">
            {listLoading ? (
              <p className="px-2 py-6 text-center text-sm text-[#8b949e]">Loading requisitions…</p>
            ) : null}
            {!listLoading && sortedItems.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-[#8b949e]">No job postings yet. Create one in Track.</p>
            ) : null}
            {sortedItems.map((r) => (
              <article key={r.id} className="rounded-xl border border-[#30363d]/60 bg-[#21262d] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <button type="button" onClick={() => openDetail(r.id)} className="text-left font-bold text-[#e6edf3]">
                      {r.title}
                    </button>
                    <p className="mt-1 text-xs text-[#757682]">
                      {r.id} · {r.department}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${statusStyles(r.status)}`}
                  >
                    {r.status}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#8b949e]">
                  <span>{r.location}</span>
                  <span className="text-[#484f58]">·</span>
                  <span className="tabular-nums">{r.applicants} applicants</span>
                  <span className="text-[#484f58]">·</span>
                  <span>{r.updatedAt}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openDetail(r.id)}
                    className="flex-1 rounded-xl border border-[#30363d]/80 py-2 text-[10px] font-bold uppercase tracking-wider text-[#e6edf3] active:scale-95"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="flex-1 rounded-xl bg-gradient-to-br from-[#00113a] to-[#002366] py-2 text-[10px] font-black uppercase tracking-wider text-white active:scale-95"
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (screen === "detail" && !selected) {
    return (
      <div className="rounded-xl border border-[#30363d]/70 bg-[#21262d] p-8 text-center font-[Inter,system-ui,sans-serif]">
        <p className="text-[#8b949e]">Requisition not found.</p>
        <button
          type="button"
          onClick={goList}
          className="mt-4 rounded-xl bg-gradient-to-br from-[#00113a] to-[#002366] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white active:scale-95"
        >
          Back to list
        </button>
      </div>
    );
  }

  if (screen === "detail" && selected) {
    const dj = detailJob;
    const applicants = dj?.applicationCount ?? selected.applicants;
    const company = dj?.companyName ?? "—";
    const postedBy = dj?.postedBy?.displayName || dj?.postedBy?.username || "—";
    const backendStatus = (dj?.status ?? "").toUpperCase() || "—";
    const pubAt = dj?.publishedAt ? new Date(dj.publishedAt).toLocaleString() : "—";

    return (
      <div className="space-y-6 font-[Inter,system-ui,sans-serif]" style={{ color: C.onSurface }}>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={goList}
            className="flex items-center gap-2 rounded-xl border border-[#30363d]/80 bg-[#161b22] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#e6edf3] hover:bg-[#30363d] active:scale-95"
          >
            <MsIcon name="arrow_back" className="text-lg" />
            Back to list
          </button>
          <button
            type="button"
            onClick={() => void openEdit(selected)}
            className="rounded-xl bg-gradient-to-br from-[#00113a] to-[#002366] px-5 py-2 text-[10px] font-black uppercase tracking-wider text-white active:scale-95"
          >
            Edit requisition
          </button>
        </div>

        {detailLoading ? (
          <p className="text-sm text-[#8b949e]">Loading job details…</p>
        ) : null}

        <section className="rounded-xl border border-[#30363d]/70 bg-[#21262d] p-6 border-l-4 border-l-[#4edea3]">
          <div className="flex flex-col gap-4 justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#757682]">Requisition</p>
              <h1 className="mt-1 font-['Manrope',system-ui,sans-serif] text-2xl font-black tracking-tight text-[#e6edf3]">
                {selected.title}
              </h1>
              <p className="mt-2 text-sm text-[#8b949e]">
                {selected.id} · {selected.department} · {selected.location}
              </p>
            </div>
            <span
              className={`self-start rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-tighter ${statusStyles(selected.status)}`}
            >
              {selected.status}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { k: "Applicants", v: String(applicants), icon: "group" as const },
              { k: "Company", v: company, icon: "apartment" as const },
              { k: "Track status", v: backendStatus, icon: "flag" as const },
              { k: "Posted by", v: postedBy, icon: "person" as const },
              { k: "Published", v: pubAt, icon: "calendar_month" as const },
            ].map((m) => (
              <div key={m.k} className="rounded-xl border border-[#30363d]/60 bg-[#21262d] p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#757682]">
                  <MsIcon name={m.icon} className="text-base text-[#0059bb]" />
                  {m.k}
                </div>
                <div className="mt-2 text-lg font-black text-[#e6edf3]">{m.v}</div>
              </div>
            ))}
          </div>
        </section>

        {dj?.description ? (
          <section className="rounded-xl border border-[#30363d]/60 bg-[#161b22] p-5">
            <h2 className="flex items-center gap-2 font-['Manrope',system-ui,sans-serif] text-sm font-bold uppercase tracking-widest text-[#e6edf3]">
              <MsIcon name="description" className="text-[#0059bb]" />
              Description
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#c6c6cd]">{dj.description}</p>
          </section>
        ) : null}

        <aside className="flex flex-col gap-3 rounded-xl border border-[#30363d]/60 bg-[#21262d] p-5">
          <h2 className="flex items-center gap-2 font-['Manrope',system-ui,sans-serif] text-sm font-bold uppercase tracking-widest text-[#e6edf3]">
            <MsIcon name="hub" className="text-[#0059bb]" />
            Candidate pipeline
          </h2>
          <p className="text-sm text-[#8b949e]">
            Manage candidates in Recruiter: pick this job in Talent or Pipeline to load real applications from Track.
          </p>
          <button
            type="button"
            onClick={() => navigate("/job/recruiter")}
            className="w-full rounded-xl border border-[#30363d]/80 py-3 text-[10px] font-bold uppercase tracking-widest text-[#e6edf3] transition-colors hover:bg-[#30363d] active:scale-95"
          >
            Open Recruiter
          </button>
        </aside>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-[Inter,system-ui,sans-serif]" style={{ color: C.onSurface }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setScreen("list")}
          className="flex items-center gap-2 rounded-xl border border-[#30363d]/80 bg-[#161b22] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#e6edf3] hover:bg-[#30363d] active:scale-95"
        >
          <MsIcon name="close" className="text-lg" />
          Cancel
        </button>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#757682]">
          {editingId ? `Edit ${editingId}` : "Create requisition"}
        </p>
      </div>

      <div className="rounded-xl border border-[#30363d]/60 bg-[#21262d] p-4">
        <div className="mb-8 flex flex-wrap gap-2">
          {stepLabels.map((label, idx) => (
            <button
              key={label}
              type="button"
              onClick={() => setWizardStep(idx as WizardStep)}
              className={`rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 ${
                wizardStep === idx
                  ? "bg-gradient-to-r from-[#00113a] to-[#0059bb] text-white shadow-lg shadow-[#0059bb]/20"
                  : "bg-[#161b22] text-[#8b949e] hover:bg-[#30363d]"
              }`}
            >
              {idx + 1}. {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <div className="min-w-0">
            {wizardStep === 0 && (
              <section className="space-y-5 rounded-xl border border-[#30363d]/50 bg-[#21262d] p-6">
                <h2 className="font-['Manrope',system-ui,sans-serif] text-xl font-black tracking-tight text-[#e6edf3]">Basic details</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>Job title</label>
                    <input
                      className={inputClass}
                      value={basic.title}
                      onChange={(e) => setBasic((b) => ({ ...b, title: e.target.value }))}
                      placeholder="e.g. Senior Frontend Engineer"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Department</label>
                    <input
                      className={inputClass}
                      value={basic.department}
                      onChange={(e) => setBasic((b) => ({ ...b, department: e.target.value }))}
                      placeholder="Engineering"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Location</label>
                    <input
                      className={inputClass}
                      value={basic.location}
                      onChange={(e) => setBasic((b) => ({ ...b, location: e.target.value }))}
                      placeholder="Remote, US"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Headcount</label>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={basic.headcount}
                      onChange={(e) => setBasic((b) => ({ ...b, headcount: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Employment type</label>
                    <select
                      className={inputClass}
                      value={basic.employment}
                      onChange={(e) => setBasic((b) => ({ ...b, employment: e.target.value }))}
                    >
                      {["Full-time", "Contract", "Intern"].map((x) => (
                        <option key={x} value={x} className="bg-[#161b22]">
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>
            )}

            {wizardStep === 1 && (
              <section className="space-y-5 rounded-xl border border-[#30363d]/50 bg-[#21262d] p-6">
                <h2 className="font-['Manrope',system-ui,sans-serif] text-xl font-black tracking-tight text-[#e6edf3]">Role definition</h2>
                <div>
                  <label className={labelClass}>Role narrative</label>
                  <textarea className={`${inputClass} min-h-[140px] resize-y`} value={roleBody} onChange={(e) => setRoleBody(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Requirements (one per line)</label>
                  <textarea
                    className={`${inputClass} min-h-[120px] resize-y font-mono text-xs`}
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="flex items-center gap-1 rounded-full border border-emerald-700/50 bg-emerald-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-tight text-emerald-300 hover:bg-emerald-900/50 active:scale-95"
                      >
                        {s}
                        <MsIcon name="close" className="text-sm" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className={inputClass}
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                      placeholder="Add skill"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="shrink-0 rounded-xl bg-[#30363d] px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#e6edf3] hover:bg-[#484f58] active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </section>
            )}

            {wizardStep === 2 && (
              <section className="space-y-5 rounded-xl border border-[#30363d]/50 bg-[#21262d] p-6">
                <h2 className="font-['Manrope',system-ui,sans-serif] text-xl font-black tracking-tight text-[#e6edf3]">Compensation & team</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className={labelClass}>Salary min</label>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={comp.min}
                      onChange={(e) => setComp((c) => ({ ...c, min: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Salary max</label>
                    <input
                      className={inputClass}
                      inputMode="numeric"
                      value={comp.max}
                      onChange={(e) => setComp((c) => ({ ...c, max: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Currency</label>
                    <select
                      className={inputClass}
                      value={comp.currency}
                      onChange={(e) => setComp((c) => ({ ...c, currency: e.target.value }))}
                    >
                      {["USD", "EUR", "GBP"].map((x) => (
                        <option key={x} value={x} className="bg-[#161b22]">
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Bonus %</label>
                    <input
                      className={inputClass}
                      inputMode="decimal"
                      value={comp.bonusPct}
                      onChange={(e) => setComp((c) => ({ ...c, bonusPct: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Equity band</label>
                    <input
                      className={inputClass}
                      value={comp.equity}
                      onChange={(e) => setComp((c) => ({ ...c, equity: e.target.value }))}
                      placeholder="0.06% – 0.12%"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Hiring manager</label>
                    <div className="grid grid-cols-1 gap-2">
                      {["Priya Nair", "Marcus Chen", "Elena Vance"].map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setHiringManager(name)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all active:scale-[0.98] ${
                            hiringManager === name
                              ? "border-[#0059bb]/50 bg-[#0059bb]/10 text-[#0059bb]"
                              : "border-[#30363d]/70 bg-[#161b22] text-[#e6edf3] hover:border-[#484f58]"
                          }`}
                        >
                          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#30363d] text-xs font-black text-[#e6edf3]">
                            {name
                              .split(" ")
                              .map((p) => p[0])
                              .join("")}
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#21262d] bg-[#4edea3]" />
                          </span>
                          {name}
                          {hiringManager === name && <MsIcon name="check_circle" className="ml-auto text-[#4edea3]" filled />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {wizardStep === 3 && (
              <section className="space-y-5 rounded-xl border border-[#30363d]/50 bg-[#21262d] p-6">
                <h2 className="font-['Manrope',system-ui,sans-serif] text-xl font-black tracking-tight text-[#e6edf3]">Review & publish</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-xl border border-[#30363d]/60 bg-[#161b22] p-5 border-l-4 border-l-[#0059bb]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#757682]">Role</p>
                    <p className="mt-2 font-bold text-[#e6edf3]">{basic.title || "—"}</p>
                    <p className="mt-1 text-xs text-[#8b949e]">
                      {basic.department} · {basic.location || "TBD"} · {basic.employment}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#30363d]/60 bg-[#161b22] p-5 border-l-4 border-l-[#4edea3]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#757682]">Compensation</p>
                    <p className="mt-2 font-bold text-[#e6edf3]">
                      {comp.min && comp.max ? `${comp.currency} ${comp.min} – ${comp.max}` : "Set in prior step"}
                    </p>
                    <p className="mt-1 text-xs text-[#8b949e]">
                      Bonus {comp.bonusPct}% · {comp.equity || "Equity TBD"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#8b949e]">Publishing destinations</p>
                  <div className="space-y-3">
                    {(
                      [
                        ["careers", "MOxE careers site", publishDest.careers],
                        ["linkedin", "LinkedIn", publishDest.linkedin],
                        ["indeed", "Indeed", publishDest.indeed],
                      ] as const
                    ).map(([key, label, checked]) => (
                      <label
                        key={key}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#30363d]/60 bg-[#161b22] px-4 py-3 hover:bg-[#30363d]/50"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#484f58] bg-[#21262d] text-[#0059bb] focus:ring-[#0059bb]/40"
                          checked={checked}
                          onChange={(e) => setPublishDest((p) => ({ ...p, [key]: e.target.checked }))}
                        />
                        <span className="text-sm font-semibold text-[#e6edf3]">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#30363d]/60 bg-[#161b22] px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#484f58] bg-[#21262d] text-[#0059bb] focus:ring-[#0059bb]/40"
                    checked={schedulePublish}
                    onChange={(e) => setSchedulePublish(e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-[#e6edf3]">Schedule publish (draft until approved)</span>
                </label>
              </section>
            )}
          </div>

          <aside className="space-y-4 min-w-0">
            <div className="rounded-xl border border-[#30363d]/70 bg-[#30363d] p-5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#0059bb]">
                <MsIcon name="lightbulb" />
                Market insight
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#e6edf3]">
                Demand for {basic.title || "this profile"} is trending up 12% quarter over quarter in {basic.location || "your markets"}.
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#161b22]">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#0059bb] to-[#0070ea]" />
              </div>
              <p className="mt-2 text-[10px] text-[#8b949e]">Suggested time-to-fill: 24 days</p>
            </div>
            <div className="rounded-xl border border-[#30363d]/60 bg-[#21262d] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#757682]">AI suggestion</p>
              <p className="mt-2 text-xs text-[#8b949e]">
                Add “design systems” and “performance budgets” to requirements to improve match quality for senior ICs.
              </p>
              <button
                type="button"
                onClick={() => toast.success("Applied suggestion to draft")}
                className="mt-4 w-full rounded-xl bg-[#161b22] py-2 text-[10px] font-bold uppercase tracking-wider text-[#0059bb] hover:bg-[#30363d] active:scale-95"
              >
                Apply to draft
              </button>
            </div>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-[#30363d]/50 pt-6">
          <button
            type="button"
            onClick={() => setWizardStep((s) => (s > 0 ? ((s - 1) as WizardStep) : s))}
            disabled={wizardStep === 0}
            className="rounded-xl border border-[#30363d]/80 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-[#e6edf3] hover:bg-[#161b22] disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
          >
            Back
          </button>
          {wizardStep < 3 ? (
            <button
              type="button"
              onClick={() => setWizardStep((s) => (s < 3 ? ((s + 1) as WizardStep) : s))}
              className="rounded-xl bg-gradient-to-br from-[#00113a] to-[#002366] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white hover:opacity-90 active:scale-95"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void saveWizard()}
              disabled={saveBusy}
              className="rounded-xl bg-gradient-to-br from-[#00113a] to-[#002366] px-6 py-3 text-[10px] font-black uppercase tracking-wider text-white hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              {saveBusy
                ? "Saving…"
                : editingId
                  ? "Save changes"
                  : schedulePublish
                    ? "Save as draft"
                    : "Create & publish"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
