import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { ChevronRight, Check } from 'lucide-react';

export default function InsightsBrandedContentPage() {
  const [manualApprove, setManualApprove] = useState(false);

  return (
    <SettingsPageShell title="Branded content" backTo="/insights">
      <div className="px-4 py-4">
        <p className="text-[#737373] text-xs font-semibold pb-2">Status</p>
        <Link to="/insights/branded-content/status" className="flex items-center gap-3 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-white" /></span>
          <div className="flex-1">
            <p className="font-medium">Eligible</p>
            <p className="text-[#a8a8a8] text-sm">You can use the paid partnership label.</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>

        <p className="text-white font-semibold mt-6 mb-2">Paid partnership label</p>
        <div className="border-t border-[#262626]">
          <Link to="/insights/branded-content/request-approval" className="flex items-center gap-3 px-0 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <span className="flex-1 font-medium">Request approval from brand partners</span>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
          <div className="px-0 py-2">
            <SettingsToggleRow
              label="Manually approve content creators"
              checked={manualApprove}
              onChange={setManualApprove}
              description="When this is on, only content creators that you approve can add you to branded content that they share."
            />
          </div>
          <Link to="/insights/branded-content/approve-creators" className="flex items-center gap-3 px-0 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <span className="flex-1 font-medium">Approve content creators</span>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
        </div>

        <p className="text-white font-semibold mt-6 mb-2">Support</p>
        <Link to="/settings/help" className="flex items-center gap-3 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="flex-1 font-medium">Learn more</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
