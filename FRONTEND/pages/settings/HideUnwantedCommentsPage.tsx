import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function HideUnwantedCommentsPage() {
  const [hideOffensive, setHideOffensive] = useState(true);

  return (
    <SettingsPageShell title="Hide unwanted comments" backTo="/settings/comments">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Hide offensive comments"
          checked={hideOffensive}
          onChange={setHideOffensive}
          description="We’ll automatically hide comments that may be offensive or spam."
        />
      </div>
    </SettingsPageShell>
  );
}
