import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function LikeShareCountsSettings() {
  const [hideLikes, setHideLikes] = useState(false);
  const [hideCounts, setHideCounts] = useState(false);

  return (
    <SettingsPageShell title="Like and share counts" backTo="/settings">
      <SettingsToggleRow
        label="Hide like and share counts"
        checked={hideCounts}
        onChange={setHideCounts}
        description="You won't see like and share counts on posts. Your posts won't show like or share counts to others."
      />
      <SettingsToggleRow
        label="Hide like count on your posts"
        checked={hideLikes}
        onChange={setHideLikes}
        description="Only you will see the like count on your posts."
      />
    </SettingsPageShell>
  );
}
