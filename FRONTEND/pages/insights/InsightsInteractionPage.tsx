import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function InsightsInteractionPage() {
  return (
    <SettingsPageShell title="Interaction" backTo="/insights">
      <div className="px-4 py-6">
        <p className="text-[#a8a8a8] text-sm">See how people interact with your content — likes, comments, shares and saves.</p>
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-[#262626]">
            <p className="text-white font-medium">Profile visits</p>
            <p className="text-2xl font-bold text-white mt-1">—</p>
            <p className="text-[#a8a8a8] text-sm">Last 30 days</p>
          </div>
          <div className="p-4 rounded-xl bg-[#262626]">
            <p className="text-white font-medium">Likes</p>
            <p className="text-2xl font-bold text-white mt-1">—</p>
            <p className="text-[#a8a8a8] text-sm">Last 30 days</p>
          </div>
        </div>
      </div>
    </SettingsPageShell>
  );
}
