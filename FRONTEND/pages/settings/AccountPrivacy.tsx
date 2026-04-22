import React, { useEffect, useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { getApiBase } from '../../services/api';

export default function AccountPrivacy() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [accountType, setAccountType] = useState<string>('PERSONAL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${getApiBase()}/accounts/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.account) {
          setIsPrivate(!!data.account.isPrivate);
          setAccountType(String(data.account.accountType || 'PERSONAL').toUpperCase());
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function togglePrivate() {
    if (accountType === 'BUSINESS' || accountType === 'JOB') return;
    const next = !isPrivate;
    setIsPrivate(next);
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${getApiBase()}/accounts/me`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrivate: next }),
      });
    } catch {
      setIsPrivate(!next);
    }
  }

  return (
    <SettingsPageShell title="Account privacy" backTo="/settings/privacy">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Private account</h2>
          <button
            type="button"
            role="switch"
            aria-checked={isPrivate}
            disabled={loading || accountType === 'BUSINESS' || accountType === 'JOB'}
            onClick={togglePrivate}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors disabled:opacity-60 ${isPrivate ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isPrivate ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
        {(accountType === 'BUSINESS' || accountType === 'JOB') && (
          <p className="text-[#a8a8a8] text-sm mb-3">
            {accountType === 'BUSINESS' ? 'Business' : 'Job'} accounts are always public.
          </p>
        )}
        <p className="text-[#a8a8a8] text-sm mb-3">
          When your account is public, your profile and posts can be seen by anyone, on or off MOxE, even if they don&apos;t have a MOxE account.
        </p>
        <p className="text-[#a8a8a8] text-sm mb-3">
          When your account is private, only the followers that you approve can see what you share, including your photos or videos on hashtag and location pages, and your followers and following lists. Certain info on your profile, such as your profile picture and username, is visible to everyone on and off MOxE.
        </p>
        <a href="https://help.instagram.com/116064594648721" target="_blank" rel="noopener noreferrer" className="text-[#0095f6] text-sm font-medium">
          Learn more
        </a>
      </div>
    </SettingsPageShell>
  );
}
