import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function AdPreferencesSettings() {
  const [personalised, setPersonalised] = useState(true);

  return (
    <SettingsPageShell title="Ad preferences" backTo="/settings/account-centre">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Use data for personalised ads"
          checked={personalised}
          onChange={setPersonalised}
          description="Allow MOxE to use your activity and profile to show you more relevant ads."
        />
        <Link
          to="/settings/account-centre/information-permissions"
          className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
        >
          <span className="font-medium">Your information and permissions</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <div className="px-4 py-3">
          <p className="text-[#a8a8a8] text-sm">You can control how your data is used for ads and manage ad topics.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
