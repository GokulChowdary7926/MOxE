import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function ContentPreferencesSettings() {
  return (
    <SettingsPageShell title="Content preferences" backTo="/settings">
      <div className="border-t border-[#262626]">
        <Link to="/settings/content-preferences/sensitive" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Sensitive content control</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/content-preferences/political" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Political content</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/content-preferences/not-interested" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Not interested</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/content-preferences/interested" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Interested</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
