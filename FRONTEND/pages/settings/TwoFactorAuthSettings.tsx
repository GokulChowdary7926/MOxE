import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function TwoFactorAuthSettings() {
  const [enabled, setEnabled] = useState(false);

  return (
    <SettingsPageShell title="Two-factor authentication" backTo="/settings/account-centre">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Two-factor authentication"
          checked={enabled}
          onChange={setEnabled}
          description="Require a code from your authenticator app or phone when you log in."
        />
        <div className="px-4 py-3 border-b border-[#262626]">
          <p className="text-[#a8a8a8] text-sm">Add an extra layer of security to your MOxE account. You’ll need your password and a code from your phone or authenticator app to sign in.</p>
        </div>
        {enabled && (
          <div className="px-4 py-3 space-y-2">
            <p className="text-white text-sm font-medium">Authentication method</p>
            <label className="flex items-center gap-3 py-2">
              <input type="radio" name="mfa" defaultChecked className="accent-[#0095f6]" />
              <span className="text-white text-sm">Authenticator app</span>
            </label>
            <label className="flex items-center gap-3 py-2">
              <input type="radio" name="mfa" className="accent-[#0095f6]" />
              <span className="text-white text-sm">SMS code</span>
            </label>
          </div>
        )}
      </div>
    </SettingsPageShell>
  );
}
