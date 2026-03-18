import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

type TicketDetail = {
  id: string;
  subject: string;
  message: string;
  category: string;
  isPriority?: boolean;
  createdAt: string;
  replies?: { id: string; message: string; isStaff: boolean; createdAt: string }[];
};

export default function SupportTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    fetch(`${getApiBase()}/support/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error('Ticket not found');
        return r.json();
      })
      .then(setTicket)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  async function handleReply() {
    if (!id || !reply.trim()) return;
    const token = getToken();
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/support/tickets/${id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim().slice(0, 5000) }),
      });
      if (!res.ok) throw new Error('Failed to send reply');
      setReply('');
      const updated = await fetch(`${getApiBase()}/support/tickets/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      setTicket(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (loading || !ticket) {
    return (
      <PageLayout title="Ticket" backTo="/support/tickets">
        <ThemedView className="p-4">{error ? <p className="text-red-500">{error}</p> : <p className="text-moxe-textSecondary">Loading…</p>}</ThemedView>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={ticket.subject || 'Support ticket'} backTo="/support/tickets">
      <ThemedView className="p-4 flex flex-col h-full">
        <div className="rounded-xl bg-moxe-surface border border-moxe-border p-3 mb-2">
          <p className="text-moxe-text whitespace-pre-wrap">{ticket.message}</p>
          <p className="text-xs text-moxe-textSecondary mt-2">{new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        {(ticket.replies ?? []).map((r) => (
          <div key={r.id} className={`rounded-xl p-3 mb-2 ${r.isStaff ? 'bg-moxe-primary/10 border border-moxe-primary/30' : 'bg-moxe-surface border border-moxe-border'}`}>
            <p className="text-moxe-text whitespace-pre-wrap text-sm">{r.message}</p>
            <p className="text-xs text-moxe-textSecondary mt-1">{r.isStaff ? 'Support' : 'You'} · {new Date(r.createdAt).toLocaleString()}</p>
          </div>
        ))}
        <div className="mt-auto pt-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Add a reply..."
            rows={3}
            maxLength={5000}
            className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder:text-moxe-textSecondary resize-none"
          />
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          <ThemedButton label={sending ? 'Sending…' : 'Send reply'} onClick={handleReply} disabled={!reply.trim() || sending} className="mt-2 w-full justify-center" />
        </div>
      </ThemedView>
    </PageLayout>
  );
}
