import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function InsightsContentSharedPage() {
  return (
    <SettingsPageShell title="Content shared" backTo="/insights">
      <div className="px-4 py-6">
        <p className="text-[#a8a8a8] text-sm">See how your content is shared and remixed.</p>
      </div>
    </SettingsPageShell>
  );
}
