import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

export default function CreateSupportTicket() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/support/tickets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim().slice(0, 200), message: message.trim().slice(0, 5000), category }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket');
      navigate(`/support/tickets/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageLayout title="New support ticket" backTo="/support/tickets">
      <ThemedView className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-moxe-text mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary"
              maxLength={200}
              className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder:text-moxe-textSecondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-moxe-text mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text">
              <option value="general">General</option>
              <option value="seller">Seller</option>
              <option value="billing">Billing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-moxe-text mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue..."
              rows={5}
              maxLength={5000}
              className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder:text-moxe-textSecondary resize-none"
            />
            <p className="text-xs text-moxe-textSecondary mt-0.5">{message.length}/5000</p>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <ThemedButton type="submit" label={submitting ? 'Creating…' : 'Create ticket'} disabled={!subject.trim() || !message.trim() || submitting} className="w-full justify-center" />
        </form>
      </ThemedView>
    </PageLayout>
  );
}
