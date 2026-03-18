import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChevronRight, User, Settings, Radio, BarChart3, PlaySquare, MessageCircle, TrendingUp, Eye, Send, BadgeCheck } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

function Row({ to, icon: Icon, label, value, subtitle }: { to: string; icon: React.ElementType; label: string; value?: string; subtitle?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="block font-medium">{label}</span>
        {subtitle && <span className="text-[#a8a8a8] text-sm block">{subtitle}</span>}
      </div>
      {value != null && <span className="text-[#a8a8a8] text-sm">{value}</span>}
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function AccountTypeAndToolsSettings() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string; username?: string; isPrivate?: boolean } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';
  const isPrivate = currentAccount?.isPrivate ?? true;

  const accountLabel = accountType === 'PERSONAL'
    ? `Personal (${isPrivate ? 'private' : 'public'})`
    : accountType === 'CREATOR'
      ? 'Creator'
      : accountType === 'BUSINESS'
        ? 'Business'
        : accountType === 'JOB'
          ? 'Job'
          : 'Personal (private)';

  return (
    <SettingsPageShell title="Account type and tools" backTo="/settings">
      <p className="text-[#737373] text-xs font-semibold px-4 pt-4 pb-2">Your account</p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/account-type" icon={User} label="Account type" value={accountLabel} />
        <Row to="/settings/switch-professional" icon={Settings} label="Switch to professional account" />
      </div>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Your tools</p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/account-tools/live" icon={Radio} label="Live" />
      </div>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Get access to more tools</p>
      <div className="border-t border-[#262626]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
          <BarChart3 className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-white">Insights</span>
            <span className="text-[#a8a8a8] text-sm block">Available to accounts that are public</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
          <PlaySquare className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-white">Trial reels</span>
            <span className="text-[#a8a8a8] text-sm block">Available to accounts that are public</span>
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#262626]">
          <MessageCircle className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="block font-medium text-white">Channels</span>
            <span className="text-[#a8a8a8] text-sm block">Available to accounts that are public</span>
          </div>
        </div>
      </div>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">Get access to professional tools</p>
      <p className="text-[#a8a8a8] text-sm px-4 py-2">
        Switch to a <span className="text-[#0095f6]">professional account</span> for access to monetisation tools and more.
      </p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/account-tools/ads" icon={TrendingUp} label="Ad tools" />
        <Row to="/settings/account-tools/monetisation" icon={Eye} label="Monetisation" />
        <Row to="/settings/account-tools/messaging" icon={Send} label="Messaging tools" />
      </div>

      <p className="text-[#737373] text-xs font-semibold px-4 pt-6 pb-2">More options</p>
      <div className="border-t border-[#262626]">
        <Row to="/settings/request-verification" icon={BadgeCheck} label="Request verification" />
      </div>
    </SettingsPageShell>
  );
}
