import React, { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type Thread = {
  otherId: string;
  other?: {
    id: string;
    username: string;
    displayName: string;
    profilePhoto?: string | null;
  };
  lastMessage: string;
  lastTime: string | Date;
  unread: number;
  mutedUntil?: string | null;
  labels?: string[];
};

type ThreadsResponse = {
  threads: Thread[];
  requests: Thread[];
  pinnedIds: string[];
};

type MessageItem = any;

function useAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };
}

export default function Chat() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [requests, setRequests] = useState<Thread[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');

  const headers = useAuthHeaders();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadThreads = async () => {
    setLoadingThreads(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/message/threads`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load conversations');
      }
      const data = (await res.json()) as ThreadsResponse;
      setThreads(data.threads || []);
      setRequests(data.requests || []);
      setPinnedIds(data.pinnedIds || []);
      if (!selectedPeerId && data.threads && data.threads.length > 0) {
        setSelectedPeerId(data.threads[0].otherId);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load conversations');
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (peerId: string) => {
    if (!peerId) return;
    setLoadingMessages(true);
    setError(null);
    try {
      const params = new URLSearchParams({ userId: peerId, limit: '50' });
      const res = await fetch(`${API_BASE}/message?${params.toString()}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load messages');
      }
      const data = (await res.json()) as { items: MessageItem[]; nextCursor?: string | null };
      setMessages(data.items || []);
      setNextCursor(data.nextCursor || null);
      // scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedPeerId) {
      loadMessages(selectedPeerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeerId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeerId || !content.trim()) return;
    setSending(true);
    setError(null);
    const text = content.trim();
    try {
      const res = await fetch(`${API_BASE}/message`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          recipientId: selectedPeerId,
          content: text,
          messageType: 'TEXT',
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Failed to send message');
      }
      const created = await res.json();
      setContent('');
      setMessages((prev) => [...prev, created]);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 0);
      // refresh threads to update last message/unread counts
      loadThreads();
    } catch (e: any) {
      setError(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const activeThread =
    selectedPeerId && threads.find((t) => t.otherId === selectedPeerId)
      ? threads.find((t) => t.otherId === selectedPeerId)
      : requests.find((t) => t.otherId === selectedPeerId) || null;

  const renderMessage = (m: MessageItem) => {
    const isMine = !!m.isMine;
    const created = m.createdAt ? new Date(m.createdAt) : null;
    const contentText = m.content || '';
    return (
      <div
        key={m.id}
        className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1`}
      >
        <div
          className={`max-w-[70%] rounded-2xl px-3 py-1.5 text-xs ${
            isMine
              ? 'bg-indigo-600 text-white rounded-br-none'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">{contentText}</div>
          {created && (
            <div
              className={`mt-0.5 text-[10px] ${
                isMine ? 'text-indigo-100/80' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {created.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-72 xl:w-80 space-y-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-white mb-1">
            MOxE CHAT
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Direct messages for your Job account. Coordinate with teammates, recruiters, and
            collaborators without leaving MOxE.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[420px] overflow-auto">
          <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-between">
            <span>Conversations</span>
            {loadingThreads && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Loading…</span>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {threads.map((t) => {
              const isPinned = pinnedIds.includes(t.otherId);
              const isActive = selectedPeerId === t.otherId;
              const displayName =
                t.other?.displayName || t.other?.username || 'Conversation';
              return (
                <button
                  key={`thread-${t.otherId}`}
                  type="button"
                  onClick={() => setSelectedPeerId(t.otherId)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-medium truncate">{displayName}</span>
                    {t.unread > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[18px] px-1.5 rounded-full bg-red-600 text-white text-[10px]">
                        {t.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2">
                    <span className="truncate">{t.lastMessage}</span>
                    <span>
                      {new Date(t.lastTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {isPinned && (
                    <div className="mt-0.5 text-[10px] text-amber-500 dark:text-amber-300">
                      Pinned
                    </div>
                  )}
                </button>
              );
            })}
            {threads.length === 0 && !loadingThreads && (
              <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                No conversations yet. Start messaging from profiles to see them here.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        {!selectedPeerId && (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 px-4">
            Select a conversation on the left to start chatting.
          </div>
        )}
        {selectedPeerId && (
          <>
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {activeThread?.other?.displayName ||
                    activeThread?.other?.username ||
                    'Conversation'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Direct messages
                </div>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 overflow-auto px-3 py-3 bg-slate-50 dark:bg-slate-900/60"
            >
              {loadingMessages && messages.length === 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Loading conversation…
                </div>
              )}
              {messages.length > 0 && (
                <div className="space-y-1">
                  {messages.map((m) => renderMessage(m))}
                </div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  No messages yet. Say hello!
                </div>
              )}
            </div>
            <form onSubmit={handleSend} className="border-t border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="flex items-end gap-2">
                <textarea
                  className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs resize-none"
                  rows={2}
                  placeholder="Type a message…"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

