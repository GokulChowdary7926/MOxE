import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function RequestApprovalPage() {
  return (
    <SettingsPageShell title="Request approval from brand partners" backTo="/insights/branded-content">
      <div className="px-4 py-6">
        <p className="text-[#a8a8a8] text-sm mb-4">Request approval from brands you work with so you can use the paid partnership label on your content.</p>
        <div className="p-4 rounded-xl bg-[#262626]">
          <p className="text-white font-medium mb-2">How it works</p>
          <p className="text-[#a8a8a8] text-sm">Send a request to your brand partner. Once they approve, you can tag them in your partnership ads and use the paid partnership label.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
