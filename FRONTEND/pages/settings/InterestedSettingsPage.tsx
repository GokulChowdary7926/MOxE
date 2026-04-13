import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';
import toast from 'react-hot-toast';

export default function InterestedSettingsPage() {
  const [topic, setTopic] = useState('');
  const [postId, setPostId] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const token = getToken();
    if (!token) return toast.error('Sign in first');
    const t = topic.trim();
    const p = postId.trim();
    if (!t && !p) return toast.error('Enter a topic and/or post ID');
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/ranking/interested`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t || undefined,
          targetId: p || undefined,
          targetType: p ? 'POST' : undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error || 'Failed');
      }
      toast.success('Preference recorded.');
      setTopic('');
      setPostId('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsPageShell title="Interested" backTo="/settings/content-preferences">
      <div className="px-4 py-4 space-y-3">
        <p className="text-[#a8a8a8] text-sm">
          Tell MOxE you want <strong className="text-white">more</strong> of a topic, or reinforce interest in
          a specific post. This complements &quot;Not interested&quot; and your algorithm topics.
        </p>
        <Link to="/settings/algorithm-preferences" className="text-[#0095f6] text-sm font-semibold block">
          Open Your algorithm (topics)
        </Link>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Topic (e.g. street photography)</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Post ID (optional, cuid from URL)</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white font-mono text-xs"
            value={postId}
            onChange={(e) => setPostId(e.target.value)}
            placeholder="clxxxxxxxx"
          />
        </label>
        <button
          type="button"
          disabled={sending}
          onClick={() => void submit()}
          className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
        >
          {sending ? 'Saving…' : 'Save interest'}
        </button>
      </div>
    </SettingsPageShell>
  );
}
