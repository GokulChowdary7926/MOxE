import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const REPORT_TYPES = [
  { value: 'problem', label: 'General problem' },
  { value: 'account', label: 'Account' },
  { value: 'post', label: 'Post' },
  { value: 'comment', label: 'Comment' },
  { value: 'story', label: 'Story' },
];

const REASONS: Record<string, string[]> = {
  problem: ['Bug', 'Feedback', 'Safety concern', 'Other'],
  account: ['Spam', 'Harassment', 'Impersonation', 'Other'],
  post: ['Spam', 'Inappropriate', 'Copyright', 'Other'],
  comment: ['Spam', 'Harassment', 'Hate speech', 'Other'],
  story: ['Spam', 'Inappropriate', 'Other'],
};

/**
 * Anonymous reporting – no login required. Submit report to POST /api/reports/anonymous.
 */
export default function AnonymousReport() {
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'problem';
  const targetParam = searchParams.get('targetId') || '';

  const [type, setType] = useState(typeParam);
  const [targetId, setTargetId] = useState(targetParam);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsTarget = type !== 'problem';
  const reasons = REASONS[type] || REASONS.problem;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    if (needsTarget && !targetId.trim()) {
      setError('Please provide the content or account ID you are reporting.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/reports/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          targetId: targetId.trim() || undefined,
          reason: reason.trim().slice(0, 200),
          description: description.trim().slice(0, 1000) || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to submit report');
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <PageLayout title="Report submitted" backTo="/">
        <ThemedView className="p-6 text-center">
          <ThemedText className="text-moxe-body text-moxe-text">
            Thank you. Your report was submitted anonymously and will be reviewed.
          </ThemedText>
          <Link to="/" className="mt-6 inline-block text-moxe-primary font-medium">Return home</Link>
        </ThemedView>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Anonymous report" backTo="/">
      <ThemedView className="p-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2 text-moxe-textSecondary text-sm mb-4">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
          Your identity will not be stored or shared.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-moxe-text mb-1">What are you reporting?</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {needsTarget && (
            <div>
              <label className="block text-sm font-medium text-moxe-text mb-1">Content or account ID</label>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                placeholder="Paste link or ID"
                className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder:text-moxe-textSecondary"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-moxe-text mb-1">Reason</label>
            <div className="flex flex-wrap gap-2">
              {reasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm ${reason === r ? 'bg-moxe-primary text-white' : 'bg-moxe-surface border border-moxe-border text-moxe-text'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-moxe-text mb-1">Details (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any additional context..."
              rows={3}
              maxLength={1000}
              className="w-full px-3 py-2 rounded-xl bg-moxe-surface border border-moxe-border text-moxe-text placeholder:text-moxe-textSecondary resize-none"
            />
            <p className="text-xs text-moxe-textSecondary mt-0.5">{description.length}/1000</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <ThemedButton
            type="submit"
            label={submitting ? 'Submitting…' : 'Submit anonymously'}
            disabled={!reason.trim() || submitting}
            className="w-full justify-center"
          />
        </form>

        <p className="mt-4 text-xs text-moxe-textSecondary text-center">
          For urgent safety issues, contact local authorities or use in-app emergency features.
        </p>
      </ThemedView>
    </PageLayout>
  );
}
