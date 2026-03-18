import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ShowReadReceiptSetting() {
  const [on, setOn] = useState(true);

  return (
    <SettingsPageShell title="Show read receipts" backTo="/settings/messages">
      <SettingsToggleRow
        label="Show read receipts"
        checked={on}
        onChange={setOn}
        description="Let people see when you've read their messages."
      />
    </SettingsPageShell>
  );
}
