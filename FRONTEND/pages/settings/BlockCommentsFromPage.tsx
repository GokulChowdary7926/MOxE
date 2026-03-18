import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function BlockCommentsFromPage() {
  const [blockAll, setBlockAll] = useState(false);

  return (
    <SettingsPageShell title="Block comments from" backTo="/settings/comments">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Block comments from people you don’t follow"
          checked={blockAll}
          onChange={setBlockAll}
          description="Only people you follow can comment on your posts."
        />
      </div>
    </SettingsPageShell>
  );
}
