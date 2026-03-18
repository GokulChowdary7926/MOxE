import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function InsightsCommunityPaymentsTermsPage() {
  return (
    <SettingsPageShell title="Community payments terms" backTo="/insights/monetisation-status">
      <div className="px-4 py-6">
        <p className="text-[#a8a8a8] text-sm mb-4">Review and resolve any violations of the Community Payments Terms to restore full monetisation access.</p>
        <div className="p-4 rounded-xl bg-[#262626]">
          <p className="text-white font-medium mb-2">Violation details</p>
          <p className="text-[#a8a8a8] text-sm">You have 1 active violation. Resolve it to continue earning with Gifts and other payout tools.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
