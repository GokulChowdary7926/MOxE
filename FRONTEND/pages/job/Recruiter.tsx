import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';

const API_BASE = getApiBase();

type TrackJob = {
  id: string;
  title: string;
  companyName?: string | null;
};

type PipelineStage = {
  id: string;
  name: string;
  order: number;
};

type CandidateKind = 'application' | 'recruitment';

type CandidateSummary = {
  id: string;
  kind: CandidateKind;
  status?: string | null;
  rating?: number | null;
  source?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  account?: {
    id: string;
    displayName: string;
    username?: string | null;
  } | null;
  pipelineStage?: PipelineStage | null;
};

type CandidatesByJobResponse = {
  job: any;
  applications: CandidateSummary[];
  recruitmentCandidates: CandidateSummary[];
  stages: PipelineStage[];
};

type CandidateDetail = any;

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Recruiter() {
  const [jobs, setJobs] = useState<TrackJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [candidates, setCandidates] = useState<CandidateSummary[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCandidate, setLoadingCandidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingCandidate, setCreatingCandidate] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    email: '',
    firstName: '',
    lastName: '',
    resumeUrl: '',
    source: '',
  });
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('GENERAL');
  const [ratingValue, setRatingValue] = useState<number | ''>('');
  const [decision, setDecision] = useState<'ADVANCE' | 'REJECT' | 'OFFER' | 'HOLD' | ''>('');

  const headers = useAuthHeaders();

  const loadJobs = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/jobs`, { headers });
      if (!res.ok) throw new Error('Failed to load jobs');
      const data = await res.json();
      setJobs(data || []);
      if (!selectedJobId && data?.length) {
        setSelectedJobId(data[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load jobs');
    }
  };

  const loadCandidates = async (jobId: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/job/track/jobs/${jobId}/candidates`, { headers });
      if (!res.ok) throw new Error('Failed to load candidates');
      const data: CandidatesByJobResponse = await res.json();
      const all: CandidateSummary[] = [
        ...(data.applications || []),
        ...(data.recruitmentCandidates || []),
      ];
      setStages((data.stages || []).sort((a, b) => a.order - b.order));
      setCandidates(all);
    } catch (e: any) {
      setError(e.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedJobId) {
      loadCandidates(selectedJobId);
      setSelectedCandidate(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId]);

  const openCandidate = async (c: CandidateSummary) => {
    setLoadingCandidate(true);
    setSelectedCandidate(null);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/track/candidates/${c.kind}/${c.id}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to load candidate');
      const data = await res.json();
      setSelectedCandidate(data);
      setRatingValue((data.rating as number) ?? '');
    } catch (e: any) {
      setError(e.message || 'Failed to load candidate');
    } finally {
      setLoadingCandidate(false);
    }
  };

  const stageNameForCandidate = (c: CandidateSummary) => {
    return c.pipelineStage?.name || 'Unassigned';
  };

  const groupedByStage: Record<string, CandidateSummary[]> = stages.reduce(
    (acc, stage) => {
      acc[stage.id] = candidates.filter(
        (c) => c.pipelineStage?.id === stage.id,
      );
      return acc;
    },
    {} as Record<string, CandidateSummary[]>,
  );

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return;
    setCreatingCandidate(true);
    setError(null);
    try {
      const body = {
        ...newCandidate,
      };
      const res = await fetch(
        `${API_BASE}/job/track/jobs/${selectedJobId}/candidates`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to add candidate');
      }
      setNewCandidate({
        email: '',
        firstName: '',
        lastName: '',
        resumeUrl: '',
        source: '',
      });
      await loadCandidates(selectedJobId);
    } catch (e: any) {
      setError(e.message || 'Failed to add candidate');
    } finally {
      setCreatingCandidate(false);
    }
  };

  const handleMoveStage = async (stageId: string) => {
    if (!selectedCandidate || !selectedJobId) return;
    const kind: CandidateKind = selectedCandidate.kind || 'application';
    try {
      const res = await fetch(
        `${API_BASE}/job/track/candidates/${kind}/${selectedCandidate.id}/move`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ pipelineStageId: stageId }),
        },
      );
      if (!res.ok) throw new Error('Failed to move candidate');
      const updated = await res.json();
      setSelectedCandidate(updated);
      await loadCandidates(selectedJobId);
    } catch (e: any) {
      setError(e.message || 'Failed to move candidate');
    }
  };

  const handleAddNote = async () => {
    if (!selectedCandidate || !selectedJobId || !noteText.trim()) return;
    const kind: CandidateKind = selectedCandidate.kind || 'application';
    try {
      const res = await fetch(
        `${API_BASE}/job/track/candidates/${kind}/${selectedCandidate.id}/notes`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            notes: noteText,
            append: true,
            noteType,
          }),
        },
      );
      if (!res.ok) throw new Error('Failed to add notes');
      const updated = await res.json();
      setSelectedCandidate(updated);
      setNoteText('');
      await loadCandidates(selectedJobId);
    } catch (e: any) {
      setError(e.message || 'Failed to add notes');
    }
  };

  const handleRate = async () => {
    if (!selectedCandidate || ratingValue === '') return;
    const val = Number(ratingValue);
    if (!val || val < 1 || val > 5) return;
    const kind: CandidateKind = selectedCandidate.kind || 'application';
    try {
      const res = await fetch(
        `${API_BASE}/job/track/candidates/${kind}/${selectedCandidate.id}/rate`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ rating: val }),
        },
      );
      if (!res.ok) throw new Error('Failed to rate candidate');
      const updated = await res.json();
      setSelectedCandidate(updated);
      if (selectedJobId) await loadCandidates(selectedJobId);
    } catch (e: any) {
      setError(e.message || 'Failed to rate candidate');
    }
  };

  const handleDecision = async () => {
    if (!selectedCandidate || !decision) return;
    const kind: CandidateKind = selectedCandidate.kind || 'application';
    try {
      const res = await fetch(
        `${API_BASE}/job/track/candidates/${kind}/${selectedCandidate.id}/decision`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ decision }),
        },
      );
      if (!res.ok) throw new Error('Failed to update decision');
      const updated = await res.json();
      setSelectedCandidate(updated);
      if (selectedJobId) await loadCandidates(selectedJobId);
    } catch (e: any) {
      setError(e.message || 'Failed to update decision');
    }
  };

  const currentJob = jobs.find((j) => j.id === selectedJobId) || null;

  return (
    <JobPageContent
      title="MOxE Recruiter"
      description="Manage recruitment pipelines, candidates, and interviews for your job postings."
      error={error}
    >
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="flex-1">

        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Job requisition
            </label>
            <select
              className="w-full md:w-80 rounded-lg border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-[#172B4D] dark:text-slate-100 focus:ring-1 focus:ring-[#0052CC]"
              value={selectedJobId || ''}
              onChange={(e) => setSelectedJobId(e.target.value || null)}
            >
              <option value="">Select a job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} {j.companyName ? `· ${j.companyName}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="md:text-right text-sm text-slate-500 dark:text-slate-400">
            {currentJob && (
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-200">
                  {currentJob.title}
                </div>
                <div>{currentJob.companyName}</div>
              </div>
            )}
          </div>
        </div>

        {selectedJobId && (
          <form
            onSubmit={handleAddCandidate}
            className="mb-6 p-4 rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-slate-800 dark:text-slate-100">
                Add candidate
              </h3>
              <button
                type="submit"
                disabled={creatingCandidate}
                className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#0052CC] text-xs font-medium text-white hover:bg-[#2684FF] disabled:opacity-50"
              >
                {creatingCandidate ? 'Adding...' : 'Add candidate'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                placeholder="Email *"
                required
                type="email"
                value={newCandidate.email}
                onChange={(e) =>
                  setNewCandidate((c) => ({ ...c, email: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                placeholder="First name *"
                required
                value={newCandidate.firstName}
                onChange={(e) =>
                  setNewCandidate((c) => ({ ...c, firstName: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                placeholder="Last name *"
                required
                value={newCandidate.lastName}
                onChange={(e) =>
                  setNewCandidate((c) => ({ ...c, lastName: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                placeholder="Resume URL *"
                required
                value={newCandidate.resumeUrl}
                onChange={(e) =>
                  setNewCandidate((c) => ({ ...c, resumeUrl: e.target.value }))
                }
              />
              <input
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                placeholder="Source (LinkedIn, Referral, etc.) *"
                required
                value={newCandidate.source}
                onChange={(e) =>
                  setNewCandidate((c) => ({ ...c, source: e.target.value }))
                }
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Email, name, resume URL and source are required. Candidates are added to the first stage of the job pipeline.
            </p>
          </form>
        )}

        {loading && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading candidates...
          </div>
        )}

        {!loading && selectedJobId && stages.length === 0 && (
          <div className="py-6 text-sm text-slate-500 dark:text-slate-400">
            This job has no pipeline stages yet. Configure stages in the main Track view.
          </div>
        )}

        {!loading && selectedJobId && stages.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="min-w-[220px] max-w-xs bg-slate-100 dark:bg-slate-800/70 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {stage.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {groupedByStage[stage.id]?.length || 0}
                  </div>
                </div>
                <div className="space-y-2">
                  {(groupedByStage[stage.id] || []).map((c) => {
                    const name =
                      c.kind === 'application'
                        ? c.account?.displayName || 'Application'
                        : `${c.firstName || ''} ${c.lastName || ''}`.trim() ||
                          c.email ||
                          'Candidate';
                    return (
                      <button
                        key={`${c.kind}-${c.id}`}
                        onClick={() => openCandidate(c)}
                        className="w-full text-left rounded-lg bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-700 px-3 py-2 hover:border-[#0052CC] hover:shadow-sm transition"
                      >
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between gap-2">
                          <span className="capitalize">
                            {c.kind === 'application' ? 'Application' : 'Sourced'}
                          </span>
                          {typeof c.rating === 'number' && (
                            <span>
                              Rating:{' '}
                              <span className="font-semibold text-amber-500">
                                {c.rating.toFixed(1)}
                              </span>
                            </span>
                          )}
                        </div>
                        {c.source && (
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            Source: {c.source}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  {(!groupedByStage[stage.id] ||
                    groupedByStage[stage.id].length === 0) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      No candidates in this stage.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full lg:w-80 xl:w-96 lg:border-l lg:border-slate-200 lg:dark:border-slate-700 lg:pl-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Candidate details
        </h3>
        {!selectedCandidate && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a candidate from the pipeline to view details and take actions.
          </p>
        )}
        {loadingCandidate && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading candidate...
          </p>
        )}
        {selectedCandidate && !loadingCandidate && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-[#DFE1E6] dark:border-slate-700">
              <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
                {selectedCandidate.kind === 'application'
                  ? selectedCandidate.account?.displayName || 'Application'
                  : `${selectedCandidate.firstName || ''} ${
                      selectedCandidate.lastName || ''
                    }`.trim() || selectedCandidate.email || 'Candidate'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
                <div>
                  Kind:{' '}
                  <span className="uppercase">
                    {selectedCandidate.kind || 'application'}
                  </span>
                </div>
                {selectedCandidate.email && (
                  <div>Email: {selectedCandidate.email}</div>
                )}
                {selectedCandidate.currentTitle && (
                  <div>Title: {selectedCandidate.currentTitle}</div>
                )}
                {selectedCandidate.currentCompany && (
                  <div>Company: {selectedCandidate.currentCompany}</div>
                )}
                {selectedCandidate.source && (
                  <div>Source: {selectedCandidate.source}</div>
                )}
                <div>
                  Stage:{' '}
                  {selectedCandidate.pipelineStage?.name || 'Unassigned'}
                </div>
                {typeof selectedCandidate.rating === 'number' && (
                  <div>Rating: {selectedCandidate.rating.toFixed(1)}</div>
                )}
                {selectedCandidate.status && (
                  <div>Status: {selectedCandidate.status}</div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Move stage
              </div>
              <select
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                value={selectedCandidate.pipelineStage?.id || ''}
                onChange={(e) => e.target.value && handleMoveStage(e.target.value)}
              >
                <option value="">Select stage</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Rating (1–5)
                </div>
                <button
                  type="button"
                  onClick={handleRate}
                  className="text-[11px] px-2 py-1 rounded bg-[#0052CC] text-white hover:bg-[#2684FF]"
                >
                  Save
                </button>
              </div>
              <input
                type="number"
                min={1}
                max={5}
                step={1}
                value={ratingValue}
                onChange={(e) =>
                  setRatingValue(e.target.value ? Number(e.target.value) : '')
                }
                className="w-20 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
              />
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Decision
                </div>
                <button
                  type="button"
                  onClick={handleDecision}
                  disabled={!decision}
                  className="text-[11px] px-2 py-1 rounded bg-[#0052CC] text-white hover:bg-[#2684FF] disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
              <select
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                value={decision}
                onChange={(e) =>
                  setDecision(
                    e.target.value
                      ? (e.target.value as typeof decision)
                      : '',
                  )
                }
              >
                <option value="">Select decision</option>
                <option value="ADVANCE">Advance</option>
                <option value="HOLD">Hold</option>
                <option value="OFFER">Offer</option>
                <option value="REJECT">Reject</option>
              </select>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Notes
                </div>
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  className="text-[11px] px-2 py-1 rounded border border-[#DFE1E6] text-[#172B4D] hover:bg-[#F4F5F7] disabled:opacity-40"
                >
                  Add note
                </button>
              </div>
              <select
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-[11px]"
                value={noteType}
                onChange={(e) => setNoteType(e.target.value)}
              >
                <option value="GENERAL">General</option>
                <option value="INTERVIEW_FEEDBACK">Interview feedback</option>
                <option value="FOLLOW_UP">Follow up</option>
                <option value="GREEN_FLAG">Green flag</option>
                <option value="RED_FLAG">Red flag</option>
                <option value="ADMIN">Admin</option>
              </select>
              <textarea
                className="w-full min-h-[70px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                placeholder="Add recruiter notes, interview impressions, or follow-ups..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              {selectedCandidate?.notes && (
                <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                    Existing notes
                  </div>
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-md px-2 py-1.5">
                    {selectedCandidate.notes}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </JobPageContent>
  );
}

