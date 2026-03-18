import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function CallsSettings() {
  const [calls, setCalls] = useState<'off' | 'on'>('on');

  return (
    <SettingsPageShell title="Calls" backTo="/settings/notifications">
      <SettingsRadioSection
        name="calls"
        title="Call notifications"
        value={calls}
        onChange={(v) => setCalls(v as 'off' | 'on')}
        exampleText="Someone is calling you on MOxE."
      />
    </SettingsPageShell>
  );
}
