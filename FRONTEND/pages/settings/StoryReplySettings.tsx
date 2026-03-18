import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection } from '../../components/layout/SettingsPageShell';

export default function StoryReplySettings() {
  const [value, setValue] = useState('on');

  return (
    <SettingsPageShell title="Story replies" backTo="/settings/messages">
      <SettingsRadioSection
        name="story-replies"
        title="Story replies"
        value={value}
        onChange={(v) => setValue(v)}
        exampleText="Someone replied to your story."
      />
    </SettingsPageShell>
  );
}
