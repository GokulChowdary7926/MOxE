import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type KnowledgeSpace = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type?: string;
  _count?: { pages?: number };
};

type KnowledgePage = {
  id: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | string;
  updatedAt: string;
  createdAt: string;
  slug?: string;
};

type KnowledgePageDetail = KnowledgePage & {
  content: string;
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

export default function Docs() {
  const [spaces, setSpaces] = useState<KnowledgeSpace[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [pages, setPages] = useState<KnowledgePage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [pageDetail, setPageDetail] = useState<KnowledgePageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingPages, setLoadingPages] = useState(false);
  const [savingPage, setSavingPage] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
  });

  const [newPage, setNewPage] = useState({
    title: '',
    content: '',
  });

  const headers = useAuthHeaders();

  const loadSpaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/spaces`, { headers });
      if (!res.ok) throw new Error('Failed to load doc spaces');
      const data = (await res.json()) as KnowledgeSpace[];
      setSpaces(Array.isArray(data) ? data : []);
      if (!selectedSpaceId && data && data.length > 0) {
        setSelectedSpaceId(data[0].id);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load doc spaces');
    } finally {
      setLoading(false);
    }
  };

  const loadPages = async (spaceId: string) => {
    if (!spaceId) {
      setPages([]);
      setSelectedPageId('');
      setPageDetail(null);
      return;
    }
    setLoadingPages(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/spaces/${spaceId}/pages`, { headers });
      if (!res.ok) throw new Error('Failed to load docs');
      const data = (await res.json()) as KnowledgePage[];
      setPages(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        setSelectedPageId(data[0].id);
      } else {
        setSelectedPageId('');
        setPageDetail(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load docs');
    } finally {
      setLoadingPages(false);
    }
  };

  const loadPageDetail = async (pageId: string) => {
    if (!pageId) {
      setPageDetail(null);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/pages/${pageId}`, { headers });
      if (!res.ok) throw new Error('Failed to load doc');
      const data = (await res.json()) as KnowledgePageDetail;
      setPageDetail(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load doc');
      setPageDetail(null);
    }
  };

  useEffect(() => {
    loadSpaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedSpaceId) {
      loadPages(selectedSpaceId);
    } else {
      setPages([]);
      setSelectedPageId('');
      setPageDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpaceId]);

  useEffect(() => {
    if (selectedPageId) {
      loadPageDetail(selectedPageId);
    } else {
      setPageDetail(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPageId]);

  const currentSpace = spaces.find((s) => s.id === selectedSpaceId) || null;

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpace.name.trim()) return;
    setCreatingSpace(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/spaces`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newSpace.name.trim(),
          description: newSpace.description.trim() || undefined,
          type: 'TEAM',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create space');
      }
      setNewSpace({ name: '', description: '' });
      await loadSpaces();
    } catch (e: any) {
      setError(e?.message || 'Failed to create space');
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpaceId || !newPage.title.trim()) return;
    setCreatingPage(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/spaces/${selectedSpaceId}/pages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newPage.title.trim(),
          content: newPage.content,
          status: 'DRAFT',
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to create doc');
      }
      setNewPage({ title: '', content: '' });
      await loadPages(selectedSpaceId);
    } catch (e: any) {
      setError(e?.message || 'Failed to create doc');
    } finally {
      setCreatingPage(false);
    }
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageDetail) return;
    setSavingPage(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/pages/${pageDetail.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: pageDetail.title,
          content: pageDetail.content,
          status: pageDetail.status,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to save doc');
      }
      await loadPages(selectedSpaceId);
      await loadPageDetail(pageDetail.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to save doc');
    } finally {
      setSavingPage(false);
    }
  };

  const handleDeletePage = async (page: KnowledgePage) => {
    if (!window.confirm(`Delete doc "${page.title}"? This cannot be undone.`)) return;
    setDeletingPageId(page.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/know/pages/${page.id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to delete doc');
      }
      await loadPages(selectedSpaceId);
      if (selectedPageId === page.id) {
        setSelectedPageId('');
        setPageDetail(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to delete doc');
    } finally {
      setDeletingPageId(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-72 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE DOCS
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Team spaces and documents for your Job workspace, powered by the MOxE knowledge base.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreateSpace}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2 text-xs"
        >
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            New space
          </div>
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Space name"
            value={newSpace.name}
            onChange={(e) => setNewSpace((s) => ({ ...s, name: e.target.value }))}
          />
          <textarea
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
            placeholder="Description (optional)"
            rows={2}
            value={newSpace.description}
            onChange={(e) => setNewSpace((s) => ({ ...s, description: e.target.value }))}
          />
          <button
            type="submit"
            disabled={creatingSpace}
            className="w-full mt-1 inline-flex justify-center items-center rounded-md bg-indigo-600 text-white text-xs font-medium py-1.5 hover:bg-indigo-700 disabled:opacity-50"
          >
            {creatingSpace ? 'Creating…' : 'Create space'}
          </button>
        </form>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-72 overflow-auto">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Spaces
          </div>
          {loading && spaces.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              Loading spaces…
            </div>
          )}
          {!loading && spaces.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              No spaces yet. Create a space above to start organizing docs.
            </div>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {spaces.map((s) => {
              const isActive = s.id === selectedSpaceId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSpaceId(s.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">
                      {s.description || s.slug}
                    </span>
                    <span>{s._count?.pages ?? 0} docs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        {currentSpace && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {currentSpace.name}
                </div>
                {currentSpace.description && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentSpace.description}
                  </div>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentSpace._count?.pages ?? 0} docs
              </div>
            </div>
          </div>
        )}

        {selectedSpaceId && (
          <form
            onSubmit={handleCreatePage}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                New doc
              </div>
              <button
                type="submit"
                disabled={creatingPage}
                className="inline-flex items-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 text-[11px]"
              >
                {creatingPage ? 'Creating…' : 'Create doc'}
              </button>
            </div>
            <input
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              placeholder="Doc title"
              value={newPage.title}
              onChange={(e) => setNewPage((p) => ({ ...p, title: e.target.value }))}
            />
            <textarea
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
              placeholder="Quick notes or outline (optional)"
              rows={2}
              value={newPage.content}
              onChange={(e) => setNewPage((p) => ({ ...p, content: e.target.value }))}
            />
          </form>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-1">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[420px] overflow-auto">
              <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Docs
              </div>
              {loadingPages && (
                <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                  Loading docs…
                </div>
              )}
              {!loadingPages && pages.length === 0 && selectedSpaceId && (
                <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                  No docs in this space yet.
                </div>
              )}
              <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                {pages.map((p) => {
                  const isActive = p.id === selectedPageId;
                  return (
                    <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPageId(p.id)}
                        className={`flex-1 text-left ${
                          isActive
                            ? 'text-indigo-700 dark:text-indigo-200'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="font-medium truncate">{p.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                          <span className="uppercase">
                            {p.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                          </span>
                          <span>
                            {new Date(p.updatedAt).toLocaleDateString([], {
                              month: 'short',
                              day: '2-digit',
                            })}
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        disabled={deletingPageId === p.id}
                        onClick={() => handleDeletePage(p)}
                        className="ml-1 text-[11px] text-red-500 hover:text-red-600"
                      >
                        {deletingPageId === p.id ? '…' : '×'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs min-h-[260px]">
              {!pageDetail && (
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Select a doc on the left to view and edit its content.
                </div>
              )}
              {pageDetail && (
                <form onSubmit={handleSavePage} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100"
                      value={pageDetail.title}
                      onChange={(e) =>
                        setPageDetail((prev) =>
                          prev ? { ...prev, title: e.target.value } : prev,
                        )
                      }
                    />
                    <select
                      className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] text-slate-900 dark:text-slate-100"
                      value={pageDetail.status}
                      onChange={(e) =>
                        setPageDetail((prev) =>
                          prev ? { ...prev, status: e.target.value } : prev,
                        )
                      }
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                    </select>
                  </div>
                  <textarea
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-xs text-slate-900 dark:text-slate-100 min-h-[180px]"
                    value={pageDetail.content}
                    onChange={(e) =>
                      setPageDetail((prev) =>
                        prev ? { ...prev, content: e.target.value } : prev,
                      )
                    }
                  />
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Last updated{' '}
                      {new Date(pageDetail.updatedAt).toLocaleString([], {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <button
                      type="submit"
                      disabled={savingPage}
                      className="inline-flex items-center rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-3 py-1.5 text-[11px]"
                    >
                      {savingPage ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

