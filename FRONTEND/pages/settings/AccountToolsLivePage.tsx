import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function AccountToolsLivePage() {
  return (
    <SettingsPageShell title="Live" backTo="/settings/account-type-tools">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Settings and tools for going live on MOxE.</p>
        <Link to="/create" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Go live</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
