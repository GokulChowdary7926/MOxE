import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { readApiError } from '../../utils/readApiError';
import { JobPageContent } from '../../components/job/JobPageContent';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';
import { JOB_MOBILE } from '../../components/job/jobMobileStyles';

const API_BASE = getApiBase();

type WorkProject = {
  id: string;
  name: string;
  projectType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
};

type WorkTaskList = {
  id: string;
  name: string;
};

type WorkTask = {
  id: string;
  title: string;
  description?: string | null;
  status?: string | null;
  dueDate?: string | null;
  progress?: number | null;
};

type WorkProjectDetail = {
  id: string;
  name: string;
  projectType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetAmount?: number | null;
  budgetCurrency?: string | null;
  taskLists?: (WorkTaskList & { tasks?: WorkTask[] })[];
};

export default function Work() {
  const [projects, setProjects] = useState<WorkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<WorkProjectDetail | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: '',
    projectType: '',
    startDate: '',
    endDate: '',
    budgetAmount: '',
    budgetCurrency: 'USD',
  });
  const [taskListForm, setTaskListForm] = useState({ name: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '' });
  const [savingTaskList, setSavingTaskList] = useState(false);
  const [savingTaskForList, setSavingTaskForList] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) authHeaders.Authorization = `Bearer ${token}`;

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    if (!token) {
      setError('Sign in to load work projects.');
      setProjects([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/job/work/projects`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDetail = async (id: string) => {
    if (!token) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/work/projects/${id}`, {
        headers: authHeaders,
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const data = await res.json();
      setSelectedProject(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load project');
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('You must be logged in to create projects');
      return;
    }
    setCreatingProject(true);
    setError(null);
    try {
      const payload: any = {
        name: projectForm.name,
        projectType: projectForm.projectType || undefined,
        startDate: projectForm.startDate || undefined,
        endDate: projectForm.endDate || undefined,
        budgetCurrency: projectForm.budgetCurrency || undefined,
      };
      if (projectForm.budgetAmount) {
        payload.budgetAmount = Number(projectForm.budgetAmount);
      }
      const res = await fetch(`${API_BASE}/job/work/projects`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const created = await res.json();
      setProjects((prev) => [created, ...prev]);
      setProjectForm({
        name: '',
        projectType: '',
        startDate: '',
        endDate: '',
        budgetAmount: '',
        budgetCurrency: 'USD',
      });
    } catch (e: any) {
      setError(e?.message || 'Failed to create project');
    } finally {
      setCreatingProject(false);
    }
  };

  const openProject = (project: WorkProject) => {
    fetchProjectDetail(project.id);
  };

  const handleCreateTaskList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProject || !taskListForm.name.trim()) return;
    setSavingTaskList(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/work/task-lists`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ projectId: selectedProject.id, name: taskListForm.name.trim() }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const list = await res.json();
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              taskLists: [...(prev.taskLists || []), { ...list, tasks: [] }],
            }
          : prev
      );
      setTaskListForm({ name: '' });
    } catch (e: any) {
      setError(e?.message || 'Failed to create list');
    } finally {
      setSavingTaskList(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    if (!token || !selectedProject || !taskForm.title.trim()) return;
    setSavingTaskForList(listId);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/work/tasks`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          taskListId: listId,
          title: taskForm.title.trim(),
          description: taskForm.description || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await readApiError(res));
      }
      const task = await res.json();
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              taskLists: (prev.taskLists || []).map((l) =>
                l.id === listId
                  ? { ...l, tasks: [...(l.tasks || []), task] }
                  : l
              ),
            }
          : prev
      );
      setTaskForm({ title: '', description: '' });
    } catch (e: any) {
      setError(e?.message || 'Failed to create task');
    } finally {
      setSavingTaskForList(null);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <JobPageContent variant="track" error={undefined}>
        <JobToolBibleShell toolTitle="MOxE WORK" toolIconMaterial="work">
          <div className="flex items-center justify-center py-12 text-sm text-on-surface-variant">Loading Work…</div>
        </JobToolBibleShell>
      </JobPageContent>
    );
  }

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE WORK" toolIconMaterial="work">
    <div className="space-y-4">

      {!selectedProject && (
        <>
          <form onSubmit={handleCreateProject} className={`mb-6 ${JOB_MOBILE.formPanel}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-on-surface">New project</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={JOB_MOBILE.formLabel}>Name</label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className={JOB_MOBILE.formInput}
                  placeholder="Q3 Launch Plan"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Type</label>
                <input
                  type="text"
                  value={projectForm.projectType}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, projectType: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="Marketing, Product, Operations…"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Start date</label>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>End date</label>
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Budget amount</label>
                <input
                  type="number"
                  min={0}
                  value={projectForm.budgetAmount}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, budgetAmount: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="50000"
                />
              </div>
              <div>
                <label className={JOB_MOBILE.formLabel}>Currency</label>
                <input
                  type="text"
                  value={projectForm.budgetCurrency}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, budgetCurrency: e.target.value }))
                  }
                  className={JOB_MOBILE.formInput}
                  placeholder="USD"
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={creatingProject}
                className="min-h-[44px] rounded-xl bg-[#0052CC] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0747A6] disabled:opacity-60"
              >
                {creatingProject ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>

          {projects.length === 0 ? (
            <p className={JOB_MOBILE.formMuted}>
              No projects yet. Use the form above to create your first Work project.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProject(p)}
                  className={`w-full rounded-xl border border-outline-variant/20 p-4 text-left transition-colors hover:border-primary/45 ${JOB_MOBILE.trackCard}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-on-surface">{p.name}</div>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {p.projectType || 'General'}{' '}
                        {p.startDate &&
                          p.endDate &&
                          `· ${new Date(p.startDate).toLocaleDateString()} – ${new Date(
                            p.endDate
                          ).toLocaleDateString()}`}
                      </div>
                    </div>
                    {p.budgetAmount != null && (
                      <div className="text-xs text-on-surface-variant">
                        Budget:{' '}
                        <span className="font-medium text-on-surface">
                          {p.budgetCurrency || 'USD'} {p.budgetAmount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {selectedProject && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setSelectedProject(null)}
                className="text-sm text-[#0052CC] dark:text-[#2684FF] font-medium mb-3"
          >
            ← Back to projects
          </button>
          <h3 className="text-lg font-semibold text-on-surface">{selectedProject.name}</h3>
          <p className="mb-4 text-xs text-on-surface-variant">
            {selectedProject.projectType || 'General'}{' '}
            {selectedProject.startDate &&
              selectedProject.endDate &&
              `· ${new Date(selectedProject.startDate).toLocaleDateString()} – ${new Date(
                selectedProject.endDate
              ).toLocaleDateString()}`}
          </p>

          <form
            onSubmit={handleCreateTaskList}
            className="mb-4 flex flex-col gap-2 items-stretch"
          >
            <input
              type="text"
              value={taskListForm.name}
              onChange={(e) => setTaskListForm({ name: e.target.value })}
              placeholder="Add task list (e.g. Discovery, Delivery)"
              className={JOB_MOBILE.formInput}
            />
            <button
              type="submit"
              disabled={savingTaskList}
              className="px-4 py-2 rounded-lg bg-[#0052CC] hover:bg-[#0747A6] dark:bg-[#2684FF] dark:hover:bg-[#0052CC] text-sm font-medium text-white disabled:opacity-60"
            >
              {savingTaskList ? 'Adding…' : 'Add list'}
            </button>
          </form>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {(selectedProject.taskLists || []).length === 0 ? (
              <p className="text-sm text-on-surface-variant">No task lists yet. Create one above.</p>
            ) : (
              (selectedProject.taskLists || []).map((list) => (
                <div
                  key={list.id}
                  className="w-72 shrink-0 rounded-xl border border-outline-variant/20 bg-surface-container-low p-3"
                >
                  <div className="mb-2 text-sm font-medium text-on-surface">{list.name}</div>
                  <div className="mb-3 space-y-2">
                    {(list.tasks || []).length === 0 ? (
                      <p className="text-[11px] text-on-surface-variant">No tasks yet.</p>
                    ) : (
                      (list.tasks || []).map((task) => (
                        <div
                          key={task.id}
                          className="rounded-lg border border-outline-variant/15 bg-surface-container p-2"
                        >
                          <div className="text-xs font-medium text-on-surface">{task.title}</div>
                          {task.description && (
                            <p className="mt-0.5 line-clamp-2 text-[11px] text-on-surface-variant">
                              {task.description}
                            </p>
                          )}
                          {task.dueDate && (
                            <p className="mt-1 text-[11px] text-on-surface-variant">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={(e) => handleCreateTask(e, list.id)} className="space-y-1">
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) =>
                        setTaskForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="New task title"
                      className={`${JOB_MOBILE.formInput} py-1.5 text-xs min-h-0`}
                    />
                    <input
                      type="text"
                      value={taskForm.description}
                      onChange={(e) =>
                        setTaskForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Optional description"
                      className={`${JOB_MOBILE.formInput} py-1.5 text-xs min-h-0`}
                    />
                    <button
                      type="submit"
                      disabled={savingTaskForList === list.id}
                      className="w-full mt-1 rounded-md bg-[#0052CC] hover:bg-[#0747A6] dark:bg-[#2684FF] dark:hover:bg-[#0052CC] text-[11px] font-medium text-white py-1 disabled:opacity-60"
                    >
                      {savingTaskForList === list.id ? 'Adding…' : 'Add task'}
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <JobBibleReferenceSection toolKey="work" />
    </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}

