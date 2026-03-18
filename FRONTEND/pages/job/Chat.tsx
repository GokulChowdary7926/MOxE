import React, { useEffect, useRef, useState } from 'react';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

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

type MessageItem = {
  id: string;
  content: string;
  createdAt?: string;
  isMine?: boolean;
};

type Ticket = {
  id: string;
  peerId: string;
  subject: string;
  description?: string | null;
  status: string;
  priority: string;
  assignedToAccountId?: string | null;
  assignedTo?: { id: string; username: string; displayName: string } | null;
  peer?: { id: string; username: string; displayName: string; profilePhoto?: string | null };
  messageId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

function useAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function Chat() {
  const [tab, setTab] = useState<'conversations' | 'tickets'>('conversations');
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

  // Tickets state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [ticketStatusFilter, setTicketStatusFilter] = useState<string>('');
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertSubject, setConvertSubject] = useState('');
  const [convertMessageId, setConvertMessageId] = useState<string | null>(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [updatingTicket, setUpdatingTicket] = useState(false);

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

  const loadTickets = async () => {
    setLoadingTickets(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (ticketStatusFilter) params.set('status', ticketStatusFilter);
      const res = await fetch(`${API_BASE}/job/chat/tickets?${params.toString()}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load tickets');
      }
      const data = (await res.json()) as Ticket[];
      setTickets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadTicketDetail = async (id: string) => {
    setLoadingTicketDetail(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/chat/tickets/${id}`, { headers });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to load ticket');
      }
      const data = (await res.json()) as Ticket;
      setTicketDetail(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load ticket');
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedPeerId) {
      loadMessages(selectedPeerId);
    }
  }, [selectedPeerId]);

  useEffect(() => {
    if (tab === 'tickets') {
      loadTickets();
    }
  }, [tab, ticketStatusFilter]);

  useEffect(() => {
    if (selectedTicketId && tab === 'tickets') {
      loadTicketDetail(selectedTicketId);
    } else {
      setTicketDetail(null);
    }
  }, [selectedTicketId, tab]);

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
      loadThreads();
    } catch (e: any) {
      setError(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const openConvertModal = () => {
    const name = activeThread?.other?.displayName || activeThread?.other?.username || 'User';
    setConvertSubject(`Support: ${name}`);
    setConvertMessageId(messages.length > 0 ? messages[messages.length - 1]?.id : null);
    setConvertModalOpen(true);
  };

  const handleConvertToTicket = async () => {
    if (!selectedPeerId) return;
    setCreatingTicket(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/chat/tickets`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          peerId: selectedPeerId,
          subject: convertSubject.trim() || 'Support request',
          description: messages.length > 0 ? messages[messages.length - 1]?.content?.slice(0, 500) : undefined,
          messageId: convertMessageId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create ticket');
      }
      setConvertModalOpen(false);
      setTab('tickets');
      loadTickets();
      const created = await res.json();
      setSelectedTicketId(created.id);
    } catch (e: any) {
      setError(e.message || 'Failed to create ticket');
    } finally {
      setCreatingTicket(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    setUpdatingTicket(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/chat/tickets/${ticketId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to update ticket');
      }
      const updated = await res.json();
      setTicketDetail(updated);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    } catch (e: any) {
      setError(e.message || 'Failed to update ticket');
    } finally {
      setUpdatingTicket(false);
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedToAccountId: string | null) => {
    setUpdatingTicket(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/job/chat/tickets/${ticketId}/assign`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ assignedToAccountId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to assign ticket');
      }
      const updated = await res.json();
      setTicketDetail(updated);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
    } catch (e: any) {
      setError(e.message || 'Failed to assign ticket');
    } finally {
      setUpdatingTicket(false);
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
            Direct messages and support tickets. Convert conversations to tickets for assignment and tracking.
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
          <button
            type="button"
            onClick={() => setTab('conversations')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
              tab === 'conversations'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Conversations
          </button>
          <button
            type="button"
            onClick={() => setTab('tickets')}
            className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium ${
              tab === 'tickets'
                ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tickets
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        {tab === 'conversations' && (
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
        )}

        {tab === 'tickets' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-[420px] overflow-auto">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Tickets</span>
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="text-[11px] rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-2 py-1"
              >
                <option value="">All</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              {loadingTickets && (
                <div className="px-3 py-3 text-slate-500 dark:text-slate-400">Loading tickets…</div>
              )}
              {!loadingTickets && tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 ${
                    selectedTicketId === t.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="font-medium truncate">{t.subject}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 mt-0.5">
                    <span className="capitalize">{t.status.replace('_', ' ')}</span>
                    <span>{t.peer?.displayName || t.peerId}</span>
                  </div>
                  {t.assignedTo && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      → {t.assignedTo.displayName || t.assignedTo.username}
                    </div>
                  )}
                </button>
              ))}
              {!loadingTickets && tickets.length === 0 && (
                <div className="px-3 py-3 text-slate-500 dark:text-slate-400">
                  No tickets yet. Convert a conversation to a ticket to track support requests.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
        {tab === 'conversations' && (
          <>
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
                  <button
                    type="button"
                    onClick={openConvertModal}
                    className="px-3 py-1.5 rounded-md bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-500"
                  >
                    Convert to ticket
                  </button>
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
          </>
        )}

        {tab === 'tickets' && (
          <>
            {!selectedTicketId && (
              <div className="flex-1 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 px-4">
                Select a ticket on the left or convert a conversation to a ticket.
              </div>
            )}
            {selectedTicketId && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {loadingTicketDetail && (
                  <div className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading ticket…</div>
                )}
                {ticketDetail && !loadingTicketDetail && (
                  <>
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {ticketDetail.subject}
                      </h3>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        From: {ticketDetail.peer?.displayName || ticketDetail.peer?.username || ticketDetail.peerId}
                        {' · '}
                        {new Date(ticketDetail.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex-1 overflow-auto px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {ticketDetail.description && (
                        <p className="whitespace-pre-wrap mb-4">{ticketDetail.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                        <select
                          value={ticketDetail.status}
                          disabled={updatingTicket}
                          onChange={(e) => handleUpdateTicketStatus(ticketDetail.id, e.target.value)}
                          className="text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-2 py-1"
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                        <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">Assign to:</span>
                        <button
                          type="button"
                          onClick={() => handleAssignTicket(ticketDetail.id, null)}
                          className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          Unassign
                        </button>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ticketDetail.assignedTo
                            ? `Assigned to ${ticketDetail.assignedTo.displayName || ticketDetail.assignedTo.username}`
                            : 'Not assigned'}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {convertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-3">
              Convert to ticket
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Create a support ticket from this conversation. You can link the latest message for context.
            </p>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-200 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={convertSubject}
              onChange={(e) => setConvertSubject(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 mb-3"
              placeholder="Support request"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConvertModalOpen(false)}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConvertToTicket}
                disabled={creatingTicket || !convertSubject.trim()}
                className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {creatingTicket ? 'Creating…' : 'Create ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
