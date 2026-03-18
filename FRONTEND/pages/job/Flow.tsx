import React, { useState, useEffect } from 'react';
import { getApiBase } from '../../services/api';
import { JobPageContent } from '../../components/job/JobPageContent';

const API_BASE = getApiBase();

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
        <div className="text-[#5E6C84] dark:text-[#8C9BAB] text-sm">Loading Flow…</div>
      </div>
    );
  }

  return (
    <JobPageContent
      title="MOxE Flow"
      description="Visual job-search boards. Drag cards across columns (Wishlist → Applied → Interview → Offer)."
      error={error}
    >
      {selectedBoard ? (
        <div>
          <button
            onClick={() => setSelectedBoard(null)}
            className="text-sm text-[#0052CC] dark:text-[#2684FF] mb-4"
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
            className="px-4 py-2 bg-[#0052CC] dark:bg-[#2684FF] text-white rounded-lg font-medium hover:opacity-90"
          >
            + New board
          </button>
          {boards.length === 0 ? (
            <p className="text-[#5E6C84] dark:text-[#8C9BAB] text-sm">No boards yet. Create one to get started.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => openBoard(b.id)}
                  className="p-4 rounded-lg border border-[#DFE1E6] dark:border-[#2C333A] bg-white dark:bg-[#1D2125] text-left hover:border-[#0052CC] dark:hover:border-[#2684FF] transition-colors shadow-sm"
                >
                  <div className="font-medium text-[#172B4D] dark:text-[#E6EDF3]">{b.name}</div>
                  <div className="text-sm text-[#5E6C84] dark:text-[#8C9BAB] mt-1">
                    {b.columns?.length || 0} columns
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </JobPageContent>
  );
}
