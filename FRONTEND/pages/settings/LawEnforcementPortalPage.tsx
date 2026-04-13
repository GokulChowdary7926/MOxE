import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function LawEnforcementPortalPage() {
  const [tab, setTab] = useState<'le' | 'subpoena'>('le');
  const [agency, setAgency] = useState('');
  const [badgeOrCaseId, setBadgeOrCaseId] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [summary, setSummary] = useState('');
  const [preservationRequest, setPreservationRequest] = useState(false);
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [matterReference, setMatterReference] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [scope, setScope] = useState('');
  const [sending, setSending] = useState(false);

  const submitLe = async () => {
    const t = getToken();
    if (!t) return toast.error('Sign in to submit.');
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/legal/law-enforcement-submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ agency, badgeOrCaseId, contactEmail, summary, preservationRequest }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || (data as { error?: string }).error || 'Failed');
      toast.success('Submission logged.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  const submitSub = async () => {
    const t = getToken();
    if (!t) return toast.error('Sign in to submit.');
    setSending(true);
    try {
      const res = await fetch(`${getApiBase()}/legal/subpoena-submissions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ issuingAuthority, matterReference, serviceAddress, scope }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { message?: string }).message || (data as { error?: string }).error || 'Failed');
      toast.success('Submission logged.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <SettingsPageShell title="Law enforcement" backTo="/settings/help/legal-trust">
      <div className="flex gap-2 px-4 pt-2">
        <button
          type="button"
          onClick={() => setTab('le')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tab === 'le' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
        >
          LE / preservation
        </button>
        <button
          type="button"
          onClick={() => setTab('subpoena')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold ${tab === 'subpoena' ? 'bg-[#262626] text-white' : 'text-[#a8a8a8]'}`}
        >
          Subpoena
        </button>
      </div>
      <p className="text-[#a8a8a8] text-xs px-4 py-2">
        Authenticated intake for accountable requests. For emergencies involving imminent harm, contact local
        authorities and MOxE trust &amp; safety.
      </p>
      {tab === 'le' ? (
        <div className="px-4 space-y-2 pb-6">
          <input
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            placeholder="Agency / department"
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            placeholder="Badge or case ID (optional)"
            value={badgeOrCaseId}
            onChange={(e) => setBadgeOrCaseId(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            placeholder="Official contact email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[100px]"
            placeholder="Narrative and identifiers (accounts, URLs, time window)"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={preservationRequest}
              onChange={(e) => setPreservationRequest(e.target.checked)}
            />
            Preservation request
          </label>
          <button
            type="button"
            disabled={sending}
            onClick={() => void submitLe()}
            className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm"
          >
            {sending ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-6">
          <input
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            placeholder="Issuing authority / court"
            value={issuingAuthority}
            onChange={(e) => setIssuingAuthority(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            placeholder="Matter reference (optional)"
            value={matterReference}
            onChange={(e) => setMatterReference(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm"
            placeholder="Service address for response"
            value={serviceAddress}
            onChange={(e) => setServiceAddress(e.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-[#363636] bg-black px-3 py-2 text-white text-sm min-h-[100px]"
            placeholder="Scope of documents or data sought"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
          <button
            type="button"
            disabled={sending}
            onClick={() => void submitSub()}
            className="w-full py-2.5 rounded-lg bg-[#0095f6] text-white font-semibold text-sm"
          >
            {sending ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      )}
    </SettingsPageShell>
  );
}
