import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function InformationPermissionsSettings() {
  return (
    <SettingsPageShell title="Your information and permissions" backTo="/settings/account-centre/ad-preferences">
      <div className="border-t border-[#262626]">
        <Link to="/settings/account-centre/ad-preferences" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Ad preferences</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <div className="px-4 py-3 border-b border-[#262626]">
          <p className="text-white font-medium mb-1">Data used for ads</p>
          <p className="text-[#a8a8a8] text-sm">Activity on MOxE, profile info, and data from partners may be used to show you ads.</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-white font-medium mb-1">Ad topic controls</p>
          <p className="text-[#a8a8a8] text-sm">Choose topics you’re less interested in seeing in ads.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
