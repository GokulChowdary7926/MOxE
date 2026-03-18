import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function DontTranslateSettings() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SettingsPageShell title="Don't translate" backTo="/settings/language">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Don't translate posts in this language"
          checked={enabled}
          onChange={setEnabled}
          description="When on, we won’t show automatic translations for posts in languages you’ve added here."
        />
        <div className="px-4 py-3">
          <p className="text-[#a8a8a8] text-sm">Add languages you prefer to see in their original form without translation.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
