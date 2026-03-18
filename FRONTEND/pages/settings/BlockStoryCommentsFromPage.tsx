import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function BlockStoryCommentsFromPage() {
  const [blockAll, setBlockAll] = useState(false);

  return (
    <SettingsPageShell title="Block comments from" backTo="/settings/story/allow-comments">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Block story replies from people you don’t follow"
          checked={blockAll}
          onChange={setBlockAll}
          description="Only people you follow can reply to your stories."
        />
      </div>
    </SettingsPageShell>
  );
}
