import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function AppsAndWebsitesPage() {
  return (
    <SettingsPageShell title="Apps and websites" backTo="/settings/app-website-permissions">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Apps and websites you’ve logged into with MOxE. Remove any you don’t use.</p>
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 text-center">
          <p className="text-white text-sm font-medium">No active apps or websites</p>
          <p className="text-[#737373] text-xs mt-1">You haven’t connected any apps or websites to MOxE.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
