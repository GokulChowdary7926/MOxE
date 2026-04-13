import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function CrosspostingSettings() {
  const [allowCrosspost, setAllowCrosspost] = useState(true);

  return (
    <SettingsPageShell title="Crossposting" backTo="/settings">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Allow crossposting to other apps"
          checked={allowCrosspost}
          onChange={setAllowCrosspost}
          description="Let your posts be shared to other apps you connect, when you choose to crosspost."
        />
        <div className="px-4 py-3">
          <p className="text-[#a8a8a8] text-sm">When this is on, you can share MOxE posts to linked apps in one tap.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
