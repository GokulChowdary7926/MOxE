import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Contact,
  Copy,
  FileText,
  History,
  LayoutDashboard,
  MapPin,
  PenLine,
  Rocket,
  Search,
  Share2,
  Star,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import JobRequisitionsPanel from "../../components/recruiter/JobRequisitionsPanel";
import CandidatePipelinePanel from "../../components/recruiter/CandidatePipelinePanel";
import { JobBibleReferenceSection, JobToolBibleShell } from "../../components/job/bible";
import { getApiBase, getAuthHeaders } from "../../services/api";
import { readApiError } from "../../utils/readApiError";
import { ensureAbsoluteMediaUrl } from "../../utils/mediaUtils";

/** MOxE TRACK Recruitment — dark shell (navy brand + light text + blue accents) */
const R = {
  brand: "#00113a",
  brand2: "#002366",
  primary: "#e6edf3",
  secondary: "#58a6ff",
  secondaryStrong: "#79b8ff",
  surface: "#0d1117",
  low: "#161b22",
  lowest: "#21262d",
  container: "#30363d",
  high: "#484f58",
  onSurface: "#e6edf3",
  muted: "#8b949e",
  outline: "#6e7681",
  outlineVar: "#30363d",
  primaryFixed: "#30363d",
  onPfVar: "#79b8ff",
  chartAlt: "#a371f7",
  linkedin: "#0077b5",
  error: "#f85149",
  radiusLg: 14,
  radiusXl: 12,
};

type RecruiterView =
  | "recruiter-dashboard"
  | "candidate-search"
  | "bulk-import"
  | "candidate-profile"
  | "job-requisitions"
  | "candidate-pipeline"
  | "hiring-approval"
  | "job-board-analytics"
  | "offer-letter"
  | "offer-status"
  | "onboarding-handoff"
  | "schedule-interview"
  | "interview-evaluation";

const RECRUITER_FULL_WIDTH_VIEWS: RecruiterView[] = ["job-requisitions", "candidate-pipeline"];

const NAV_ITEMS: Array<{ key: RecruiterView; label: string; icon: React.ReactNode }> = [
  { key: "recruiter-dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: "candidate-search", label: "Talent Discovery", icon: <Search className="w-4 h-4" /> },
  { key: "job-requisitions", label: "Job Requisitions", icon: <Briefcase className="w-4 h-4" /> },
  { key: "candidate-pipeline", label: "Pipeline", icon: <Users className="w-4 h-4" /> },
  { key: "bulk-import", label: "Bulk Import", icon: <Upload className="w-4 h-4" /> },
  { key: "candidate-profile", label: "Candidate Profile", icon: <UserPlus className="w-4 h-4" /> },
  { key: "hiring-approval", label: "Approvals", icon: <ClipboardCheck className="w-4 h-4" /> },
  { key: "job-board-analytics", label: "Job Board Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { key: "offer-letter", label: "Offer Letter", icon: <FileText className="w-4 h-4" /> },
  { key: "offer-status", label: "Offer Tracking", icon: <HandCoinsIcon /> },
  { key: "onboarding-handoff", label: "Onboarding", icon: <Contact className="w-4 h-4" /> },
  { key: "schedule-interview", label: "Schedule Interview", icon: <Calendar className="w-4 h-4" /> },
  { key: "interview-evaluation", label: "Interview Evaluation", icon: <PenLine className="w-4 h-4" /> },
];

function resumeFileLabel(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "Resume";
  try {
    const path = url.split("?")[0].split("/").pop() || "Resume";
    return decodeURIComponent(path) || "Resume";
  } catch {
    return "Resume";
  }
}

function CandidateResumePreview({
  resumeUrl,
  secondary,
  surface,
}: {
  resumeUrl: string | null | undefined;
  secondary: string;
  surface: string;
}) {
  const abs = ensureAbsoluteMediaUrl(resumeUrl ?? "");
  if (!abs) {
    return (
      <div className="p-12 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-center max-w-sm" style={{ color: secondary }}>
          No resume on file. The candidate can attach one when applying or when added via import.
        </p>
      </div>
    );
  }
  const path = abs.split("?")[0].toLowerCase();
  const isPdf = path.endsWith(".pdf") || path.includes(".pdf?");
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(path);

  if (isPdf) {
    return (
      <div className="flex flex-col min-h-[360px]" style={{ background: surface }}>
        <iframe title="Resume PDF preview" src={abs} className="w-full flex-1 min-h-[420px] border-0" />
        <a
          href={abs}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs font-bold py-3 border-t"
          style={{ color: secondary, borderColor: "rgba(110,118,129,0.35)" }}
        >
          Open PDF in new tab
        </a>
      </div>
    );
  }
  if (isImage) {
    return (
      <div className="p-4 flex justify-center" style={{ background: surface }}>
        <img src={abs} alt="Resume" className="max-h-[560px] max-w-full object-contain rounded-lg" />
      </div>
    );
  }
  return (
    <div className="p-12 min-h-[240px] flex flex-col items-center justify-center gap-3 text-center">
      <FileText className="w-10 h-10" style={{ color: secondary }} />
      <p className="text-sm max-w-sm" style={{ color: secondary }}>
        Inline preview isn&apos;t available for this file type. Open the file to review it.
      </p>
      <a href={abs} target="_blank" rel="noopener noreferrer" className="text-sm font-bold" style={{ color: secondary }}>
        Download / open resume
      </a>
    </div>
  );
}

function HandCoinsIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="9" r="6" />
      <path d="M15 15a6 6 0 0 1 6 6M21 9V7a2 2 0 0 0-2-2h-2" />
    </svg>
  );
}

export default function Recruiter() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<RecruiterView>("candidate-search");
  const [dupePolicy, setDupePolicy] = useState<"skip" | "update" | "merge">("skip");
  const [trackJobs, setTrackJobs] = useState<Array<{ id: string; title: string }>>([]);
  /** Shared by Talent discovery and Candidate pipeline */
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [talentRows, setTalentRows] = useState<
    Array<{
      key: string;
      kind: "application" | "recruitment";
      candidateId: string;
      name: string;
      role: string;
      blurb: string;
      match: number;
      skills: string[];
    }>
  >([]);
  const [profileRef, setProfileRef] = useState<{ kind: "application" | "recruitment"; candidateId: string } | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<Record<string, unknown> | null>(null);
  const [candidateProfileLoading, setCandidateProfileLoading] = useState(false);
  const [candidateProfileError, setCandidateProfileError] = useState<string | null>(null);
  const [talentLoading, setTalentLoading] = useState(false);
  const [talentError, setTalentError] = useState<string | null>(null);

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
      "moxe-recruit-manrope",
      "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
    );
  }, []);

  useEffect(() => {
    if (activeView !== "candidate-search" && activeView !== "candidate-pipeline") return;
    let cancelled = false;
    (async () => {
      setTalentError(null);
      try {
        const jobsRes = await fetch(`${getApiBase()}/job/track/jobs?myOnly=true&status=ALL`, {
          headers: getAuthHeaders(),
        });
        if (!jobsRes.ok) throw new Error(await readApiError(jobsRes));
        const list = await jobsRes.json();
        const jobs = Array.isArray(list) ? list : [];
        const mapped = jobs.map((j: { id: string; title?: string }) => ({
          id: j.id,
          title: j.title || "Job posting",
        }));
        if (cancelled) return;
        setTrackJobs(mapped);
        setActiveJobId((prev) => {
          if (prev && mapped.some((j) => j.id === prev)) return prev;
          return mapped[0]?.id ?? null;
        });
      } catch (e: unknown) {
        if (!cancelled) setTalentError(e instanceof Error ? e.message : "Failed to load jobs");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "candidate-search" || !activeJobId) {
      setTalentRows([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setTalentLoading(true);
      setTalentError(null);
      try {
        const candRes = await fetch(`${getApiBase()}/job/track/jobs/${activeJobId}/candidates`, {
          headers: getAuthHeaders(),
        });
        if (!candRes.ok) throw new Error(await readApiError(candRes));
        const data = await candRes.json();
        const applications = data.applications || [];
        const recruitment = data.recruitmentCandidates || [];
        const jobTitle = data.job?.title || "Role";
        const rows: Array<{
          key: string;
          kind: "application" | "recruitment";
          candidateId: string;
          name: string;
          role: string;
          blurb: string;
          match: number;
          skills: string[];
        }> = [];
        for (const a of applications) {
          const acc = a.account;
          const name = acc?.displayName || acc?.username || "Applicant";
          const rating = typeof a.rating === "number" ? a.rating : 3;
          rows.push({
            key: `app-${a.id}`,
            kind: "application",
            candidateId: a.id,
            name,
            role: jobTitle,
            blurb: (a.coverLetter || "").slice(0, 220) || "Applied via MOxE Track",
            match: Math.min(100, Math.round((rating / 5) * 100)),
            skills: [],
          });
        }
        for (const c of recruitment) {
          const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email;
          const rating = typeof c.rating === "number" ? c.rating : 3;
          rows.push({
            key: `rec-${c.id}`,
            kind: "recruitment",
            candidateId: c.id,
            name,
            role: c.currentTitle || "Candidate",
            blurb: (c.coverLetter || c.currentCompany || "").slice(0, 220) || "Sourced candidate",
            match: Math.min(100, Math.round((rating / 5) * 100)),
            skills: [],
          });
        }
        rows.sort((x, y) => y.match - x.match);
        if (!cancelled) setTalentRows(rows);
      } catch (e: unknown) {
        if (!cancelled) setTalentError(e instanceof Error ? e.message : "Failed to load candidates");
      } finally {
        if (!cancelled) setTalentLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeView, activeJobId]);

  useEffect(() => {
    if (activeView !== "candidate-profile" || !profileRef) {
      setCandidateProfile(null);
      setCandidateProfileError(null);
      setCandidateProfileLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setCandidateProfileLoading(true);
      setCandidateProfileError(null);
      try {
        const res = await fetch(
          `${getApiBase()}/job/track/candidates/${profileRef.kind}/${encodeURIComponent(profileRef.candidateId)}`,
          { headers: getAuthHeaders() },
        );
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) throw new Error((data.error as string) || "Failed to load candidate");
        if (!cancelled) setCandidateProfile(data);
      } catch (e: unknown) {
        if (!cancelled) setCandidateProfileError(e instanceof Error ? e.message : "Failed to load candidate");
        if (!cancelled) setCandidateProfile(null);
      } finally {
        if (!cancelled) setCandidateProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeView, profileRef]);

  const activeTitle = useMemo(() => NAV_ITEMS.find((x) => x.key === activeView)?.label ?? "MOxE TRACK", [activeView]);
  const isFullWidthLayout = RECRUITER_FULL_WIDTH_VIEWS.includes(activeView);

  const card = {
    background: R.lowest,
    border: `1px solid ${R.outlineVar}`,
    borderRadius: R.radiusLg,
  };

  const renderPrimaryPanel = () => {
    if (activeView === "recruiter-dashboard") {
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
              Good morning, Alex
            </h1>
            <p className="mt-1 text-base" style={{ color: R.muted }}>
              Here is what&apos;s happening with your pipeline today.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { k: "Active Requisitions", v: "12", hint: "+2", accent: R.secondary, bar: "75%" },
              { k: "New Applications", v: "48", hint: "Today", accent: R.secondaryStrong, bar: "100%" },
              { k: "Pending Interviews", v: "06", hint: "Next: 10:30 AM", accent: R.outline, bar: "50%" },
            ].map((m) => (
              <div key={m.k} className="p-6 rounded-xl shadow-sm border-l-4" style={{ ...card, borderLeftColor: m.accent }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: R.muted }}>
                  {m.k}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-extrabold" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                    {m.v}
                  </span>
                  <span className="text-sm font-bold" style={{ color: R.secondary }}>
                    {m.hint}
                  </span>
                </div>
                <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: R.container }}>
                  <div className="h-full rounded-full" style={{ width: m.bar, background: m.accent }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-6">
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                  Active pipeline
                </h3>
                <button type="button" className="text-sm font-bold" style={{ color: R.secondary }}>
                  View all pipeline
                </button>
              </div>
              <div className="p-5 rounded-xl shadow-sm space-y-4" style={card}>
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold text-lg" style={{ color: R.primary }}>
                      Senior Product Designer
                    </h4>
                    <p className="text-sm flex items-center gap-1 mt-1" style={{ color: R.muted }}>
                      <MapPin className="w-4 h-4" /> San Francisco, CA (Remote)
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${R.secondary}18`, color: R.secondary }}>
                    High priority
                  </span>
                </div>
                <div className="flex gap-2 h-12">
                  {[
                    ["Applied", "24", true],
                    ["Screened", "8", false],
                    ["Interviewing", "3", false],
                    ["Offer", "0", false],
                  ].map(([l, n, on]) => (
                    <div
                      key={String(l)}
                      className="flex-1 rounded flex flex-col items-center justify-center text-xs"
                      style={{
                        background: R.low,
                        borderBottom: on ? `4px solid ${R.secondary}` : undefined,
                        color: R.onSurface,
                      }}
                    >
                      <span className="font-bold text-[10px]" style={{ color: R.muted }}>
                        {l}
                      </span>
                      <span className="font-bold">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
            <aside className="space-y-4">
              <h3 className="text-xl font-bold" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                Upcoming interviews
              </h3>
              <div className="p-2 rounded-xl space-y-2" style={{ background: R.low }}>
                {[
                  ["Jane Doe", "Technical Screen", "10:30 AM", "ZOOM LINK"],
                  ["Marcus Rivera", "Final Round", "02:15 PM", "IN-PERSON"],
                ].map(([name, typ, time, tag]) => (
                  <div key={String(name)} className="p-4 rounded-lg border shadow-sm" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                    <div className="font-bold" style={{ color: R.primary }}>
                      {name}
                    </div>
                    <p className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: R.muted }}>
                      {typ}
                    </p>
                    <div className="flex justify-between mt-3 text-sm" style={{ color: R.muted }}>
                      <span>{time}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: R.container, color: R.secondary }}>
                        {tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 rounded-xl text-white space-y-3" style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}>
                <p className="text-xs font-bold uppercase opacity-60">Recruitment insight</p>
                <p className="font-medium">&quot;Candidate drop-off is 15% higher this week in the Screened stage.&quot;</p>
                <button type="button" className="w-full py-2 rounded-lg text-sm font-bold" style={{ background: R.secondary, color: "#fff" }}>
                  View analytics
                </button>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView === "candidate-search") {
      return (
        <div className="space-y-8">
          <div className="flex flex-col gap-6 justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                Talent discovery
              </h1>
              <p className="mt-2 max-w-lg" style={{ color: R.muted }}>
                Find and filter through top-tier candidates using precision match scoring.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-white shadow-lg"
              style={{ background: R.brand, boxShadow: `0 8px 24px rgba(0,17,58,0.45)` }}
              onClick={() => navigate("/job/track/jobs")}
            >
              <UserPlus className="w-5 h-5" />
              Add candidate
            </button>
          </div>
          {trackJobs.length > 0 ? (
            <div className="mt-4">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: R.muted }}>
                Job posting
              </label>
              <select
                value={activeJobId || ""}
                onChange={(e) => setActiveJobId(e.target.value || null)}
                className="mt-2 w-full rounded-xl border px-4 py-3 text-sm"
                style={{ background: R.lowest, borderColor: R.outlineVar, color: R.onSurface }}
              >
                {trackJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {talentError ? (
            <p className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ background: `${R.error}22`, color: R.error }}>
              {talentError}
            </p>
          ) : null}
          <div className="relative mt-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: R.outline }} />
            <input
              readOnly
              className="w-full pl-12 pr-4 py-5 rounded-xl border-none shadow-sm text-lg"
              style={{ background: R.lowest, color: R.onSurface }}
              placeholder="Search by name, role, or keywords..."
            />
          </div>
          <div className="flex flex-col gap-8">
            <aside className="space-y-6">
              <div className="p-6 rounded-xl" style={{ background: R.low }}>
                <div className="flex justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: R.muted }}>
                    Filters
                  </h3>
                  <button type="button" className="text-xs font-bold" style={{ color: R.secondary }}>
                    Reset
                  </button>
                </div>
                <p className="text-xs font-bold uppercase mb-3" style={{ color: R.muted }}>
                  Skills
                </p>
                <div className="flex flex-wrap gap-2">
                  {["React", "Python", "Node.js", "AWS", "TypeScript"].map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1.5 text-xs rounded-full font-medium cursor-pointer"
                      style={{
                        background: s === "React" || s === "Node.js" ? R.secondary : R.high,
                        color: s === "React" || s === "Node.js" ? "#fff" : R.muted,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-bold uppercase mt-8 mb-2" style={{ color: R.muted }}>
                  Location
                </p>
                <div className="flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2" style={{ background: R.high, borderColor: R.outlineVar }}>
                  <MapPin className="w-4 h-4" style={{ color: R.outline }} />
                  <span className="text-sm">San Francisco, CA</span>
                </div>
              </div>
            </aside>
            <div className="space-y-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm" style={{ color: R.muted }}>
                  {talentLoading
                    ? "Loading candidates…"
                    : `Showing ${talentRows.length} candidate${talentRows.length === 1 ? "" : "s"}`}
                </span>
                <span className="text-sm flex items-center gap-1" style={{ color: R.muted }}>
                  Sort by: <strong style={{ color: R.onSurface }}>Match score</strong>
                </span>
              </div>
              {!activeJobId && !talentLoading ? (
                <p className="text-sm" style={{ color: R.muted }}>
                  Create a job posting in MOxE Track (Recruit or Jobs) to load candidates for this requisition.
                </p>
              ) : null}
              {talentRows.map((c) => (
                <article
                  key={c.key}
                  className="flex flex-col items-stretch gap-6 p-6 rounded-xl hover:shadow-xl transition-shadow border-l-4"
                  style={{ ...card, borderLeftColor: R.secondary }}
                >
                  <div className="w-20 h-20 rounded-full shrink-0 flex items-center justify-center font-bold text-sm" style={{ background: R.container, color: R.primary }}>
                    {c.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex flex-col gap-2 mb-1">
                      <h3 className="text-xl font-extrabold" style={{ color: R.primary }}>
                        {c.name}
                      </h3>
                      <span className="font-semibold text-sm" style={{ color: R.secondary }}>
                        {c.role}
                      </span>
                    </div>
                    <p className="text-sm mb-4" style={{ color: R.muted }}>
                      {c.blurb}
                    </p>
                    <div className="flex flex-wrap justify-start gap-2">
                      {c.skills.map((t) => (
                        <span key={t} className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full" style={{ background: R.primaryFixed, color: R.onPfVar }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-stretch gap-2 px-0 pt-4 border-t" style={{ borderColor: R.outlineVar }}>
                    <div className="text-2xl font-black" style={{ color: c.match >= 95 ? R.secondary : R.muted }}>
                      {c.match}%
                    </div>
                    <span className="text-[10px] uppercase font-bold" style={{ color: R.outline }}>
                      Match
                    </span>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                      style={{ background: R.brand2, color: "#fff" }}
                      onClick={() => {
                        setProfileRef({ kind: c.kind, candidateId: c.candidateId });
                        setActiveView("candidate-profile");
                      }}
                    >
                      View profile
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeView === "bulk-import") {
      return (
        <div className="space-y-10">
          <div>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
              Bulk import candidates
            </h1>
            <p className="mt-2 font-medium" style={{ color: R.muted }}>
              Scale your pipeline by importing talent from CSV, LinkedIn, or external integrations.
            </p>
          </div>
          <div className="flex flex-col gap-8">
            <div className="space-y-8">
              <section className="p-8 rounded-xl shadow-sm" style={card}>
                <div className="flex justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                    <Upload className="w-6 h-6" style={{ color: R.secondary }} strokeWidth={2} />
                    Choose source
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: R.container, color: R.muted }}>
                    Step 1 of 3
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div
                    className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-[#21262d]/60"
                    style={{ borderColor: `${R.outlineVar}` }}
                  >
                    <Upload className="w-12 h-12 mb-4" style={{ color: R.outline }} />
                    <p className="font-bold" style={{ color: R.primary }}>
                      Drop CSV or Excel files here
                    </p>
                    <p className="text-sm mt-1" style={{ color: R.muted }}>
                      Maximum file size 25MB
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <button type="button" className="flex items-center justify-center gap-3 p-4 rounded-xl font-bold text-white hover:opacity-90" style={{ background: R.linkedin }}>
                      <Share2 className="w-5 h-5" />
                      LinkedIn
                    </button>
                    <button type="button" className="flex items-center justify-center gap-3 p-4 rounded-xl font-bold border" style={{ background: R.lowest, borderColor: R.outlineVar, color: R.onSurface }}>
                      <Building2 className="w-5 h-5" style={{ color: R.secondary }} />
                      Greenhouse
                    </button>
                    <button type="button" className="flex items-center justify-center gap-3 p-4 rounded-xl font-bold border" style={{ background: R.lowest, borderColor: R.outlineVar, color: R.onSurface }}>
                      <Briefcase className="w-5 h-5" style={{ color: R.error }} />
                      Lever
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span style={{ color: R.muted }}>Uploading: Candidates_Q4_Lead.csv</span>
                    <span style={{ color: R.secondary }}>72%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: R.container }}>
                    <div className="h-full w-[72%] rounded-full" style={{ background: R.secondary }} />
                  </div>
                </div>
              </section>
              <section className="p-8 rounded-xl shadow-sm" style={card}>
                <div className="flex justify-between mb-8">
                  <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                    <FileText className="w-6 h-6" style={{ color: R.secondary }} />
                    Field mapping
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: R.container, color: R.muted }}>
                    Step 2 of 3
                  </span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: R.muted }}>
                  <span>CSV column name</span>
                  <span>System field</span>
                </div>
                {[
                  ["full_name", "Candidate Name", false],
                  ["email_address", "Primary Email", false],
                  ["current_role", "Current Position", false],
                  ["phone_number", "Unmapped - Required", true],
                ].map(([col, field, err]) => (
                  <div key={String(col)} className="grid grid-cols-2 items-center gap-4 p-4 rounded-lg mt-2" style={{ background: R.low }}>
                    <span className="font-medium flex items-center gap-2" style={{ color: err ? R.error : R.primary }}>
                      {col}
                      {err ? <span className="text-xs">⚠</span> : null}
                    </span>
                    <select className="rounded-lg text-sm font-semibold border-none px-2 py-2" style={{ background: R.lowest, color: R.onSurface, border: err ? `1px solid ${R.error}` : undefined }}>
                      <option>{field}</option>
                    </select>
                  </div>
                ))}
              </section>
            </div>
            <div className="space-y-8">
              <section className="p-8 rounded-xl" style={{ background: R.container }}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                  <Copy className="w-5 h-5" style={{ color: R.secondary }} />
                  Duplicate handling
                </h3>
                <div className="space-y-4">
                  {(
                    [
                      ["skip", "Skip", "Do not import if email already exists."],
                      ["update", "Update", "Overwrite existing data with new file content."],
                      ["merge", "Merge", "Add missing fields to existing profiles."],
                    ] as const
                  ).map(([id, title, desc]) => (
                    <label
                      key={id}
                      className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all hover:ring-2"
                      style={{ background: R.lowest, color: R.onSurface, border: `1px solid ${R.outlineVar}` }}
                    >
                      <input
                        type="radio"
                        name="dupe"
                        checked={dupePolicy === id}
                        onChange={() => setDupePolicy(id)}
                        className="mt-1"
                        style={{ accentColor: R.secondary }}
                      />
                      <div>
                        <p className="font-bold" style={{ color: R.primary }}>
                          {title}
                        </p>
                        <p className="text-xs mt-1" style={{ color: R.muted }}>
                          {desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  className="w-full mt-8 py-4 font-bold rounded-lg text-white flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${R.brand} 0%, ${R.brand2} 100%)` }}
                >
                  Run import process
                  <ArrowRight className="w-5 h-5" />
                </button>
              </section>
              <section className="p-8 rounded-xl shadow-sm" style={card}>
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                  <History className="w-5 h-5" style={{ color: R.secondary }} />
                  Recent batches
                </h3>
                <div className="space-y-6 relative pl-6 border-l-2" style={{ borderColor: R.high }}>
                  <div className="relative">
                    <div className="absolute -left-[29px] top-1 w-2.5 h-2.5 rounded-full" style={{ background: R.secondary }} />
                    <p className="text-xs font-bold uppercase" style={{ color: R.muted }}>
                      Today, 10:45 AM
                    </p>
                    <h4 className="font-bold text-sm mt-1" style={{ color: R.primary }}>
                      LinkedIn_Sales_Leads.csv
                    </h4>
                    <div className="flex gap-4 mt-2 text-xs font-semibold">
                      <span style={{ color: R.secondary }}>124 Imported</span>
                      <span style={{ color: R.muted }}>12 Skipped</span>
                    </div>
                  </div>
                </div>
                <button type="button" className="w-full mt-8 py-2 text-sm font-bold rounded-lg transition-colors hover:bg-[#30363d]/80" style={{ color: R.secondary }}>
                  View all activity
                </button>
              </section>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === "candidate-profile") {
      if (!profileRef) {
        return (
          <div className="space-y-6 max-w-xl">
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
              Candidate profile
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: R.muted }}>
              Select someone from <strong style={{ color: R.onSurface }}>Talent discovery</strong> (View profile) or{" "}
              <strong style={{ color: R.onSurface }}>Pipeline</strong> (View profile on a card) to load their resume and details from MOxE
              Track.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg font-bold text-white"
                style={{ background: R.brand2 }}
                onClick={() => setActiveView("candidate-search")}
              >
                Talent discovery
              </button>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg font-bold border"
                style={{ background: R.lowest, borderColor: R.outlineVar, color: R.primary }}
                onClick={() => setActiveView("candidate-pipeline")}
              >
                Pipeline
              </button>
            </div>
          </div>
        );
      }

      if (candidateProfileLoading) {
        return (
          <p className="text-sm" style={{ color: R.muted }}>
            Loading candidate…
          </p>
        );
      }
      if (candidateProfileError || !candidateProfile) {
        return (
          <div className="space-y-4">
            <p className="text-sm rounded-lg px-4 py-3" style={{ background: `${R.error}22`, color: R.error }}>
              {candidateProfileError || "Could not load this candidate."}
            </p>
            <button
              type="button"
              className="text-sm font-bold"
              style={{ color: R.secondary }}
              onClick={() => setProfileRef(null)}
            >
              Clear selection
            </button>
          </div>
        );
      }

      const kind = candidateProfile.kind === "recruitment" ? "recruitment" : "application";
      let displayName = "Candidate";
      let title = "";
      let email = "—";
      let phone = "—";
      let location = "—";
      let resumeUrl: string | null = null;
      let coverSnippet = "";
      let rating: number | null = null;
      let skills: string[] = [];
      let stageName = "";
      let statusLabel = "";

      if (kind === "application") {
        const acc = candidateProfile.account as Record<string, unknown> | undefined;
        displayName = (acc?.displayName as string)?.trim() || (acc?.username as string) || "Applicant";
        const jp = candidateProfile.jobPosting as { title?: string } | undefined;
        title = jp?.title || (acc?.professionalHeadline as string) || "";
        email = typeof acc?.contactEmail === "string" && acc.contactEmail ? acc.contactEmail : "—";
        phone = typeof acc?.contactPhone === "string" && acc.contactPhone ? acc.contactPhone : "—";
        location = typeof acc?.location === "string" && acc.location ? acc.location : "—";
        resumeUrl = typeof candidateProfile.resumeUrl === "string" ? candidateProfile.resumeUrl : null;
        coverSnippet = typeof candidateProfile.coverLetter === "string" ? candidateProfile.coverLetter : "";
        rating = typeof candidateProfile.rating === "number" ? candidateProfile.rating : null;
        skills = Array.isArray(acc?.skills) ? (acc!.skills as string[]).slice(0, 16) : [];
        const ps = candidateProfile.pipelineStage as { name?: string } | undefined;
        stageName = ps?.name || "";
        statusLabel = typeof candidateProfile.status === "string" ? candidateProfile.status : "";
      } else {
        const fn = (candidateProfile.firstName as string) || "";
        const ln = (candidateProfile.lastName as string) || "";
        displayName = `${fn} ${ln}`.trim() || (candidateProfile.email as string) || "Candidate";
        title = (candidateProfile.currentTitle as string) || "";
        email = typeof candidateProfile.email === "string" ? candidateProfile.email : "—";
        phone = typeof candidateProfile.phone === "string" && candidateProfile.phone ? candidateProfile.phone : "—";
        location = typeof candidateProfile.currentCompany === "string" && candidateProfile.currentCompany ? candidateProfile.currentCompany : "—";
        resumeUrl = typeof candidateProfile.resumeUrl === "string" ? candidateProfile.resumeUrl : null;
        coverSnippet = typeof candidateProfile.coverLetter === "string" ? candidateProfile.coverLetter : "";
        rating = typeof candidateProfile.rating === "number" ? candidateProfile.rating : null;
        const ps = candidateProfile.pipelineStage as { name?: string } | undefined;
        stageName = ps?.name || "";
        statusLabel = typeof candidateProfile.status === "string" ? candidateProfile.status : "";
      }

      const parts = displayName.trim().split(/\s+/).filter(Boolean);
      const initials =
        parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (displayName.slice(0, 2).toUpperCase() || "?");
      const matchPct = rating != null ? Math.min(100, Math.round((rating / 5) * 100)) : null;
      const resumeTitle = resumeFileLabel(resumeUrl);

      return (
        <div className="space-y-8">
          <div className="flex flex-col gap-6 justify-between">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-xl shadow-xl flex items-center justify-center text-2xl font-bold"
                  style={{ background: R.primaryFixed, color: R.onPfVar }}
                >
                  {initials}
                </div>
                {rating != null ? (
                  <div
                    className="absolute -bottom-2 -right-2 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg"
                    style={{ background: R.secondary }}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    {rating.toFixed(1)}
                  </div>
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight break-words" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                    {displayName}
                  </h2>
                  {statusLabel ? (
                    <span
                      className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest shrink-0"
                      style={{ background: R.primaryFixed, color: R.onPfVar }}
                    >
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
                {title ? (
                  <p className="text-lg sm:text-xl font-medium mb-4 break-words" style={{ color: R.muted }}>
                    {title}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: R.muted }}>
                  <span>{email}</span>
                  <span>{phone}</span>
                  <span>{location}</span>
                </div>
                <p className="mt-2 text-xs font-bold uppercase tracking-wider" style={{ color: R.outline }}>
                  {kind === "application" ? "Site applicant" : "Recruiter-sourced"} · MOxE Track
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-bold border"
                style={{ background: R.lowest, borderColor: R.outlineVar, color: R.primary }}
                onClick={() => setActiveView("schedule-interview")}
              >
                Schedule interview
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}
                onClick={() => setActiveView("offer-letter")}
              >
                Offer workflow
              </button>
              <button
                type="button"
                className="px-6 py-3 rounded-lg font-bold border"
                style={{ background: "transparent", borderColor: R.outlineVar, color: R.muted }}
                onClick={() => setProfileRef(null)}
              >
                Back to list
              </button>
            </div>
          </div>

          {stageName ? (
            <div className="p-4 rounded-xl text-sm font-bold" style={{ background: R.low, color: R.secondary }}>
              Pipeline stage: {stageName}
            </div>
          ) : null}

          <div className="flex flex-col xl:flex-row gap-6">
            <div className="space-y-6 flex-1 min-w-0">
              <div className="rounded-xl overflow-hidden border shadow-sm" style={{ ...card, borderColor: `${R.outlineVar}44` }}>
                <div
                  className="px-6 py-4 border-b flex justify-between items-center gap-3"
                  style={{ background: `${R.low}80`, borderColor: `${R.outlineVar}44` }}
                >
                  <h3 className="font-bold flex items-center gap-2 min-w-0" style={{ color: R.primary }}>
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="truncate">{resumeTitle}</span>
                  </h3>
                </div>
                <CandidateResumePreview resumeUrl={resumeUrl} secondary={R.muted} surface={R.surface} />
              </div>
              <div className="p-6 rounded-xl shadow-sm" style={card}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: R.primary }}>
                  <Users className="w-5 h-5" /> Cover letter & notes
                </h3>
                <p className="text-sm whitespace-pre-wrap break-words" style={{ color: R.muted }}>
                  {coverSnippet.trim() ? coverSnippet : "No cover letter stored for this candidate."}
                </p>
              </div>
            </div>
            <aside className="space-y-6 w-full xl:w-[320px] shrink-0">
              <div className="p-6 rounded-xl text-white shadow-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}>
                <h3 className="font-bold mb-4 opacity-90">Recruiter rating</h3>
                {matchPct != null ? (
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-5xl font-extrabold">{matchPct}</span>
                    <span className="text-xl opacity-60">%</span>
                    <span className="ml-auto text-xs font-bold px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.2)" }}>
                      vs 5★ scale
                    </span>
                  </div>
                ) : (
                  <p className="text-sm opacity-80 mb-2">No rating yet — use Track to score this candidate.</p>
                )}
                {typeof candidateProfile.ratingComment === "string" && candidateProfile.ratingComment ? (
                  <p className="text-sm opacity-90 leading-snug mt-3">&ldquo;{candidateProfile.ratingComment}&rdquo;</p>
                ) : null}
              </div>
              <div className="p-6 rounded-xl" style={card}>
                <h3 className="font-bold mb-3" style={{ color: R.primary }}>
                  Skills (profile)
                </h3>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((t) => (
                      <span key={t} className="px-3 py-1.5 text-xs font-bold rounded-lg" style={{ background: R.low, color: R.primary }}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: R.muted }}>
                    No skills on file{kind === "recruitment" ? " (add via ATS import or candidate profile)." : "."}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView === "job-requisitions") return <JobRequisitionsPanel />;
    if (activeView === "candidate-pipeline")
      return (
        <CandidatePipelinePanel
          jobId={activeJobId}
          onJobChange={setActiveJobId}
          onOpenCandidate={(sel) => {
            setProfileRef(sel);
            setActiveView("candidate-profile");
          }}
        />
      );

    if (activeView === "hiring-approval") {
      return (
        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
              Manager approval central
            </h1>
            <p className="mt-2" style={{ color: R.muted }}>
              Review and authorize pending talent requisitions and final offer packages.
            </p>
          </header>
          <div className="flex flex-col gap-8">
            <section className="space-y-4">
              <div className="flex justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: R.primary }}>
                  Pending approvals
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: R.brand2 }}>
                    3 NEW
                  </span>
                </h2>
                <button type="button" className="text-sm font-semibold" style={{ color: R.secondary }}>
                  View all
                </button>
              </div>
              {[
                ["Senior UX Architect", "Product Design", "$140k – $175k"],
                ["Lead Data Scientist", "Core AI", "$180k – $220k"],
              ].map(([title, dept, salary]) => (
                <div key={String(title)} className="p-6 rounded-xl shadow-sm border-l-4" style={{ ...card, borderLeftColor: R.secondary }}>
                  <div className="flex justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase opacity-60" style={{ color: R.muted }}>
                        New requisition
                      </span>
                      <h3 className="text-lg font-bold mt-1" style={{ color: R.primary }}>
                        {title}
                      </h3>
                    </div>
                    <p className="text-xs text-right" style={{ color: R.muted }}>
                      {dept}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg mb-4 text-sm font-bold" style={{ background: R.low, color: R.primary }}>
                    Base salary range: {salary}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" className="px-4 py-2 text-sm font-semibold rounded-lg" style={{ color: R.muted }}>
                      Request change
                    </button>
                    <button
                      type="button"
                      className="px-6 py-2 text-sm font-bold rounded-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}
            </section>
            <aside className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: R.primary }}>
                Final offers
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: R.secondary }}>
                  2 ACTION
                </span>
              </h2>
              <div className="rounded-2xl p-2 space-y-2" style={{ background: R.low }}>
                {[
                  ["Elena Rodriguez", "Principal Engineer", "$195,000", "$20,000 sign-on"],
                  ["Thomas Kendrick", "Product Manager", "$155,000", "15% bonus"],
                ].map(([name, role, base, extra]) => (
                  <div key={String(name)} className="rounded-xl p-5 shadow-sm border" style={{ borderColor: `${R.outlineVar}99`, background: R.lowest }}>
                    <h4 className="font-bold" style={{ color: R.primary }}>
                      {name}
                    </h4>
                    <p className="text-xs mt-1" style={{ color: R.muted }}>
                      {role}
                    </p>
                    <div className="mt-3 text-sm space-y-1">
                      <div className="flex justify-between">
                        <span style={{ color: R.muted }}>Base</span>
                        <span className="font-bold" style={{ color: R.primary }}>
                          {base}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: R.muted }}>Other</span>
                        <span className="font-bold" style={{ color: R.secondary }}>
                          {extra}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button type="button" className="flex-1 py-2 text-xs font-bold rounded-lg" style={{ background: R.high, color: R.primary }}>
                        Review
                      </button>
                      <button type="button" className="flex-1 py-2 text-xs font-bold rounded-lg text-white" style={{ background: R.secondary }}>
                        Sign offer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 rounded-2xl text-white" style={{ background: R.brand2 }}>
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Recent decisions
                </h3>
                <p className="text-sm opacity-90">Offer accepted — Marketing Lead</p>
                <p className="text-sm opacity-70 mt-2">Approved requisition — QA Analyst</p>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView === "job-board-analytics") {
      return (
        <div className="space-y-8">
          <div className="flex flex-col gap-6 justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: R.secondary }}>
                Performance overview
              </span>
              <h1 className="text-4xl font-extrabold leading-tight" style={{ color: R.onSurface, fontFamily: "Manrope, sans-serif" }}>
                Job board distribution &amp; conversion
              </h1>
              <p className="mt-4 text-lg" style={{ color: R.muted }}>
                Analyze channel efficacy across premium networks.
              </p>
            </div>
            <button
              type="button"
              className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}
            >
              Post to new board
            </button>
          </div>
          <div className="flex flex-col gap-6">
            <div className="p-8 rounded-xl shadow-sm" style={card}>
              <div className="flex justify-between mb-8">
                <h3 className="text-xl font-bold" style={{ fontFamily: "Manrope, sans-serif", color: R.primary }}>
                  Traffic attribution
                </h3>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: R.secondary }} />
                    Views
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: R.chartAlt }} />
                    Applications
                  </span>
                </div>
              </div>
              <div className="h-64 flex items-end gap-4">
                {[
                  [85, 40],
                  [60, 25],
                  [45, 35],
                  [30, 12],
                ].map(([a, b], i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                    <div className="w-full flex-1 rounded-t-lg relative flex flex-col justify-end overflow-hidden" style={{ background: R.high }}>
                      <div className="w-full rounded-t-lg absolute bottom-0 opacity-30" style={{ height: `${a}%`, background: R.secondary }} />
                      <div className="w-full rounded-t-lg absolute bottom-0" style={{ height: `${b}%`, background: R.secondary }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: R.muted }}>
                      {["LinkedIn", "Indeed", "Company", "Glassdoor"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="p-6 rounded-xl text-white shadow-lg relative overflow-hidden flex-1" style={{ background: R.brand }}>
                <span className="text-xs font-bold uppercase opacity-70">Aggregate CTR</span>
                <div className="text-5xl font-black mt-2">12.4%</div>
                <p className="text-sm mt-4 opacity-80">+2.1% from last week</p>
                <TrendingUpIcon />
              </div>
              <div className="p-6 rounded-xl border-l-4 shadow-sm" style={{ ...card, borderLeftColor: R.secondary }}>
                <span className="text-xs font-bold uppercase" style={{ color: R.muted }}>
                  Active channels
                </span>
                <div className="text-3xl font-bold mt-1" style={{ color: R.onSurface }}>
                  08 <span className="text-sm font-medium">platforms</span>
                </div>
              </div>
            </div>
          </div>
          <section className="rounded-2xl p-4 overflow-hidden" style={{ background: R.low }}>
            <div className="px-4 py-6 flex justify-between">
              <h3 className="text-xl font-bold" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                Active distribution channels
              </h3>
            </div>
            {[
              ["LinkedIn Premium", "in", R.linkedin, "18.2%", "1,240", true],
              ["Indeed Sponsored", "I", "#2164f3", "9.4%", "856", true],
              ["Company Careers", "M", R.primary, "24.1%", "312", true],
            ].map(([name, abbr, color, ctr, apps, live]) => (
              <div key={String(name)} className="p-6 rounded-xl flex flex-wrap items-center justify-between gap-4 mb-2 shadow-sm" style={{ background: R.lowest }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: String(color) }}>
                    {String(abbr)}
                  </div>
                  <div>
                    <div className="font-bold">{name}</div>
                    <div className="text-xs" style={{ color: R.muted }}>
                      Sample channel · connect ATS for live metrics
                    </div>
                  </div>
                </div>
                <div className="flex gap-8 text-center text-sm">
                  <div>
                    <div className="text-xs font-bold uppercase" style={{ color: R.outline }}>
                      CTR
                    </div>
                    <div className="font-semibold">{ctr}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase" style={{ color: R.outline }}>
                      Apps
                    </div>
                    <div className="font-semibold">{apps}</div>
                  </div>
                </div>
                <button type="button" className="text-sm font-bold" style={{ color: R.secondary }}>
                  Details →
                </button>
              </div>
            ))}
          </section>
        </div>
      );
    }

    if (activeView === "offer-letter") {
      return (
        <div className="space-y-8">
          <header className="flex flex-col gap-6 justify-between">
            <div>
              <nav className="flex items-center gap-2 text-sm mb-2" style={{ color: R.muted }}>
                <span>Offers</span>
                <ChevronRight className="w-4 h-4" />
                <span style={{ color: R.secondary }}>Generate offer letter</span>
              </nav>
              <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                Create official offer
              </h1>
              <p className="mt-2" style={{ color: R.muted }}>
                Drafting for <strong>Alex Rivera</strong> · Senior Product Designer
              </p>
            </div>
            <div className="flex gap-3">
              <button type="button" className="px-6 py-2.5 rounded-lg font-semibold" style={{ color: R.secondary }}>
                Save draft
              </button>
              <button
                type="button"
                className="px-8 py-3 rounded-lg font-bold text-white flex items-center gap-2 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}
              >
                Preview offer letter
              </button>
            </div>
          </header>
          <div className="flex flex-col gap-8">
            <div className="space-y-8">
              <section className="p-8 rounded-xl shadow-sm" style={card}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: R.primary }}>
                  <span className="w-1 h-6 rounded-full" style={{ background: R.secondary }} />
                  Compensation package
                </h2>
                <div className="grid grid-cols-1 gap-6">
                  {["Base salary (USD)", "Start date", "Annual bonus %", "Sign-on bonus"].map((label) => (
                    <div key={label}>
                      <label className="text-xs font-bold uppercase tracking-widest" style={{ color: R.muted }}>
                        {label}
                      </label>
                      <input className="w-full mt-2 border-0 border-b-2 py-3 bg-transparent" style={{ borderColor: R.outlineVar }} placeholder="—" />
                    </div>
                  ))}
                </div>
              </section>
              <section className="p-8 rounded-xl border shadow-sm" style={{ background: R.lowest, borderColor: R.high }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: R.primary }}>
                  Standard benefits
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {["Health & Dental", "401(k) Matching", "Unlimited PTO", "Learning Budget"].map((b) => (
                    <label key={b} className="flex items-center gap-3 p-4 rounded-lg cursor-pointer border" style={{ borderColor: R.outlineVar }}>
                      <input type="checkbox" defaultChecked className="rounded" style={{ accentColor: R.secondary }} />
                      <span className="font-bold text-sm">{b}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            <aside className="space-y-6">
              <div className="p-6 rounded-xl text-white relative overflow-hidden shadow-xl" style={{ background: R.primary }}>
                <h3 className="font-bold text-lg mb-4">Offer impact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b border-white/20">
                    <span className="opacity-80">Market percentile</span>
                    <span className="font-bold">85th</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="opacity-80">Budget utilization</span>
                    <span className="font-bold">92%</span>
                  </div>
                </div>
              </div>
              <div className="p-6 rounded-xl" style={{ background: R.high }}>
                <h3 className="font-bold mb-3" style={{ color: R.primary }}>
                  Historical context
                </h3>
                <div className="p-4 rounded-lg text-sm" style={{ background: `${R.container}99`, color: R.onSurface }}>
                  <p className="text-xs font-bold uppercase" style={{ color: R.muted }}>
                    Candidate expectation
                  </p>
                  <p className="text-lg font-bold mt-1" style={{ color: R.secondary }}>
                    $140k – $150k
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView === "offer-status") {
      return (
        <div className="space-y-8">
          <div className="flex flex-col gap-6 justify-between">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
                Offer management
              </h1>
              <p className="mt-2 max-w-xl" style={{ color: R.muted }}>
                Active salary negotiations, document tracking, and conversion analytics.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="p-4 rounded-xl min-w-[140px] shadow-sm border" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                <span className="text-xs font-bold uppercase" style={{ color: R.muted }}>
                  Active offers
                </span>
                <div className="text-2xl font-bold mt-1">12</div>
              </div>
              <div className="p-4 rounded-xl min-w-[140px] shadow-sm border" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                <span className="text-xs font-bold uppercase" style={{ color: R.muted }}>
                  Accepted (MoM)
                </span>
                <div className="text-2xl font-bold mt-1" style={{ color: R.secondary }}>
                  +8
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <section className="space-y-4">
              {[
                ["James Smith", "Countered", "#501300"],
                ["Amara Ling", "Extended", R.secondary],
                ["Kevin Tran", "Signed", "#36B37E"],
              ].map(([name, status, col]) => (
                <div key={String(name)} className="p-6 rounded-xl shadow-sm border relative overflow-hidden" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: String(col) }} />
                  <div className="flex flex-wrap justify-between gap-4 pl-2">
                    <div>
                      <h4 className="font-bold text-lg" style={{ color: R.primary }}>
                        {name}
                      </h4>
                      <p className="text-sm" style={{ color: R.muted }}>
                        Senior Backend Engineer
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase self-start" style={{ background: `${String(col)}22`, color: String(col) }}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
            </section>
            <aside className="space-y-4 min-w-0">
              <div className="p-8 rounded-2xl text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}>
                <h3 className="text-xl font-bold mb-4">Negotiation activity</h3>
                <p className="text-sm opacity-90 mb-4">James Smith countered base salary to $190k.</p>
                <button type="button" className="text-xs font-bold px-2 py-1 rounded border border-white/30">
                  Respond
                </button>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView === "onboarding-handoff") {
      return (
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest" style={{ background: R.secondary }}>
              Candidate hired!
            </span>
            <span className="text-sm" style={{ color: R.muted }}>
              Case #MT-8842
            </span>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
            Onboarding handoff
          </h1>
          <p className="text-lg max-w-xl" style={{ color: R.muted }}>
            Finalize the transition for <strong>Elena Rodriguez</strong>. Data will sync to HRIS and IT provisioning.
          </p>
          <div className="flex flex-col gap-8">
            <div className="space-y-6">
              <div className="p-8 rounded-xl shadow-sm border" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: R.primary }}>
                  <CheckCircle2 className="w-6 h-6" style={{ color: R.secondary }} />
                  HRIS sync checklist
                </h2>
                {["Background check clear", "IT equipment provisioning", "Direct deposit setup"].map((t, i) => (
                  <div key={t} className="flex items-center justify-between p-4 rounded-lg mb-2" style={{ background: R.low }}>
                    <span className="font-semibold">{t}</span>
                    {i === 0 ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: `${R.secondary}18`, color: R.secondary }}>
                        Verified
                      </span>
                    ) : (
                      <input type="checkbox" defaultChecked={i === 1} className="w-5 h-5 rounded" style={{ accentColor: R.secondary }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <aside className="space-y-4">
              <div className="p-6 rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: R.secondary, background: R.lowest }}>
                <h4 className="font-bold mb-2" style={{ color: R.primary }}>
                  Ready for handoff?
                </h4>
                <p className="text-sm mb-4" style={{ color: R.muted }}>
                  This action cannot be undone once the HRIS trigger is sent.
                </p>
                <button type="button" className="w-full py-4 rounded-lg font-extrabold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}>
                  Complete handoff
                </button>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView === "schedule-interview") {
      return (
        <div className="space-y-8">
          <nav className="flex gap-2 text-sm mb-4" style={{ color: R.muted }}>
            <span>Candidates</span>/<span>Jane Doe</span>/
            <span className="font-semibold" style={{ color: R.secondary }}>
              Schedule interview
            </span>
          </nav>
          <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
            Technical interview
          </h1>
          <p className="text-lg" style={{ color: R.muted }}>
            Set up the assessment phase for Jane Doe · Senior Software Engineer
          </p>
          <div className="flex flex-col gap-12">
            <div className="space-y-8">
              <section className="p-8 rounded-xl shadow-sm border" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                <h3 className="text-xl font-bold mb-6" style={{ color: R.primary }}>
                  Interviewer selection
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {["Marcus Chen", "Sarah Jenkins"].map((n) => (
                    <div key={n} className="flex items-center gap-4 p-4 rounded-lg border-l-4" style={{ background: R.low, borderLeftColor: R.secondary }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: R.primaryFixed, color: R.onPfVar }}>
                        {n
                          .split(" ")
                          .map((p) => p[0])
                          .join("")}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold" style={{ color: R.primary }}>
                          {n}
                        </p>
                        <p className="text-xs" style={{ color: R.muted }}>
                          Available
                        </p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: R.secondary }} />
                    </div>
                  ))}
                </div>
              </section>
              <section className="p-8 rounded-xl shadow-sm border" style={{ borderColor: R.outlineVar, background: R.lowest }}>
                <h3 className="text-xl font-bold mb-6" style={{ color: R.primary }}>
                  Schedule details
                </h3>
                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <label className="text-sm font-bold ml-1" style={{ color: R.primary }}>
                      Proposed date
                    </label>
                    <input
                      type="date"
                      className="w-full mt-2 px-4 py-3 rounded-t-lg border-b-2 border-transparent"
                      style={{ background: R.low, color: R.onSurface, borderBottomColor: R.outlineVar }}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold ml-1" style={{ color: R.primary }}>
                      Time (local)
                    </label>
                    <input
                      type="time"
                      className="w-full mt-2 px-4 py-3 rounded-t-lg border-b-2"
                      style={{ background: R.low, color: R.onSurface, borderBottomColor: R.outlineVar }}
                      defaultValue="14:00"
                    />
                  </div>
                </div>
              </section>
              <div className="flex justify-end gap-4">
                <button type="button" className="font-bold" style={{ color: R.muted }}>
                  Cancel
                </button>
                <button type="button" className="px-10 py-4 rounded-lg font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${R.brand}, ${R.brand2})` }}>
                  Schedule interview
                </button>
              </div>
            </div>
            <aside className="space-y-4 min-w-0">
              <div className="p-6 rounded-xl shadow-sm border" style={{ background: R.lowest, borderColor: R.outlineVar }}>
                <div className="w-20 h-20 rounded-lg mb-4 flex items-center justify-center font-bold text-lg" style={{ background: R.primaryFixed, color: R.onPfVar }}>
                  JD
                </div>
                <h4 className="text-2xl font-extrabold" style={{ color: R.primary }}>
                  Jane Doe
                </h4>
                <p className="text-sm font-bold uppercase tracking-wider mt-2" style={{ color: R.secondary }}>
                  Candidate profile
                </p>
                <p className="text-sm mt-4" style={{ color: R.muted }}>
                  8+ years · React, Node, AWS · San Francisco
                </p>
              </div>
            </aside>
          </div>
        </div>
      );
    }

    if (activeView !== "interview-evaluation") {
      return (
        <div className="p-8 rounded-xl border text-center max-w-lg mx-auto" style={{ ...card, color: R.muted }}>
          This section is not available for the current view.
        </div>
      );
    }

    return (
      <div className="space-y-10 max-w-full min-w-0">
        <div className="flex flex-col gap-8">
          <div className="min-w-0">
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4" style={{ color: R.muted }}>
              <span>Pipeline</span>
              <ChevronRight className="w-4 h-4" />
              <span>Feedback form</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tighter leading-none" style={{ color: R.primary, fontFamily: "Manrope, sans-serif" }}>
              Technical evaluation:
              <br />
              <span style={{ color: R.secondaryStrong }}>Jane Doe</span>
            </h1>
          </div>
          <div className="text-left">
            <p className="text-sm" style={{ color: R.muted }}>
              Interview date
            </p>
            <p className="text-xl font-bold" style={{ color: R.primary }}>
              October 24, 2023
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-10">
          <div className="space-y-8">
            <section className="p-8 rounded-xl space-y-8 shadow-sm border" style={{ borderColor: R.outlineVar, background: R.lowest }}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: R.primary }}>
                <BarChart3 className="w-5 h-5" style={{ color: R.secondary }} />
                Performance metrics
              </h3>
              {[
                ["Skill match", "High proficiency", 85],
                ["Communication", "Articulate", 72],
                ["Culture fit", "Strong alignment", 90],
              ].map(([label, badge, val]) => (
                <div key={String(label)} className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-bold uppercase tracking-wider" style={{ color: R.primary }}>
                      {String(label)}
                    </label>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: R.primaryFixed, color: R.onPfVar }}>
                      {String(badge)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    defaultValue={Number(val)}
                    className="w-full"
                    style={{ accentColor: R.secondary }}
                  />
                </div>
              ))}
            </section>
            <section className="space-y-4">
              <label className="text-sm font-extrabold flex items-center gap-2" style={{ color: R.primary }}>
                <CheckCircle2 className="w-4 h-4" style={{ color: R.secondary }} />
                Key strengths
              </label>
              <textarea className="w-full min-h-[120px] p-4 rounded-lg border text-sm" style={{ borderColor: R.outlineVar }} placeholder="Outline primary technical advantages…" />
              <label className="text-sm font-extrabold flex items-center gap-2" style={{ color: R.primary }}>
                Areas of concern
              </label>
              <textarea className="w-full min-h-[120px] p-4 rounded-lg border text-sm" style={{ borderColor: R.outlineVar }} placeholder="Gaps or red flags…" />
            </section>
          </div>
          <aside className="space-y-6">
            <div className="p-8 rounded-xl text-white shadow-xl relative overflow-hidden" style={{ background: R.brand }}>
              <h3 className="text-xl font-bold mb-6 uppercase tracking-tighter">Final recommendation</h3>
              <button type="button" className="w-full py-4 rounded font-extrabold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2" style={{ background: R.secondary }}>
                Recommendation: Hire
              </button>
              <button type="button" className="w-full py-4 rounded border border-white/20 font-extrabold text-sm uppercase tracking-widest">
                No hire
              </button>
            </div>
            <div className="p-6 rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: R.secondary, background: R.lowest }}>
              <h4 className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: R.primary }}>
                Interview context
              </h4>
              <div className="text-sm flex justify-between py-2 border-b" style={{ borderColor: `${R.outlineVar}44` }}>
                <span style={{ color: R.muted }}>Role</span>
                <span className="font-bold" style={{ color: R.primary }}>
                  Senior Cloud Architect
                </span>
              </div>
            </div>
          </aside>
        </div>
        <div className="fixed bottom-28 right-6 z-30">
          <button type="button" className="px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 text-white font-extrabold text-sm uppercase tracking-widest" style={{ background: R.secondary }}>
            Submit feedback
            <Rocket className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  function TrendingUpIcon() {
    return (
      <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
        <TrendingUp className="w-28 h-28" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: R.surface, color: R.onSurface, fontFamily: "Inter, Manrope, system-ui, sans-serif" }}>
      <JobToolBibleShell toolTitle="MOxE TRACK · RECRUIT" toolIconMaterial="groups">
      <main className="mx-auto w-full min-w-0 flex-1 px-0 py-2 pb-4">
          <div
            className="-mx-4 sticky top-0 z-20 mb-4 border-b border-[#2d3449]/20 bg-[#0b1326] px-4 py-3"
            role="navigation"
            aria-label="Recruiter views"
          >
            <p className="mb-2 font-['Inter',system-ui,sans-serif] text-[10px] font-bold uppercase tracking-widest" style={{ color: R.secondary }}>
              MOxE Track — recruit · {activeTitle}
            </p>
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto pb-0.5">
              {[
                { label: "Dashboard", view: "recruiter-dashboard" as RecruiterView, Icon: LayoutDashboard },
                { label: "Talent", view: "candidate-search" as RecruiterView, Icon: Search },
                { label: "Board", view: "candidate-pipeline" as RecruiterView, Icon: Users },
                { label: "Offers", view: "offer-letter" as RecruiterView, Icon: FileText },
                { label: "More", view: "hiring-approval" as RecruiterView, Icon: ClipboardCheck },
              ].map(({ label, view, Icon }) => {
                const on = activeView === view;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setActiveView(view)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 font-['Inter',system-ui,sans-serif] text-[11px] font-bold uppercase tracking-tight transition-colors"
                    style={{
                      borderColor: on ? `${R.secondary}66` : `${R.outlineVar}66`,
                      background: on ? `${R.secondary}22` : "transparent",
                      color: on ? R.secondary : R.muted,
                    }}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={on ? 2.5 : 2} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <section className="space-y-6">{renderPrimaryPanel()}</section>
            <JobBibleReferenceSection toolKey="recruiter" />
          </div>
        </main>
      </JobToolBibleShell>
    </div>
  );
}