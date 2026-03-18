import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';

export default function BoostInterestsPage() {
  return (
    <SettingsPageShell title="Interests" backTo="/boost/create-audience" right={<button type="button" className="text-[#0095f6] font-medium text-sm">Done</button>}>
      <div className="px-4 py-4">
        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-white">N/A</p>
          <p className="text-[#a8a8a8] text-sm flex items-center justify-center gap-1">Estimated audience size <span className="text-[#737373]">ⓘ</span></p>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input type="text" placeholder="Interests" className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
        <p className="text-[#a8a8a8] text-sm">We suggest adding a broad range of interests to cover the largest audience.</p>
      </div>
    </SettingsPageShell>
  );
}
