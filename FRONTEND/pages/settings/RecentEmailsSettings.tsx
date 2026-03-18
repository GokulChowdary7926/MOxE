import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

const MOCK_EMAILS = [
  { id: '1', subject: 'New login to MOxE', time: '2 hours ago', type: 'security' },
  { id: '2', subject: 'Your weekly insights', time: '1 day ago', type: 'insights' },
];

export default function RecentEmailsSettings() {
  return (
    <SettingsPageShell title="Recent emails" backTo="/settings/account-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Emails we’ve sent you recently about your account and security.</p>
        <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
          {MOCK_EMAILS.map((e) => (
            <div key={e.id} className="px-4 py-3 border-b border-[#262626] last:border-b-0">
              <p className="text-white font-medium text-sm">{e.subject}</p>
              <p className="text-[#737373] text-xs mt-0.5">{e.time}</p>
            </div>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
