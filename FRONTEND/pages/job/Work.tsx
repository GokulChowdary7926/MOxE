import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

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
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/work/projects`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load projects');
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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to load project');
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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create project');
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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({ projectId: selectedProject.id, name: taskListForm.name.trim() }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create list');
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
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          taskListId: listId,
          title: taskForm.title.trim(),
          description: taskForm.description || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create task');
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
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Work…</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">MOxE Work</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
        Plan business projects with timelines, budgets, and task lists.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!selectedProject && (
        <>
          <form
            onSubmit={handleCreateProject}
            className="mb-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                New project
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Q3 Launch Plan"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Type
                </label>
                <input
                  type="text"
                  value={projectForm.projectType}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, projectType: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="Marketing, Product, Operations…"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Start date
                </label>
                <input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  End date
                </label>
                <input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Budget amount
                </label>
                <input
                  type="number"
                  min={0}
                  value={projectForm.budgetAmount}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, budgetAmount: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={projectForm.budgetCurrency}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, budgetCurrency: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  placeholder="USD"
                />
              </div>
            </div>
            <div className="flex items-center justify-end">
              <button
                type="submit"
                disabled={creatingProject}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {creatingProject ? 'Creating…' : 'Create project'}
              </button>
            </div>
          </form>

          {projects.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No projects yet. Use the form above to create your first Work project.
            </p>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openProject(p)}
                  className="w-full text-left p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-50">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {p.projectType || 'General'}{' '}
                        {p.startDate &&
                          p.endDate &&
                          `· ${new Date(p.startDate).toLocaleDateString()} – ${new Date(
                            p.endDate
                          ).toLocaleDateString()}`}
                      </div>
                    </div>
                    {p.budgetAmount != null && (
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Budget:{' '}
                        <span className="font-medium">
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
            className="text-sm text-indigo-600 dark:text-indigo-400 mb-3"
          >
            ← Back to projects
          </button>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-50">
            {selectedProject.name}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            {selectedProject.projectType || 'General'}{' '}
            {selectedProject.startDate &&
              selectedProject.endDate &&
              `· ${new Date(selectedProject.startDate).toLocaleDateString()} – ${new Date(
                selectedProject.endDate
              ).toLocaleDateString()}`}
          </p>

          <form
            onSubmit={handleCreateTaskList}
            className="mb-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
          >
            <input
              type="text"
              value={taskListForm.name}
              onChange={(e) => setTaskListForm({ name: e.target.value })}
              placeholder="Add task list (e.g. Discovery, Delivery)"
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
            />
            <button
              type="submit"
              disabled={savingTaskList}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingTaskList ? 'Adding…' : 'Add list'}
            </button>
          </form>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {(selectedProject.taskLists || []).length === 0 ? (
              <p className="text-sm text-slate-500">No task lists yet. Create one above.</p>
            ) : (
              (selectedProject.taskLists || []).map((list) => (
                <div
                  key={list.id}
                  className="flex-shrink-0 w-72 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                >
                  <div className="font-medium text-slate-800 dark:text-slate-100 text-sm mb-2">
                    {list.name}
                  </div>
                  <div className="space-y-2 mb-3">
                    {(list.tasks || []).length === 0 ? (
                      <p className="text-[11px] text-slate-500">No tasks yet.</p>
                    ) : (
                      (list.tasks || []).map((task) => (
                        <div
                          key={task.id}
                          className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <div className="text-xs font-medium text-slate-800 dark:text-slate-100">
                            {task.title}
                          </div>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.dueDate && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1">
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
                      className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50"
                    />
                    <input
                      type="text"
                      value={taskForm.description}
                      onChange={(e) =>
                        setTaskForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Optional description"
                      className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={savingTaskForList === list.id}
                      className="w-full mt-1 rounded-md bg-indigo-600 text-[11px] font-medium text-white py-1 hover:bg-indigo-700 disabled:opacity-60"
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
    </div>
  );
}

