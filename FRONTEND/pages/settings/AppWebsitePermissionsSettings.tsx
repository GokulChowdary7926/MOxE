import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function AppWebsitePermissionsSettings() {
  return (
    <SettingsPageShell title="App website permissions" backTo="/settings">
      <div className="border-t border-[#262626]">
        <Link to="/settings/app-website-permissions/apps" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Apps and websites</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/app-website-permissions/message-links" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Message links</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/app-website-permissions/spotify" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Spotify</span>
          <span className="flex items-center gap-1 text-[#a8a8a8] text-sm">Unlink<ChevronRight className="w-5 h-5 text-[#737373]" /></span>
        </Link>
      </div>
    </SettingsPageShell>
  );
}
