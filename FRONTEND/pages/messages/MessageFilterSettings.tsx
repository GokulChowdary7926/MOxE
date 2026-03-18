import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';

export default function MessageFilterSettings() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';
  const showPrimaryGeneral = ['CREATOR', 'BUSINESS', 'JOB'].includes(accountType ?? '');

  return (
    <SettingsPageShell title="Message filter" backTo="/settings/messages">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">
          {showPrimaryGeneral
            ? 'Choose which messages go to your Primary and General tabs. You can change this anytime.'
            : 'Manage how messages are filtered and organised.'}
        </p>
        {showPrimaryGeneral && (
          <div className="space-y-2">
            <div className="p-4 rounded-xl bg-[#262626]">
              <p className="text-white font-medium">Primary</p>
              <p className="text-[#a8a8a8] text-sm mt-1">Messages from people you follow and verified accounts.</p>
            </div>
            <div className="p-4 rounded-xl bg-[#262626]">
              <p className="text-white font-medium">General</p>
              <p className="text-[#a8a8a8] text-sm mt-1">All other messages and message requests.</p>
            </div>
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
