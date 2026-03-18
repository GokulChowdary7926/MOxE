import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function SwitchProfessionalPage() {
  return (
    <SettingsPageShell title="Switch to professional account" backTo="/settings/account-type-tools">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Get insights, contact options, and more. Choose Creator or Business.</p>
        <Link to="/settings/account-type" className="block w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm text-center mb-2">
          Switch account type
        </Link>
        <p className="text-[#737373] text-xs text-center">You can switch back to a personal account anytime.</p>
      </div>
    </SettingsPageShell>
  );
}
