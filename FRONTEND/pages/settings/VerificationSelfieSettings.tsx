import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function VerificationSelfieSettings() {
  return (
    <SettingsPageShell title="Verification selfie" backTo="/settings/account-centre">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">To verify your identity, we may ask you to take a selfie. We use this only to confirm it’s you and don’t store it for recognition.</p>
        <button type="button" className="w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm">
          Start verification
        </button>
      </div>
    </SettingsPageShell>
  );
}
