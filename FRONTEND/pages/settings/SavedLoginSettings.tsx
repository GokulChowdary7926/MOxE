import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function SavedLoginSettings() {
  const [saveLogin, setSaveLogin] = useState(true);

  return (
    <SettingsPageShell title="Saved login" backTo="/settings/account-centre">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Save login info"
          checked={saveLogin}
          onChange={setSaveLogin}
          description="Save your username and password so you can log in faster next time. Only on this device."
        />
        <div className="px-4 py-3 border-b border-[#262626]">
          <p className="text-[#a8a8a8] text-sm">When this is on, MOxE will remember your login details on this device. Turn off if you’re using a shared device.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
