import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../services/api';
import { JobDesignBiblePanel, JobToolBibleShell } from '../../components/job/bible';

const API_BASE = getApiBase();

export default function Flow() {
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  const fetchBoards = () => {
    if (!token) {
      setError('Sign in to view Flow boards.');
      return Promise.resolve();
    }
    setError(null);
    return fetch(`${API_BASE}/job/flow/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Failed to load boards');
        }
        return res.json();
      })
      .then((data) => setBoards(Array.isArray(data) ? data : []))
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to load boards'));
  };

  useEffect(() => {
    setLoading(true);
    fetchBoards().finally(() => setLoading(false));
  }, [token]);

  const openBoard = (boardId: string) => {
    if (!token) return;
    setError(null);
    fetch(`${API_BASE}/job/flow/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || 'Board not found');
        }
        return res.json();
      })
      .then(setSelectedBoard)
      .catch((e: { message?: string }) => setError(e?.message || 'Failed to open board'));
  };

  const createBoard = () => {
    if (!token) return;
    const name = window.prompt('Board name');
    if (!name) return;
    fetch(`${API_BASE}/job/flow/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((board) => {
        setBoards((b) => [...b, board]);
        setSelectedBoard(board);
      })
      .catch((e) => setError(e.message));
  };

  if (loading && !selectedBoard) {
    return (
      <JobToolBibleShell toolTitle="MOxE FLOW" toolIconMaterial="schema">
        <div className="flex items-center justify-center py-16 text-sm text-on-surface-variant">Loading Flow…</div>
      </JobToolBibleShell>
    );
  }

  return (
    <JobToolBibleShell toolTitle="MOxE FLOW" toolIconMaterial="schema">
      <div className="space-y-6 pb-4 font-body text-on-background">
        {error ? (
          <div className="rounded-xl border border-error/30 bg-error-container/20 px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                Operations board
              </span>
              <h2 className="text-xl font-bold text-on-surface">Delivery pipeline</h2>
              <p className="mt-1 text-xs text-on-surface-variant">Boards and columns — bible FLOW Command Center layout.</p>
            </div>
            <button
              type="button"
              className="flex shrink-0 items-center gap-1 rounded-full border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {['Backlog', 'In progress', 'Review', 'Done'].map((label, i) => (
              <button
                key={label}
                type="button"
                className={`flex-none rounded-full px-5 py-2 text-xs font-bold ${
                  i === 0 ? 'bg-primary text-on-primary shadow-lg shadow-primary/10' : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {selectedBoard ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setSelectedBoard(null)}
              className="text-sm font-semibold text-primary"
            >
              ← Back to boards
            </button>
            <h3 className="text-lg font-bold text-on-surface">{selectedBoard.name}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {selectedBoard.columns?.map((col: any) => (
                <div
                  key={col.id}
                  className="flex w-[232px] shrink-0 flex-col rounded-xl border border-outline-variant/15 bg-surface-container-low p-3"
                >
                  <div className="mb-2 text-sm font-bold text-on-surface">{col.name}</div>
                  <div className="flex flex-col gap-2">
                    {col.cards?.map((card: any) => (
                      <div
                        key={card.id}
                        className="rounded-lg border-l-4 border-l-on-primary-container bg-surface-container-lowest p-3 shadow-sm"
                      >
                        <div className="text-sm font-bold text-on-surface">{card.title}</div>
                        {card.companyName ? (
                          <div className="mt-1 text-xs text-on-surface-variant">{card.companyName}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              onClick={createBoard}
              className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-on-primary-container px-6 font-bold text-on-primary shadow-lg"
            >
              <span className="material-symbols-outlined">add</span>
              New board
            </button>
            {boards.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No boards yet. Create one to get started.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {boards.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openBoard(b.id)}
                    className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 text-left shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div className="font-semibold text-on-surface">{b.name}</div>
                    <div className="mt-1 text-xs text-on-surface-variant">{b.columns?.length || 0} columns</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <JobDesignBiblePanel toolKey="flow" showHero={false} />
      </div>
    </JobToolBibleShell>
  );
}
