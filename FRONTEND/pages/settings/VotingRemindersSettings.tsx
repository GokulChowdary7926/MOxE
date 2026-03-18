import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function VotingRemindersSettings() {
  const [on, setOn] = useState(false);

  return (
    <SettingsPageShell title="Voting reminders" backTo="/settings/notifications">
      <SettingsToggleRow
        label="Voting reminders"
        checked={on}
        onChange={setOn}
        description="Stay updated with Meta's alerts on voter registration and elections in your area."
      />
    </SettingsPageShell>
  );
}
