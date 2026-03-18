import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function PayoutSettingsPage() {
  return (
    <SettingsPageShell title="Payout settings" backTo="/payouts">
      <div className="border-t border-[#262626]">
        <Link to="/payouts/setup" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Payout account</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/payouts/setup/tax" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Tax information</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
