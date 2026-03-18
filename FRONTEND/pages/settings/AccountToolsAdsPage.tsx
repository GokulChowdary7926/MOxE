import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function AccountToolsAdsPage() {
  return (
    <SettingsPageShell title="Ad tools" backTo="/settings/account-type-tools">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Create and manage ads, and view performance.</p>
        <Link to="/ads/tools" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Ad tools</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
