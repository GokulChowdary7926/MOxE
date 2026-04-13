import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function TransferInformationPage() {
  const [destinationService, setDestinationService] = useState('');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const t = getToken();
    if (!t) return toast.error('Sign in to submit.');
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/legal/transfer-requests`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinationService, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || (data as { error?: string }).error || 'Failed');
      toast.success('Transfer assistance request logged. You can also download a full export first.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsPageShell title="Transfer information" backTo="/settings/help/legal-trust">
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        Request help moving your MOxE data to another provider. This does not auto-sync accounts; use{' '}
        <Link to="/settings/download-your-data" className="text-[#0095f6]">
          Download your data
        </Link>{' '}
        for an immediate export.
      </p>
      <div className="px-4 space-y-3 pb-6">
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Destination service</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            value={destinationService}
            onChange={(e) => setDestinationService(e.target.value)}
            placeholder="e.g. another platform name"
          />
        </label>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Notes (optional)</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={sending}
          onClick={() => void submit()}
          className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm"
        >
          {sending ? 'Submitting…' : 'Submit transfer request'}
        </button>
      </div>
    </SettingsPageShell>
  );
}
