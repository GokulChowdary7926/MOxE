import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight, X, DollarSign, BookOpen } from 'lucide-react';

export default function GiftsPage() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';
  const isEligible = false; // could come from API based on account

  return (
    <SettingsPageShell title="Gifts" backTo="/insights/monetisation-status">
      <div className="px-4 py-4">
        {!isEligible && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white flex-shrink-0"><X className="w-4 h-4" /></span>
            <div>
              <p className="text-white font-medium">You&apos;re no longer eligible for monetisation.</p>
              <Link to="/insights/monetisation-status" className="text-[#0095f6] text-sm font-semibold mt-1 inline-block">Check eligibility status</Link>
            </div>
          </div>
        )}
        <p className="text-[#737373] text-xs font-semibold pb-2">Status</p>
        <div className="flex items-center gap-3 py-3 border-b border-[#262626]">
          <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-white" /></span>
          <span className="text-white font-medium">Ineligible</span>
        </div>
        <p className="text-[#737373] text-xs font-semibold pt-6 pb-2">Manage</p>
        <Link to="/payouts" className="flex items-center gap-3 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="flex-1 font-medium">Payout account</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <p className="text-[#737373] text-xs font-semibold pt-6 pb-2">Insights</p>
        <Link to="/payouts/gifts/earnings" className="flex items-center justify-between py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium flex items-center gap-2"><DollarSign className="w-5 h-5 text-[#a8a8a8]" /> Approximate earnings</span>
          <span className="text-[#a8a8a8]">$0.00</span>
          <ChevronRight className="w-5 h-5 text-[#737373] ml-2" />
        </Link>
        <p className="text-[#737373] text-xs font-semibold pt-6 pb-2">Tips and resources</p>
        <Link to="/settings/helpful-resources" className="flex items-center gap-3 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <BookOpen className="w-5 h-5 text-[#a8a8a8]" />
          <span className="flex-1 font-medium">Learn more</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
