import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function MemorializationRequestPage() {
  const [subjectUsername, setSubjectUsername] = useState('');
  const [relationship, setRelationship] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const t = getToken();
    if (!t) {
      toast.error('Sign in to submit.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/legal/memorialization-requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectUsername, relationship, details }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
      toast.success('Request submitted for review.');
      setSubjectUsername('');
      setRelationship('');
      setDetails('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsPageShell title="Memorialization" backTo="/settings/help/legal-trust">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        Only close friends or family should submit. Accounts approved for memorialization cannot be logged
        into; public profile rules are applied per MOxE policy.
      </p>
      <div className="px-4 space-y-3 pb-6">
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Username to memorialize</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            value={subjectUsername}
            onChange={(e) => setSubjectUsername(e.target.value)}
            placeholder="@username"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Your relationship</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g. sibling, parent"
          />
        </label>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Details (required)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[120px]"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Context for reviewers. Do not include payment or ID numbers unless support asks."
          />
        </label>
        <button
          type="button"
          disabled={sending}
          onClick={() => void submit()}
          className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
        >
          {sending ? 'Submitting…' : 'Submit request'}
        </button>
      </div>
    </SettingsPageShell>
  );
}
