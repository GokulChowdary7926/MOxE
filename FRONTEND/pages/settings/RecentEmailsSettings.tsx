import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function RecentEmailsSettings() {
  return (
    <SettingsPageShell title="Recent emails" backTo="/settings/account-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">
          Emails we’ve sent you recently about your account and security.
        </p>
        <div className="rounded-xl border border-[#262626] px-4 py-6 text-center">
          <p className="text-[#737373] text-sm">
            We don’t keep a delivery log in the app yet. Check your inbox for verification and security messages.
            In-app alerts are under{' '}
            <span className="text-white">Notifications</span>.
          </p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
