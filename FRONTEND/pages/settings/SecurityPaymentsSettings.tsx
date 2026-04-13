import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function SecurityPaymentsSettings() {
  const [usePin, setUsePin] = useState(false);
  const [useFaceId, setUseFaceId] = useState(false);

  return (
    <SettingsPageShell title="Security" backTo="/settings/orders-payments">
      <SettingsToggleRow
        label="Use PIN to confirm payments"
        checked={usePin}
        onChange={setUsePin}
        description="PIN will be required for some payments for additional security. If turned off, you may still need to confirm some payments."
      />
      <SettingsToggleRow
        label="Use Face ID instead of PIN"
        checked={useFaceId}
        onChange={setUseFaceId}
        description="To use Face ID with payments in another app you use with MOxE, turn it on in that app’s payment settings. You may still need a PIN enabled for MOxE Pay."
      />
    </SettingsPageShell>
  );
}
