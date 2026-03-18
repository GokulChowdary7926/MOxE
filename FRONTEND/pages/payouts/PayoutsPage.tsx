import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { HelpCircle, Settings, Info, Download } from 'lucide-react';

export default function PayoutsPage() {
  const [tab, setTab] = useState<'overview' | 'transactions' | 'tax'>('overview');

  return (
    <SettingsPageShell
      title="Payouts"
      backTo="/insights/monetisation-status"
      right={
        <div className="flex items-center gap-2">
          <Link to="/settings/help" className="p-1 text-white" aria-label="Help"><HelpCircle className="w-5 h-5" /></Link>
          <Link to="/payouts/settings" className="p-1 text-white" aria-label="Settings"><Settings className="w-5 h-5" /></Link>
        </div>
      }
    >
      <div className="flex border-b border-[#262626]">
        {(['overview', 'transactions', 'tax'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-semibold capitalize ${tab === t ? 'bg-white text-black' : 'text-white'}`}>
            {t === 'tax' ? 'Tax forms' : t === 'overview' ? 'Overview' : 'Transactions'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="px-4 py-4 space-y-4">
          <div className="p-4 rounded-xl bg-[#262626] border border-[#363636]">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center flex-shrink-0 relative">
                <span className="text-white text-xl">🏦</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs">!</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">Your earnings of $0 have expired on July 21.</p>
                <p className="text-[#a8a8a8] text-sm mt-1">To start earning again and get paid, you&apos;ll need to complete setting up your payout account.</p>
                <p className="text-[#a8a8a8] text-xs mt-2">5 of 6 steps complete.</p>
                <Link to="/payouts/setup" className="inline-block mt-3 py-2.5 px-4 rounded-lg bg-[#0095f6] text-white font-semibold text-sm">Continue</Link>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-[#262626]">
            <p className="text-white font-semibold flex items-center gap-1">On the way <Info className="w-4 h-4 text-[#737373]" /></p>
            <p className="text-2xl font-bold text-white mt-1">$--.--</p>
            <p className="text-[#a8a8a8] text-sm mt-1">Minimum earnings $25.00 is required.</p>
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">!</span>
            <div>
              <p className="text-white text-sm">Your earnings expired, but you can complete setting up gifts to earn again.</p>
              <Link to="/payouts/setup" className="text-[#0095f6] text-sm font-semibold mt-1 inline-block">Finish setup</Link>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <button type="button" className="text-white text-sm flex items-center gap-1">All <span className="text-xs">▼</span></button>
            <button type="button" className="text-[#0095f6] text-sm font-medium flex items-center gap-1"><Download className="w-4 h-4" /> Download</button>
          </div>
          <div className="py-12 text-center">
            <p className="text-[#737373] text-sm">No transactions yet.</p>
          </div>
        </div>
      )}

      {tab === 'tax' && (
        <div className="px-4 py-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 mb-4">
            <span className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold flex-shrink-0">!</span>
            <div>
              <p className="text-white text-sm">Your earnings expired, but you can complete setting up gifts to earn again.</p>
              <Link to="/payouts/setup" className="text-[#0095f6] text-sm font-semibold mt-1 inline-block">Finish setup</Link>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <button type="button" className="px-3 py-1.5 rounded-lg bg-[#262626] text-white text-sm">2025 <span className="text-xs">▼</span></button>
          </div>
          <p className="text-[#a8a8a8] text-sm mb-6">No forms available.</p>
          <p className="text-white font-semibold mb-2">Paperless setting</p>
          <Link to="/payouts/tax/paperless" className="flex items-center justify-between py-3 border-b border-[#262626] text-white active:bg-white/5">
            <div className="text-left">
              <p className="font-medium">Paperless delivery</p>
              <p className="text-[#a8a8a8] text-sm">We&apos;ll send an email when your tax forms are available.</p>
            </div>
            <span className="text-[#a8a8a8] text-sm">On ›</span>
          </Link>
        </div>
      )}
    </SettingsPageShell>
  );
}
