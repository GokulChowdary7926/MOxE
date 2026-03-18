import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';

export default function NamePage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const [name, setName] = useState(account?.displayName ?? account?.username ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/accounts/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: name.trim() }),
      });
      if (res.ok) navigate(-1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Name</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto p-4">
          <label className="block text-[#737373] text-xs mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
            placeholder="Name"
          />
          <p className="text-[#737373] text-xs mt-3">You can only change your name twice within 14 days.</p>
        </div>

        <div className="p-4 border-t border-[#262626]">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
