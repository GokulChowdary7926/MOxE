import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ConnectedExperiencesSettings() {
  const [allowLinking, setAllowLinking] = useState(true);

  return (
    <SettingsPageShell title="Connected experiences" backTo="/settings/account-centre">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Allow account linking"
          checked={allowLinking}
          onChange={setAllowLinking}
          description="Let MOxE suggest linking your account with other services you use for a connected experience."
        />
        <div className="px-4 py-3 border-b border-[#262626]">
          <p className="text-[#a8a8a8] text-sm">When on, you may see options to link accounts or use MOxE features with linked apps. You can unlink at any time.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
