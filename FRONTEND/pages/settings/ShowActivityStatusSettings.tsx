import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ShowActivityStatusSettings() {
  const [on, setOn] = useState(true);

  return (
    <SettingsPageShell title="Show activity status" backTo="/settings/messages">
      <SettingsToggleRow
        label="Show activity status"
        checked={on}
        onChange={setOn}
        description="Let your followers see when you were last active on MOxE."
      />
    </SettingsPageShell>
  );
}
