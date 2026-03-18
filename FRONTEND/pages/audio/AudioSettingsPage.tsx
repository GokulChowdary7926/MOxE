import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function AudioSettingsPage() {
  const [autoPlay, setAutoPlay] = useState(true);

  return (
    <SettingsPageShell title="Audio" backTo="/settings">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Auto-play with sound"
          checked={autoPlay}
          onChange={setAutoPlay}
          description="Videos and reels may play with sound when you scroll (where supported)."
        />
        <Link to="/audio/trending" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Trending audio</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
