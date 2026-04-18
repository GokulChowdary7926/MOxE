import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import { validateUsernameClient } from '../../utils/usernameValidation';

export default function EditUsernamePage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const [username, setUsername] = useState(account?.username ?? '');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = (raw: string) => {
    const r = validateUsernameClient(raw);
    if (!r.ok) return { ok: false as const, message: r.message };
    return { ok: true as const, normalized: r.normalized };
  };

  async function checkAvailability() {
    const v = validate(username);
    if (!v.ok) {
      setValidationError(v.message);
      setAvailable(false);
      return;
    }
    const normalized = v.normalized;

    // If user didn't actually change (case-insensitive), treat as available.
    if ((account?.username ?? '').toLowerCase() === normalized.toLowerCase()) {
      setValidationError(null);
      setAvailable(true);
      return;
    }

    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/accounts/check-username?username=${encodeURIComponent(normalized)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      setAvailable(data?.available !== false);
      setValidationError(null);
    } catch {
      setAvailable(null);
    }
  }

  async function handleDone() {
    const token = getToken();
    if (!token) return;
    const v = validate(username);
    if (!v.ok) {
      setValidationError(v.message);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${getApiBase()}/accounts/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: v.normalized.trim() }),
      });
      if (res.ok) navigate(-1);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <MoxePageHeader title="Edit username" onBack={() => navigate(-1)} />

        <div className="flex-1 overflow-auto p-4">
          <p className="text-[#a8a8a8] text-sm mb-4">Changing your username will also change your MOxE account address. Use 1-30 characters: lowercase letters, numbers, periods, or underscores.</p>
          <label className="block text-[#737373] text-xs mb-1">Username</label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''));
                setAvailable(null);
                setValidationError(null);
              }}
              onBlur={checkAvailability}
              className="w-full px-4 py-3 pr-10 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm"
              placeholder="lowercase, numbers, ., _"
              maxLength={30}
            />
            {available === true && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </span>
            )}
          </div>
          {validationError && (
            <p className="text-red-400 text-xs mt-2">{validationError}</p>
          )}
          <p className="text-[#737373] text-xs mt-2">
            Your current MOxE username {username || '...'} is available.
          </p>
        </div>

        <div className="p-4 border-t border-[#262626]">
          <button
            type="button"
            onClick={handleDone}
            disabled={saving || !username.trim() || !validate(username).ok}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Done'}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
