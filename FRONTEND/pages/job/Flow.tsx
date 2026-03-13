import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export default function Flow() {
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  const fetchBoards = () => {
    if (!token) return Promise.resolve();
    return fetch(`${API_BASE}/job/flow/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then(setBoards)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    setLoading(true);
    fetchBoards().finally(() => setLoading(false));
  }, []);

  const openBoard = (boardId: string) => {
    if (!token) return;
    fetch(`${API_BASE}/job/flow/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Not found'))))
      .then(setSelectedBoard)
      .catch((e) => setError(e.message));
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
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading Flow...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-4">MOxE Flow</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Visual job-search boards. Drag cards across columns (Wishlist → Applied → Interview → Offer).
      </p>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}
      {selectedBoard ? (
        <div>
          <button
            onClick={() => setSelectedBoard(null)}
            className="text-sm text-indigo-600 dark:text-indigo-400 mb-4"
          >
            ← Back to boards
          </button>
          <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-4">
            {selectedBoard.name}
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {selectedBoard.columns?.map((col: any) => (
              <div
                key={col.id}
                className="flex-shrink-0 w-64 bg-slate-100 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
              >
                <div className="font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {col.name}
                </div>
                <div className="space-y-2">
                  {col.cards?.map((card: any) => (
                    <div
                      key={card.id}
                      className="p-3 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600"
                    >
                      <div className="font-medium text-slate-800 dark:text-white text-sm">
                        {card.title}
                      </div>
                      {card.companyName && (
                        <div className="text-xs text-slate-500 mt-1">{card.companyName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={createBoard}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            + New board
          </button>
          {boards.length === 0 ? (
            <p className="text-slate-500">No boards yet. Create one to get started.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => openBoard(b.id)}
                  className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-left hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors"
                >
                  <div className="font-medium text-slate-800 dark:text-white">{b.name}</div>
                  <div className="text-sm text-slate-500 mt-1">
                    {b.columns?.length || 0} columns
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
