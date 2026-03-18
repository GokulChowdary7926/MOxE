import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';

const API_BASE = getApiBase();

type TrackProject = {
  id: string;
  name: string;
  template?: string;
  description?: string | null;
  _count?: { issues?: number; sprints?: number };
};

type BoardIssue = {
  id: string;
  summary: string;
  priority?: string;
  issueType?: string;
  assignee?: { id: string; displayName: string; username?: string | null } | null;
};

type BoardColumn = {
  id: string;
  name: string;
  wipLimit?: number | null;
  issues?: BoardIssue[];
};

type BoardResponse = {
  id: string;
  name: string;
  columns: BoardColumn[];
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Agile() {
  const [projects, setProjects] = useState<TrackProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [board, setBoard] = useState<BoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingIssue, setCreatingIssue] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', template: 'KANBAN' });
  const [newIssue, setNewIssue] = useState({ summary: '', description: '' });

  const headers = useAuthHeaders();

  const loadProjects = async () => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects`, { headers });
      if (!res.ok) throw new Error('Failed to load projects');
      const data = await res.json();
      setProjects(data || []);
      if (!selectedProjectId && data?.length) {
        setSelectedProjectId(data[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load projects');
    }
  };

  const loadBoard = async (projectId: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects/${projectId}/board`, {
        headers,
      });
      if (!res.ok) throw new Error('Failed to load board');
      const data = await res.json();
      setBoard(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load board');
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
      loadBoard(selectedProjectId);
    } else {
      setBoard(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setCreatingProject(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/track/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newProject.name.trim(),
          template: newProject.template,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create project');
      }
      setNewProject({ name: '', template: 'KANBAN' });
      await loadProjects();
    } catch (e: any) {
      setError(e.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newIssue.summary.trim()) return;
    setCreatingIssue(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/track/projects/${selectedProjectId}/issues`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            summary: newIssue.summary.trim(),
            description: newIssue.description.trim() || undefined,
          }),
        },
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create issue');
      }
      setNewIssue({ summary: '', description: '' });
      await loadBoard(selectedProjectId);
    } catch (e: any) {
      setError(e.message || 'Failed to create issue');
    } finally {
      setCreatingIssue(false);
    }
  };

  const handleMoveIssue = async (issueId: string, columnId: string) => {
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/job/track/issues/${issueId}/move`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ targetColumnId: columnId }),
        },
      );
      if (!res.ok) throw new Error('Failed to move issue');
      if (selectedProjectId) await loadBoard(selectedProjectId);
    } catch (e: any) {
      setError(e.message || 'Failed to move issue');
    }
  };

  const currentProject =
    projects.find((p) => p.id === selectedProjectId) || null;

  return (
    <JobPageContent
      title="MOxE Agile"
      description="Plan and track agile projects with boards, issues, and sprints."
      error={error}
    >
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-64 xl:w-72">
        <form
          onSubmit={handleCreateProject}
          className="mb-4 p-3 rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2"
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            New project
          </div>
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs mb-1"
            placeholder="Project name"
            value={newProject.name}
            onChange={(e) =>
              setNewProject((p) => ({ ...p, name: e.target.value }))
            }
          />
          <select
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            value={newProject.template}
            onChange={(e) =>
              setNewProject((p) => ({ ...p, template: e.target.value }))
            }
          >
            <option value="KANBAN">Kanban</option>
            <option value="SCRUM">Scrum</option>
            <option value="BUG_TRACKING">Bug tracking</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <button
            type="submit"
            disabled={creatingProject}
            className="w-full mt-1 inline-flex justify-center items-center rounded-md bg-[#0052CC] text-white text-xs font-medium py-1.5 hover:bg-[#2684FF] disabled:opacity-50"
          >
            {creatingProject ? 'Creating...' : 'Create project'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Projects
          </div>
          <div className="max-h-72 overflow-auto text-sm">
            {projects.length === 0 && (
              <div className="px-3 py-2 text-xs text-slate-500">
                No projects yet. Create your first project above.
              </div>
            )}
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`w-full text-left px-3 py-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-xs ${
                  selectedProjectId === p.id
                    ? 'bg-[#DEEBFF] dark:bg-[#0052CC]/20 text-[#0052CC] dark:text-[#2684FF]'
                    : 'hover:bg-[#F4F5F7] dark:hover:bg-slate-700 text-[#172B4D] dark:text-slate-200'
                }`}
              >
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {p.template || 'KANBAN'} ·{' '}
                  {p._count?.issues ?? 0} issues
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {selectedProjectId && (
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {currentProject?.name || 'Project board'}
                </div>
                {currentProject?.description && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {currentProject.description}
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={handleCreateIssue}
              className="mb-3 p-3 rounded-lg border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  New issue
                </div>
                <button
                  type="submit"
                  disabled={creatingIssue}
                  className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#0052CC] text-[11px] font-medium text-white hover:bg-[#2684FF] disabled:opacity-50"
                >
                  {creatingIssue ? 'Creating...' : 'Create issue'}
                </button>
              </div>
              <input
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                placeholder="Summary"
                value={newIssue.summary}
                onChange={(e) =>
                  setNewIssue((i) => ({ ...i, summary: e.target.value }))
                }
              />
              <textarea
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                placeholder="Description (optional)"
                rows={2}
                value={newIssue.description}
                onChange={(e) =>
                  setNewIssue((i) => ({ ...i, description: e.target.value }))
                }
              />
            </form>
          </div>
        )}

        {loading && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Loading board...
          </div>
        )}

        {!loading && !selectedProjectId && (
          <div className="py-8 text-sm text-slate-500 dark:text-slate-400">
            Select a project from the left to view its board.
          </div>
        )}

        {!loading && selectedProjectId && board && (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {board.columns.map((col) => (
              <div
                key={col.id}
                className="min-w-[240px] max-w-xs bg-[#F4F5F7] dark:bg-slate-800/70 rounded-xl p-3 border border-[#DFE1E6] dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                    {col.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(col.issues || []).length}
                    {col.wipLimit ? ` / ${col.wipLimit}` : ''}
                  </div>
                </div>
                <div className="space-y-2">
                  {(col.issues || []).map((issue) => (
                    <div
                      key={issue.id}
                      className="rounded-lg bg-white dark:bg-slate-900 border border-[#DFE1E6] dark:border-slate-700 px-3 py-2 text-xs"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-100 mb-0.5">
                        {issue.summary}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                        <span className="uppercase">
                          {issue.issueType || 'TASK'}
                        </span>
                        {issue.priority && (
                          <span className="capitalize">
                            {issue.priority.toLowerCase()}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {issue.assignee?.displayName ||
                            issue.assignee?.username ||
                            'Unassigned'}
                        </span>
                        <select
                          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-1 py-0.5 text-[11px]"
                          value={col.id}
                          onChange={(e) =>
                            e.target.value &&
                            handleMoveIssue(issue.id, e.target.value)
                          }
                        >
                          {board.columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {(col.issues || []).length === 0 && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      No issues in this column.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </JobPageContent>
  );
}

