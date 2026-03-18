import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function SpotifyPage() {
  const [connected, setConnected] = useState(false);

  return (
    <SettingsPageShell title="Spotify" backTo="/settings/app-website-permissions">
      <div className="px-4 py-4">
        <SettingsToggleRow
          label="Share what you’re listening to"
          checked={connected}
          onChange={setConnected}
          description="Connect Spotify to show your current track on your profile and in stories."
        />
      </div>
    </SettingsPageShell>
  );
}
