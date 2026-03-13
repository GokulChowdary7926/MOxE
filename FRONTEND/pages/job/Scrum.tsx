import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type TrackProjectSummary = {
  id: string;
  name: string;
  template?: string;
  description?: string | null;
  _count?: { issues?: number; sprints?: number };
};

type TrackSprint = {
  id: string;
  name: string;
  goal?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
};

type SprintBoardColumn = {
  id: string;
  name: string;
  issues: {
    id: string;
    summary: string;
    issueType?: string;
    priority?: string;
    storyPoints?: number | null;
    assignee?: { displayName?: string; username?: string } | null;
  }[];
};

type SprintBoard = {
  id: string;
  name: string;
  columns: SprintBoardColumn[];
};

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

export default function Scrum() {
  const [projects, setProjects] = useState<TrackProjectSummary[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [sprints, setSprints] = useState<TrackSprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [board, setBoard] = useState<SprintBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [startingSprintId, setStartingSprintId] = useState<string | null>(null);
  const [completingSprintId, setCompletingSprintId] = useState<string | null>(null);

  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: '',
  });

  const headers = useAuthHeaders();

  const loadProjects = async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects`, { headers });
      if (!res.ok) throw new Error('Failed to load projects');
      const data = (await res.json()) as TrackProjectSummary[];
      const onlyScrum =
        (data || []).filter((p) => (p.template || 'KANBAN').toUpperCase() === 'SCRUM') || [];
      setProjects(onlyScrum);
      if (!selectedProjectId && onlyScrum.length > 0) {
        setSelectedProjectId(onlyScrum[0].id);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadSprints = async (projectId: string) => {
    if (!projectId) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects/${projectId}/sprints`, { headers });
      if (!res.ok) throw new Error('Failed to load sprints');
      const data = (await res.json()) as TrackSprint[];
      setSprints(data || []);
      const active = data?.find((s) => s.status === 'ACTIVE');
      const planned = data?.find((s) => s.status === 'PLANNED');
      const initial = active || planned || (data && data[0]) || null;
      setSelectedSprintId(initial ? initial.id : '');
    } catch (e: any) {
      setError(e?.message || 'Failed to load sprints');
    }
  };

  const loadBoard = async (projectId: string, sprintId: string) => {
    if (!projectId || !sprintId) {
      setBoard(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/track/projects/${projectId}/board?sprintId=${encodeURIComponent(
          sprintId,
        )}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to load sprint board');
      const data = await res.json();
      setBoard({
        id: data.id,
        name: data.name,
        columns: (data.columns || []).map((col: any) => ({
          id: col.id,
          name: col.name,
          issues: (col.issues || []).map((issue: any) => ({
            id: issue.id,
            summary: issue.summary,
            issueType: issue.issueType,
            priority: issue.priority,
            storyPoints: issue.storyPoints,
            assignee: issue.assignee,
          })),
        })),
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to load sprint board');
      setBoard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadSprints(selectedProjectId);
    } else {
      setSprints([]);
      setSelectedSprintId('');
      setBoard(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && selectedSprintId) {
      loadBoard(selectedProjectId, selectedSprintId);
    } else {
      setBoard(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSprintId]);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || null;
  const currentSprint = sprints.find((s) => s.id === selectedSprintId) || null;

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newSprint.name.trim()) return;
    setCreatingSprint(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects/${selectedProjectId}/sprints`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newSprint.name.trim(),
          goal: newSprint.goal.trim() || undefined,
          startDate: newSprint.startDate || undefined,
          endDate: newSprint.endDate || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create sprint');
      }
      setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
      await loadSprints(selectedProjectId);
    } catch (e: any) {
      setError(e?.message || 'Failed to create sprint');
    } finally {
      setCreatingSprint(false);
    }
  };

  const handleSprintStatus = async (sprint: TrackSprint, action: 'start' | 'complete') => {
    if (!sprint?.id) return;
    if (action === 'start') setStartingSprintId(sprint.id);
    if (action === 'complete') setCompletingSprintId(sprint.id);
    setError(null);
    try {
      const path =
        action === 'start'
          ? `${API_BASE}/job/track/sprints/${sprint.id}/start`
          : `${API_BASE}/job/track/sprints/${sprint.id}/complete`;
      const res = await fetch(path, { method: 'PATCH', headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update sprint');
      }
      await loadSprints(selectedProjectId);
    } catch (e: any) {
      setError(e?.message || 'Failed to update sprint');
    } finally {
      setStartingSprintId(null);
      setCompletingSprintId(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-80 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE SCRUM
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Plan and run sprints on top of your MOxE TRACK Scrum projects.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Scrum projects
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-64 overflow-auto">
            {loadingProjects && projects.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                Loading projects…
              </div>
            )}
            {!loadingProjects && projects.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                No Scrum projects yet. Create a project with template &quot;Scrum&quot; in MOxE
                Agile, then manage sprints here.
              </div>
            )}
            {projects.map((p) => {
              const isActive = p.id === selectedProjectId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-xs ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span>Scrum</span>
                    <span>
                      {(p._count?.sprints ?? 0) || 0} sprints · {p._count?.issues ?? 0} issues
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedProjectId && (
          <form
            onSubmit={handleCreateSprint}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 text-xs"
          >
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              New sprint
            </div>
            <input
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              placeholder="Sprint name"
              value={newSprint.name}
              onChange={(e) => setNewSprint((s) => ({ ...s, name: e.target.value }))}
            />
            <textarea
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              placeholder="Sprint goal (optional)"
              rows={2}
              value={newSprint.goal}
              onChange={(e) => setNewSprint((s) => ({ ...s, goal: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                value={newSprint.startDate}
                onChange={(e) => setNewSprint((s) => ({ ...s, startDate: e.target.value }))}
              />
              <input
                type="date"
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                value={newSprint.endDate}
                onChange={(e) => setNewSprint((s) => ({ ...s, endDate: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              disabled={creatingSprint}
              className="w-full mt-1 inline-flex justify-center items-center rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 hover:bg-indigo-700 disabled:opacity-50"
            >
              {creatingSprint ? 'Creating…' : 'Create sprint'}
            </button>
          </form>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {currentProject && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {currentProject.name}
              </div>
              {currentProject.description && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentProject.description}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{currentProject._count?.issues ?? 0} issues</span>
              <span>·</span>
              <span>{currentProject._count?.sprints ?? 0} sprints</span>
            </div>
          </div>
        )}

        {sprints.length > 0 && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                Sprint:
              </span>
              <select
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                value={selectedSprintId}
                onChange={(e) => setSelectedSprintId(e.target.value)}
              >
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status.toLowerCase()})
                  </option>
                ))}
              </select>
              {currentSprint?.startDate && currentSprint?.endDate && (
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(currentSprint.startDate).toLocaleDateString()} –{' '}
                  {new Date(currentSprint.endDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {currentSprint && (
              <div className="flex items-center gap-2">
                {currentSprint.status === 'PLANNED' && (
                  <button
                    type="button"
                    disabled={startingSprintId === currentSprint.id}
                    onClick={() => handleSprintStatus(currentSprint, 'start')}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-3 py-1.5"
                  >
                    {startingSprintId === currentSprint.id ? 'Starting…' : 'Start sprint'}
                  </button>
                )}
                {currentSprint.status === 'ACTIVE' && (
                  <button
                    type="button"
                    disabled={completingSprintId === currentSprint.id}
                    onClick={() => handleSprintStatus(currentSprint, 'complete')}
                    className="inline-flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5"
                  >
                    {completingSprintId === currentSprint.id ? 'Completing…' : 'Complete sprint'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading sprint board…
          </div>
        )}

        {!loading && !selectedProjectId && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Select a Scrum project on the left to view its sprints and board.
          </div>
        )}

        {!loading && selectedProjectId && sprints.length === 0 && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            No sprints yet. Create a sprint on the left to begin planning.
          </div>
        )}

        {!loading && selectedProjectId && selectedSprintId && board && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {board.columns.map((col) => (
              <div
                key={col.id}
                className="min-w-[240px] max-w-xs bg-slate-100 dark:bg-slate-800/70 rounded-xl p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {col.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {col.issues.length}
                  </div>
                </div>
                <div className="space-y-2">
                  {col.issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-100 mb-0.5">
                        {issue.summary}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                        <span className="uppercase">{issue.issueType || 'TASK'}</span>
                        {issue.storyPoints != null && (
                          <span className="font-semibold">{issue.storyPoints} pts</span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {issue.assignee?.displayName ||
                            issue.assignee?.username ||
                            'Unassigned'}
                        </span>
                        {issue.priority && (
                          <span className="text-[11px] capitalize text-slate-600 dark:text-slate-300">
                            {issue.priority.toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {col.issues.length === 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      No issues in this column for this sprint.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

