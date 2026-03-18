import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function FacebookCreatorsPage() {
  return (
    <SettingsPageShell title="Facebook for creators" backTo="/settings/helpful-resources">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Resources and tools for creators across Meta apps.</p>
        <Link to="#" className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#262626] border border-[#363636] text-white active:bg-white/5">
          <span className="font-medium">Visit Facebook for Creators</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
