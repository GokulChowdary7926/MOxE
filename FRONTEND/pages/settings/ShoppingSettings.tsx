import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ShoppingSettings() {
  const [accountsYouFollow, setAccountsYouFollow] = useState(false);
  const [suggestedForYou, setSuggestedForYou] = useState(false);

  return (
    <SettingsPageShell title="Shopping" backTo="/settings/notifications">
      <SettingsToggleRow
        label="Accounts that you follow"
        checked={accountsYouFollow}
        onChange={setAccountsYouFollow}
        description="Be notified when accounts that you follow add new products to their shops."
      />
      <SettingsToggleRow
        label="Suggested for you"
        checked={suggestedForYou}
        onChange={setSuggestedForYou}
        description="Be notified about products and shops you may like based on your activity on MOxE. If you've set up your Accounts Centre with Facebook, it will also be based on your activity on Facebook."
      />
    </SettingsPageShell>
  );
}
