import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase, getToken } from '../../services/api';

export default function ReportProblem() {
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('Bug');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!message.trim()) return;
    const token = getToken();
    if (!token) {
      setError('Please sign in to report a problem.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/reports/problem`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.slice(0, 200), description: message.trim().slice(0, 1000) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <PageLayout title="Report sent" backTo="/settings/help">
        <div className="py-4 space-y-4">
          <ThemedText className="text-moxe-body text-moxe-text">
            Thank you. We’ve received your report and will use it to improve MOxE.
          </ThemedText>
          <Link to="/settings/help" className="text-moxe-primary font-medium">Back to Help</Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Report a Problem" backTo="/settings/help">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-body">
          Describe the issue you're experiencing. We'll use this to improve MOxE.
        </ThemedText>
        <div>
          <label className="block text-sm font-medium text-moxe-text mb-1">Category</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text">
            <option value="Bug">Bug</option>
            <option value="Feedback">Feedback</option>
            <option value="Safety concern">Safety concern</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What went wrong?"
          rows={5}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder-moxe-textSecondary text-moxe-body focus:outline-none focus:ring-1 focus:ring-moxe-primary resize-none"
          aria-label="Problem description"
        />
        <p className="text-xs text-moxe-textSecondary">{message.length}/1000</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <ThemedButton
          label={submitting ? 'Sending…' : 'Send'}
          onClick={handleSend}
          className="w-full justify-center"
          disabled={!message.trim() || submitting}
        />
        <p className="text-xs text-moxe-textSecondary text-center">
          To report without signing in, use <Link to="/report/anonymous" className="text-moxe-primary">anonymous report</Link>.
        </p>
      </div>
    </PageLayout>
  );
}
