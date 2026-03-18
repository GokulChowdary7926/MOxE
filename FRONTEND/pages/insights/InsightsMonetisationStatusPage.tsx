import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Check, X, ChevronRight } from 'lucide-react';

const TOOLS = [
  { name: 'Branded content', status: 'ok', subtitle: null },
  { name: 'Gifts', status: 'disabled', subtitle: 'Disabled until payout account is set up' },
];

const VIOLATIONS = [
  { name: 'Partner Monetisation Policies', count: 0 },
  { name: 'Content Monetisation Policies', count: 0 },
  { name: 'Community Standards', count: 0 },
  { name: 'Community Payments Terms', count: 1, highlight: true },
];

export default function InsightsMonetisationStatusPage() {
  return (
    <SettingsPageShell title="Monetisation status" backTo="/insights">
      <div className="px-4 py-6 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full border-2 border-transparent bg-gradient-to-r from-orange-500 to-pink-500 p-[2px] mb-4">
          <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
            <X className="w-10 h-10 text-red-500" />
          </div>
        </div>
        <h2 className="text-white font-bold text-lg text-center mb-2">You&apos;re not able to monetise with some of your tools</h2>
        <p className="text-[#a8a8a8] text-sm text-center mb-6">You&apos;ll need to resolve your policy violations in order to continue earning with all of your eligible tools.</p>

        <div className="w-full space-y-3 mb-8">
          {TOOLS.map((t) => {
            const content = (
              <>
                <div className="w-10 h-10 rounded-lg bg-[#363636] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium">{t.name}</p>
                  {t.subtitle && <p className="text-[#a8a8a8] text-sm">{t.subtitle}</p>}
                </div>
                {t.status === 'ok' ? <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <X className="w-5 h-5 text-red-500 flex-shrink-0" />}
              </>
            );
            return t.name === 'Gifts' ? (
              <Link key={t.name} to="/insights/gifts" className="flex items-center gap-3 p-3 rounded-xl bg-[#262626] active:bg-white/5">
                {content}
              </Link>
            ) : (
              <div key={t.name} className="flex items-center gap-3 p-3 rounded-xl bg-[#262626]">
                {content}
              </div>
            );
          })}
        </div>

        <h3 className="text-white font-semibold w-full mb-3">Current policy violations</h3>
        <div className="w-full space-y-0 border rounded-xl border-[#262626] overflow-hidden">
          {VIOLATIONS.map((v) => (
            <Link key={v.name} to={v.count > 0 ? `/insights/community-payments-terms` : '#'} className="flex items-center justify-between px-4 py-3 border-b border-[#262626] last:border-b-0 text-white active:bg-white/5">
              <span className="flex items-center gap-2">
                {v.highlight && <span className="w-2 h-2 rounded-full bg-[#0095f6]" />}
                {v.name}
              </span>
              <span className="text-[#a8a8a8]">{v.count}</span>
              <ChevronRight className="w-5 h-5 text-[#737373]" />
            </Link>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
