import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function StoryLiveLocationSettings() {
  const hideCount = 0;

  return (
    <SettingsPageShell title="Story, live and location" backTo="/settings">
      <Link to="/settings/story/hide-from" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <div>
          <p className="font-medium">Hide story and live from</p>
          <p className="text-[#a8a8a8] text-sm">Hide your story and live videos from specific people.</p>
        </div>
        <span className="flex items-center gap-1 text-[#a8a8a8]">{hideCount}<ChevronRight className="w-5 h-5" /></span>
      </Link>
      <Link to="/settings/map/who-can-see-location" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <div>
          <p className="font-medium">Location sharing</p>
          <p className="text-[#a8a8a8] text-sm">MOxE map</p>
        </div>
        <ChevronRight className="w-5 h-5 text-[#737373]" />
      </Link>
    </SettingsPageShell>
  );
}
