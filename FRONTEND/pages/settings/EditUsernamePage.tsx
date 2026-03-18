import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';

export default function EditUsernamePage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const [username, setUsername] = useState(account?.username ?? '');
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  async function checkAvailability() {
    if (!username.trim()) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/accounts/check-username?username=${encodeURIComponent(username.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      setAvailable(data?.available !== false);
    } catch {
      setAvailable(null);
    }
  }

  async function handleDone() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/accounts/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
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
          <span className="flex-1 text-white font-semibold text-base text-center">Edit username</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto p-4">
          <p className="text-[#a8a8a8] text-sm mb-4">Changing your username will also change your MOxE account address.</p>
          <label className="block text-[#737373] text-xs mb-1">Username</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setAvailable(null); }}
              onBlur={checkAvailability}
              className="w-full px-4 py-3 pr-10 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
              placeholder="Username"
            />
            {available === true && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </span>
            )}
          </div>
          <p className="text-[#737373] text-xs mt-2">
            Your current MOxE username {username || '...'} is available.
          </p>
        </div>

        <div className="p-4 border-t border-[#262626]">
          <button
            type="button"
            onClick={handleDone}
            disabled={saving || !username.trim()}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
