import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

export default function AddEmergencyContactPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const token = getToken();
    if (!token) {
      setError('Please log in to add an emergency contact.');
      return;
    }

    const trimmedRelationship = relationship.trim() || 'Contact';
    const qPhone = phone.trim();
    const qEmail = email.trim();
    const qName = name.trim().replace(/^@+/, '');

    // Lookup: prefer phone/email; fallback to treating "name" as MOxE username.
    const params = new URLSearchParams();
    if (qPhone) params.set('phoneNumber', qPhone);
    if (qEmail) params.set('email', qEmail);
    if (!qPhone && !qEmail && qName) params.set('username', qName);

    if (!params.toString()) {
      setError('Enter phone, email, or a MOxE username.');
      return;
    }

    setSaving(true);
    try {
      const lookupRes = await fetch(`${getApiBase()}/accounts/lookup?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lookupData = await lookupRes.json().catch(() => ({}));
      if (!lookupRes.ok || !lookupData?.account?.id) {
        throw new Error(lookupData.error || 'Could not find that MOxE account.');
      }

      const contactId = lookupData.account.id as string;

      const res = await fetch(`${getApiBase()}/emergency-contacts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          relationship: trimmedRelationship,
          isPrimary: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to add contact.');

      navigate('/map/sos/contacts');
    } catch (e: any) {
      setError(e?.message || 'Failed to add contact.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageShell title="Add Emergency Contact" backTo="/map/sos/contacts" right={<Link to="/map/sos/contacts" className="text-white p-1" aria-label="Close"><span className="text-xl leading-none">×</span></Link>}>
      <form onSubmit={handleAdd} className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-white font-medium mb-1">Name / MOxE Username</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name or @username"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter phone number (optional)"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email (optional)"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <div>
          <label className="block text-white font-medium mb-1">Relationship</label>
          <input
            type="text"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="e.g., Family, Friend"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>

        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="block w-full py-3 rounded-xl bg-amber-500 text-black font-bold text-center mt-2 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Add Contact'}
        </button>
      </form>
    </SettingsPageShell>
  );
}
