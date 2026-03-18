import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function MessageRequestSettings() {
  const [value, setValue] = useState('on');

  return (
    <SettingsPageShell title="Message requests" backTo="/settings/messages">
      <SettingsRadioSection
        name="message-requests"
        title="Message requests"
        value={value}
        onChange={(v) => setValue(v)}
        exampleText="Someone sent you a message request."
      />
    </SettingsPageShell>
  );
}
