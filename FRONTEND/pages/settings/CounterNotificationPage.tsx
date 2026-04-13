import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function CounterNotificationPage() {
  const [fullLegalName, setFullLegalName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [originalComplaintRef, setOriginalComplaintRef] = useState('');
  const [goodFaithStatement, setGoodFaithStatement] = useState('');
  const [consentJurisdiction, setConsentJurisdiction] = useState('');
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const t = getToken();
    if (!t) {
      toast.error('Sign in to submit.');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/legal/counter-notifications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullLegalName,
          address,
          phoneOrEmail,
          originalComplaintRef,
          goodFaithStatement,
          consentJurisdiction,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string; message?: string }).message || (data as { error?: string }).error || 'Request failed');
      toast.success(`Submitted. Ticket ${(data as { ticketId?: string }).ticketId ?? 'created'}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsPageShell title="Counter-notification" backTo="/settings/help/legal-trust">
      <p className="text-[#a8a8a8] text-xs px-4 py-2">
        U.S. DMCA-style fields for illustration only. Intake is logged and reviewed with support/legal.
      </p>
      <div className="px-4 space-y-2 pb-6">
        {(
          [
            ['Legal name', fullLegalName, setFullLegalName] as const,
            ['Address', address, setAddress] as const,
            ['Phone or email', phoneOrEmail, setPhoneOrEmail] as const,
            ['Original complaint / reference ID', originalComplaintRef, setOriginalComplaintRef] as const,
          ] as const
        ).map(([label, val, set]) => (
          <label key={label} className="block">
            <span className="text-[#a8a8a8] text-xs">{label}</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
              value={val}
              onChange={(e) => set(e.target.value)}
            />
          </label>
        ))}
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Good faith statement</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[80px]"
            value={goodFaithStatement}
            onChange={(e) => setGoodFaithStatement(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-[#a8a8a8] text-xs">Consent to jurisdiction</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[60px]"
            value={consentJurisdiction}
            onChange={(e) => setConsentJurisdiction(e.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={sending}
          onClick={() => void submit()}
          className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
        >
          {sending ? 'Submitting…' : 'Submit counter-notification'}
        </button>
      </div>
    </SettingsPageShell>
  );
}
