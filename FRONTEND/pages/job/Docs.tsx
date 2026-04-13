import React, { useEffect, useState } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';
import { JobBibleReferenceSection, JobToolBibleShell } from '../../components/job/bible';

const API_BASE = getApiBase();

type JobDoc = {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
};

type JobDocDetail = JobDoc & {
  content: string;
  versions?: Array<{
    id: string;
    versionNumber: number;
    title: string;
    createdAt: string;
    createdBy?: { id: string; username: string; displayName: string };
  }>;
  comments?: Array<{
    id: string;
    content: string;
    resolvedAt: string | null;
    createdAt: string;
    account?: { id: string; username: string; displayName: string };
    replies?: Array<{
      id: string;
      content: string;
      createdAt: string;
      account?: { id: string; username: string; displayName: string };
    }>;
  }>;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Docs() {
  const [docs, setDocs] = useState<JobDoc[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [docDetail, setDocDetail] = useState<JobDocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [commentText, setCommentText] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const headers = useAuthHeaders();

  const loadDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/docs`, { headers });
      if (!res.ok) throw new Error('Failed to load documents');
      const data = (await res.json()) as JobDoc[];
      setDocs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadDocDetail = async (id: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/docs/${id}`, { headers });
      if (!res.ok) throw new Error('Failed to load document');
      const data = (await res.json()) as JobDocDetail;
      setDocDetail(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load document');
      setDocDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      loadDocDetail(selectedDocId);
    } else {
      setDocDetail(null);
    }
  }, [selectedDocId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/docs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title: newTitle.trim(), content: '' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to create document');
      }
      const created = (await res.json()) as JobDoc;
      setNewTitle('');
      await loadDocs();
      setSelectedDocId(created.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!docDetail) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/docs/${docDetail.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ title: docDetail.title, content: docDetail.content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to save');
      }
      const updated = (await res.json()) as JobDocDetail;
      setDocDetail(updated);
      await loadDocs();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: JobDoc) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/docs/${doc.id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete');
      await loadDocs();
      if (selectedDocId === doc.id) {
        setSelectedDocId(null);
        setDocDetail(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docDetail || !commentText.trim()) return;
    setAddingComment(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/docs/${docDetail.id}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      setCommentText('');
      await loadDocDetail(docDetail.id);
    } catch (e: any) {
      setError(e?.message || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <JobPageContent variant="track" error={error}>
      <JobToolBibleShell toolTitle="MOxE DOCS" toolIconMaterial="description">
    <div className="flex flex-col gap-6">
      <div className="w-full min-w-0 space-y-4">
        <form
          onSubmit={handleCreate}
          className="p-3 rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <input
            className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-800 dark:text-slate-100"
            placeholder="New document title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button
            type="submit"
            disabled={creating || !newTitle.trim()}
            className="w-full mt-2 rounded-md bg-[#0052CC] text-white text-xs font-medium py-1.5 hover:bg-[#2684FF] disabled:opacity-50"
          >
            {creating ? 'Creating…' : 'Create document'}
          </button>
        </form>

        <div className="rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[360px] overflow-auto">
          <div className="px-3 py-2 border-b border-[#DFE1E6] dark:border-slate-700 text-xs font-semibold text-[#172B4D] dark:text-slate-200">
            Documents
          </div>
          {loading && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">Loading…</div>
          )}
          {!loading && docs.length === 0 && (
            <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
              No documents yet. Create one above.
            </div>
          )}
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setSelectedDocId(d.id)}
                  className={`flex-1 text-left truncate ${
                    selectedDocId === d.id
                      ? 'text-[#0052CC] dark:text-[#2684FF] font-medium'
                      : 'text-[#172B4D] dark:text-slate-200'
                  }`}
                >
                  {d.title}
                </button>
                <button
                  type="button"
                  disabled={deletingId === d.id}
                  onClick={() => handleDelete(d)}
                  className="text-slate-400 hover:text-red-500 text-[11px]"
                >
                  {deletingId === d.id ? '…' : '×'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col overflow-hidden">
        {!selectedDocId && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 p-4">
            Select a document or create a new one.
          </div>
        )}
        {selectedDocId && (
          <>
            {loadingDetail && (
              <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
            )}
            {docDetail && !loadingDetail && (
              <>
                <div className="px-4 py-2 border-b border-[#DFE1E6] dark:border-slate-700 flex items-center justify-between gap-2 flex-wrap">
                  <input
                    className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm font-medium text-slate-800 dark:text-slate-100"
                    value={docDetail.title}
                    onChange={(e) =>
                      setDocDetail((p) => (p ? { ...p, title: e.target.value } : p))
                    }
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowVersions((v) => !v)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      Version history
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-md bg-[#0052CC] text-white text-xs font-medium px-3 py-1.5 hover:bg-[#2684FF] disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <textarea
                    className="w-full min-h-[240px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 resize-y"
                    value={docDetail.content}
                    onChange={(e) =>
                      setDocDetail((p) => (p ? { ...p, content: e.target.value } : p))
                    }
                    placeholder="Write your document content…"
                  />
                  {showVersions && docDetail.versions && docDetail.versions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#DFE1E6] dark:border-slate-700">
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                        Version history
                      </div>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                        {docDetail.versions.map((v) => (
                          <li key={v.id}>
                            v{v.versionNumber} · {new Date(v.createdAt).toLocaleString()}
                            {v.createdBy && ` · ${v.createdBy.displayName || v.createdBy.username}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-4 pt-4 border-t border-[#DFE1E6] dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                      Comments
                    </div>
                    <form onSubmit={handleAddComment} className="flex gap-2 mb-3">
                      <input
                        className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                        placeholder="Add a comment…"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={addingComment || !commentText.trim()}
                        className="rounded-md bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs px-3 py-1.5 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50"
                      >
                        {addingComment ? '…' : 'Add'}
                      </button>
                    </form>
                    <ul className="space-y-2 text-xs">
                      {docDetail.comments?.map((c) => (
                        <li
                          key={c.id}
                          className={`p-2 rounded-lg ${
                            c.resolvedAt
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="font-medium">
                            {c.account?.displayName || c.account?.username || 'User'}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400 ml-1 text-[11px]">
                            {new Date(c.createdAt).toLocaleString()}
                            {c.resolvedAt && ' · Resolved'}
                          </span>
                          <p className="mt-0.5 whitespace-pre-wrap">{c.content}</p>
                        </li>
                      ))}
                      {(!docDetail.comments || docDetail.comments.length === 0) && (
                        <li className="text-slate-500 dark:text-slate-400">No comments yet.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      <JobBibleReferenceSection toolKey="docs" />
      </div>
    </div>
      </JobToolBibleShell>
    </JobPageContent>
  );
}
