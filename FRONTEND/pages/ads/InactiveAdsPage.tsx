import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function InactiveAdsPage() {
  return (
    <SettingsPageShell title="Inactive ads" backTo="/ads/partnership">
      <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
        <p className="text-[#a8a8a8] text-sm text-center">Your inactive partnership ads will appear here.</p>
      </div>
    </SettingsPageShell>
  );
}
