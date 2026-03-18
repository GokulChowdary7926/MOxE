import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function SharingSettings() {
  const [storiesMentioned, setStoriesMentioned] = useState(false);
  const [storyShares, setStoryShares] = useState(false);

  return (
    <SettingsPageShell title="Sharing" backTo="/settings">
      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-2">What people can share on MOxE</p>
      <SettingsToggleRow
        label="Stories that they're mentioned in"
        checked={storiesMentioned}
        onChange={setStoriesMentioned}
        description="Allow people that you mention in a story to share it with their audience for an additional 24 hours."
      />
      <SettingsToggleRow
        label="Story shares"
        checked={storyShares}
        onChange={setStoryShares}
        description="When this is on, people can send your stories in messages."
      />
    </SettingsPageShell>
  );
}
