import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ActivityInFriendsTabSettings() {
  const [show, setShow] = useState(true);

  return (
    <SettingsPageShell title="Activity in Friends tab" backTo="/settings">
      <SettingsToggleRow
        label="Show activity status"
        checked={show}
        onChange={setShow}
        description="Let your followers see when you were last active on MOxE."
      />
    </SettingsPageShell>
  );
}
