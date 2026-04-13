import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function ClaimProfilePage() {
  const [targetUsername, setTargetUsername] = useState('');
  const [justification, setJustification] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const t = getToken();
    if (!t) {
      toast.error('Sign in to submit.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/legal/profile-claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUsername, justification }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
      toast.success('Claim submitted for review.');
      setTargetUsername('');
      setJustification('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsPageShell title="Claim a profile" backTo="/settings/help/legal-trust">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        For trademarks or inactive handles you have standing to manage. Automated username transfer is not
        performed; staff will follow up if approved.
      </p>
      <div className="px-4 space-y-3 pb-6">
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Target username</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            placeholder="@brand or handle"
          />
        </label>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Justification and evidence summary</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[140px]"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Why you should control this profile; link to docs if already filed with MOxE legal."
          />
        </label>
        <button
          type="button"
          disabled={sending}
          onClick={() => void submit()}
          className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
        >
          {sending ? 'Submitting…' : 'Submit claim'}
        </button>
      </div>
    </SettingsPageShell>
  );
}
