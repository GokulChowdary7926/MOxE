import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function MessageLinksPage() {
  const [allowLinks, setAllowLinks] = useState(true);

  return (
    <SettingsPageShell title="Message links" backTo="/settings/app-website-permissions">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Allow link previews in messages"
          checked={allowLinks}
          onChange={setAllowLinks}
          description="Show previews when you or others share links in chats."
        />
      </div>
    </SettingsPageShell>
  );
}
