import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getApiBase, getToken } from '../../services/api';

export default function ChangePasswordPage2() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as any;
  const username = account?.username ?? 'user';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [retypePassword, setRetypePassword] = useState('');
  const [logoutOther, setLogoutOther] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword() {
    setError(null);
    if (newPassword !== retypePassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${getApiBase()}/accounts/me/change-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          logoutOtherDevices: logoutOther,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) navigate(-2);
      else setError(data.error || 'Failed to change password.');
    } catch {
      setError('Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Change password</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto p-4 pb-24">
          <p className="text-[#737373] text-xs mb-2">@{username} · MOxE</p>
          <p className="text-white font-semibold text-xl mb-2">Change password</p>
          <p className="text-[#a8a8a8] text-sm mb-6">
            Your password must be at least 6 characters and should include a combination of numbers, letters and special characters (!$@%).
          </p>

          <label className="block text-[#737373] text-xs mb-1">Current password (updated on 18/08/2025)</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm mb-4"
            placeholder="Current password"
          />

          <label className="block text-[#737373] text-xs mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm mb-4"
            placeholder="New password"
          />

          <label className="block text-[#737373] text-xs mb-1">Retype new password</label>
          <input
            type="password"
            value={retypePassword}
            onChange={(e) => setRetypePassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm mb-4"
            placeholder="Retype new password"
          />

          <p className="mb-4"><Link to="/forgot-password" className="text-[#0095f6] text-sm">Forgotten your password?</Link></p>

          <label className="flex items-center gap-3 text-white text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={logoutOther}
              onChange={(e) => setLogoutOther(e.target.checked)}
              className="w-4 h-4 rounded border-[#363636] bg-[#262626] text-[#0095f6]"
            />
            <span>Log out of other devices. Choose this if someone else used your account.</span>
          </label>
        </div>

        {error && <p className="px-4 py-2 text-red-400 text-sm">{error}</p>}

        <div className="fixed bottom-0 left-0 right-0 max-w-[428px] mx-auto p-4 border-t border-[#262626] bg-black safe-area-pb">
          <button
            type="button"
            onClick={handleChangePassword}
            disabled={submitting || !currentPassword || !newPassword || !retypePassword}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-sm disabled:opacity-50"
          >
            {submitting ? 'Changing…' : 'Change password'}
          </button>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
