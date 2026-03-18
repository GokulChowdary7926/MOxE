import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function ApproximateEarningsPage() {
  return (
    <SettingsPageShell title="Approximate earnings" backTo="/insights/gifts">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Estimated earnings from gifts. Payouts may take a few days to process.</p>
        <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 text-center">
          <p className="text-[#737373] text-sm">$0.00</p>
          <p className="text-white font-medium text-lg mt-1">This period</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
