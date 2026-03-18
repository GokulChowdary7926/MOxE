import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { FileCheck } from 'lucide-react';

export default function SetUpPayoutAccountPage() {
  return (
    <SettingsPageShell title="Set up payout account" backTo="/payouts">
      <div className="px-4 py-4">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= 2 ? 'bg-gradient-to-r from-orange-500 to-pink-500' : 'bg-[#262626]'}`} />
          ))}
        </div>
        <div className="flex flex-col items-center py-6">
          <div className="w-24 h-24 rounded-2xl bg-[#262626] flex items-center justify-center mb-4">
            <FileCheck className="w-12 h-12 text-[#0095f6]" />
          </div>
          <h2 className="text-white font-bold text-xl text-center mb-2">Add your tax info</h2>
          <p className="text-[#a8a8a8] text-sm text-center mb-6">This info is required for tax reporting and should match your most recent tax return.</p>
          <Link to="/payouts/setup/tax" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-center">Add tax info</Link>
          <p className="text-[#a8a8a8] text-xs text-center mt-4 px-4">You&apos;ll be redirected to a third-party tax website for adding your tax info. By tapping Add tax info, you agree that your information will be shared with our service providers in accordance with our <Link to="/settings/help" className="text-[#0095f6]">Data Policy</Link> so that they can conduct data processing activities strictly in accordance with their roles as service providers.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
