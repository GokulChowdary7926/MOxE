import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function AccountTypeSettings() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string; username?: string; isPrivate?: boolean } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';
  const isPrivate = currentAccount?.isPrivate ?? true;
  const username = currentAccount?.username ?? 'username';

  return (
    <SettingsPageShell title="Account type" backTo="/settings/account-type-tools">
      <h2 className="text-white font-semibold px-4 pt-4 pb-2">Your account</h2>
      <div className="px-4 py-3 border-b border-[#262626]">
        <p className="text-white font-bold">{accountType === 'PERSONAL' ? 'Personal' : accountType === 'CREATOR' ? 'Creator' : accountType === 'BUSINESS' ? 'Business' : 'Job'}</p>
        <p className="text-[#a8a8a8] text-sm">{isPrivate ? 'Private' : 'Public'}</p>
        <p className="text-[#a8a8a8] text-sm mt-1">{username}</p>
        <p className="text-[#a8a8a8] text-sm mt-2">
          You can get access to more tools when you make your account <Link to="/settings/account-privacy" className="text-[#0095f6]">public</Link> or switch to a <Link to="/settings/switch-professional" className="text-[#0095f6]">professional account</Link>.
        </p>
      </div>

      <h2 className="text-white font-semibold px-4 pt-6 pb-2">Other account types</h2>
      <div className="px-4 py-3 border-b border-[#262626]">
        <p className="text-white font-bold">Personal</p>
        <p className="text-[#a8a8a8] text-sm">Public</p>
        <p className="text-[#a8a8a8] text-sm mt-1">
          Personal accounts set to public with less than 1,000 followers can get access to tools such as insights and scheduled content.
        </p>
      </div>
      <div className="px-4 py-3 border-b border-[#262626]">
        <p className="text-white font-bold">Professional</p>
        <p className="text-[#a8a8a8] text-sm">Public</p>
        <p className="text-[#a8a8a8] text-sm mt-1">
          Professional accounts get access to additional tools for ads, monetisation and messaging. This account is best for businesses, public figures, content producers, artists and influencers.
        </p>
      </div>
    </SettingsPageShell>
  );
}
