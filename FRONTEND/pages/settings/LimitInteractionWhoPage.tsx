import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function LimitInteractionWhoPage() {
  const [everyoneButClose, setEveryoneButClose] = useState(false);
  const [recentFollowers, setRecentFollowers] = useState(true);
  const [accountsDontFollow, setAccountsDontFollow] = useState(true);

  return (
    <SettingsPageShell title="Who to limit" backTo="/settings/limit-interactions" right={<Link to="/settings/limit-interactions" className="text-[#0095f6] font-semibold text-sm">Done</Link>}>
      <div className="px-4 py-4 space-y-0">
        <SettingsToggleRow
          label="Everyone but your close friends"
          checked={everyoneButClose}
          onChange={setEveryoneButClose}
          description="Accounts not on your Close Friends list"
        />
        <SettingsToggleRow
          label="Recent followers"
          checked={recentFollowers}
          onChange={setRecentFollowers}
          description="Accounts that started following you in the past week or after you turn this on"
        />
        <SettingsToggleRow
          label="Accounts that don't follow you"
          checked={accountsDontFollow}
          onChange={setAccountsDontFollow}
        />
      </div>
    </SettingsPageShell>
  );
}
