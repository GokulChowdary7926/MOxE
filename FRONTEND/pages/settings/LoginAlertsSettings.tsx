import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function LoginAlertsSettings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  return (
    <SettingsPageShell title="Login alerts" backTo="/settings/account-centre">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Email login alerts"
          checked={emailAlerts}
          onChange={setEmailAlerts}
          description="Get an email when someone logs into your account from a new device or browser."
        />
        <SettingsToggleRow
          label="Push login alerts"
          checked={pushAlerts}
          onChange={setPushAlerts}
          description="Get a push notification when someone logs in from a new device."
        />
      </div>
    </SettingsPageShell>
  );
}
