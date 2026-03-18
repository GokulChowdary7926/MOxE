import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Star, ChevronRight, Inbox, Plus } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

type Ticket = {
  id: string;
  subject: string;
  message: string;
  category: string;
  isPriority?: boolean;
  status?: string;
  createdAt: string;
  account?: { id: string; username: string; displayName: string | null };
};

/**
 * Support tickets list with optional queue view (priority first) for agents.
 */
export default function SupportTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [queueView, setQueueView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    setError(null);
    const url = `${getApiBase()}/support/tickets${queueView ? '?queue=true' : ''}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load tickets');
        return r.json();
      })
      .then((data) => setTickets(Array.isArray(data.tickets) ? data.tickets : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [queueView, navigate]);

  return (
    <PageLayout title="Support tickets" backTo="/settings/help">
      <ThemedView className="p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <ThemedText className="text-moxe-body text-moxe-text">Your support requests and replies.</ThemedText>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/support/tickets/new')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-moxe-primary text-white text-sm font-medium">
              <Plus className="w-4 h-4" /> New ticket
            </button>
            <label className="flex items-center gap-2 text-sm text-moxe-text cursor-pointer">
            <input
              type="checkbox"
              checked={queueView}
              onChange={(e) => setQueueView(e.target.checked)}
              className="rounded border-moxe-border bg-moxe-surface"
            />
            Queue view (priority first)
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-moxe-textSecondary">Loading…</p>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 text-moxe-textSecondary">
            <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No tickets yet.</p>
            <p className="text-sm mt-1">Create one from Help or when contacting support.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {tickets.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/support/tickets/${t.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-moxe-surface border border-moxe-border text-left hover:border-moxe-primary/50 transition-colors"
                >
                  <MessageCircle className="w-5 h-5 text-moxe-textSecondary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-moxe-text truncate">{t.subject || 'Support request'}</span>
                      {t.isPriority && <Star className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-moxe-textSecondary truncate mt-0.5">{t.message?.slice(0, 80)}{(t.message?.length ?? 0) > 80 ? '…' : ''}</p>
                    {queueView && t.account && (
                      <p className="text-xs text-moxe-textSecondary mt-1">@{t.account.username}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-moxe-textSecondary flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </ThemedView>
    </PageLayout>
  );
}
