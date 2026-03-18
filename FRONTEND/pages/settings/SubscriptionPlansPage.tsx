import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { Check, X, Info } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Avatar } from '../../components/ui/Avatar';

const STANDARD_BENEFITS = [
  { label: 'Verified badge', included: true },
  { label: 'Search optimisation', category: 'Maximise discovery', included: true },
  { label: 'Upgraded profile links', category: 'Drive engagement', included: true },
  { label: 'Exclusive stickers', category: 'Drive engagement', included: true },
  { label: 'Impersonation protection', category: 'Protect your brand', included: true },
  { label: 'Enhanced support', category: 'Protect your brand', included: true, sub: 'Chat or email with agents' },
  { label: 'Featured profile', category: 'Protect your brand', included: false },
];

const PLUS_BENEFITS = [
  { label: 'Verified badge', included: true },
  { label: 'Search optimisation', category: 'Maximise discovery', included: true },
  { label: 'Featured profile', category: 'Maximise discovery', included: true },
  { label: 'Add links to reels', category: 'Maximise discovery', included: true, sub: '2 per month' },
  { label: 'Upgraded profile links', category: 'Drive engagement', included: true },
  { label: 'Exclusive stickers', category: 'Drive engagement', included: true },
  { label: 'Impersonation protection', category: 'Protect your brand', included: true },
];

function PlanCard({
  title,
  firstMonthPrice,
  regularPrice,
  recommended,
  benefits,
  selected,
  onSelect,
}: {
  title: string;
  firstMonthPrice: string;
  regularPrice: string;
  recommended?: boolean;
  benefits: { label: string; category?: string; included: boolean; sub?: string }[];
  selected: boolean;
  onSelect: () => void;
}) {
  let lastCategory = '';
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 mb-4 transition-colors ${selected ? 'border-[#0095f6] bg-[#0095f6]/10' : 'border-[#262626] bg-[#262626]'}`}
    >
      <p className="text-white font-bold text-lg">{title}</p>
      <p className="text-emerald-400 font-semibold mt-1">{firstMonthPrice}</p>
      <p className="text-[#a8a8a8] text-sm line-through">{regularPrice}</p>
      <p className="text-[#a8a8a8] text-xs mt-1 flex items-center gap-1">
        <Info className="w-3.5 h-3.5" />
        Trial benefit. <span className="text-[#0095f6]">Learn more</span>
      </p>
      {recommended && (
        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#0095f6] text-white text-xs font-semibold">Recommended</span>
      )}
      <div className="mt-3 space-y-2">
        {benefits.map((b) => {
          const showCategory = b.category && b.category !== lastCategory;
          if (b.category) lastCategory = b.category;
          return (
            <div key={b.label}>
              {showCategory && <p className="text-white font-semibold text-sm mt-2 first:mt-0">{b.category}</p>}
              <div className="flex items-center gap-2">
                {b.included ? <Check className="w-4 h-4 text-white flex-shrink-0" /> : <X className="w-4 h-4 text-[#737373] flex-shrink-0" />}
                <span className={b.included ? 'text-white text-sm' : 'text-[#737373] text-sm'}>{b.label}</span>
              </div>
              {b.sub && <p className="text-emerald-400 text-xs ml-6">{b.sub}</p>}
            </div>
          );
        })}
      </div>
    </button>
  );
}

export default function SubscriptionPlansPage() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string; username?: string; profilePhoto?: string | null } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';
  const username = currentAccount?.username ?? 'username';
  const profilePhoto = currentAccount?.profilePhoto;

  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'plus'>('standard');

  const isProfessional = accountType === 'CREATOR' || accountType === 'BUSINESS' || accountType === 'JOB';
  const firstMonthStandard = isProfessional ? '₹99' : '₹45';
  const firstMonthPlus = isProfessional ? '₹199' : '₹95';
  const regularStandard = isProfessional ? '₹799.00/month per profile' : '₹639.00/month per profile';
  const regularPlus = isProfessional ? '₹1,599.00/month per profile' : '₹1,399.00/month per profile';

  return (
    <SettingsPageShell title="MOxE Verified" backTo="/settings/subscriptions">
      <div className="px-4 py-4">
        <p className="text-white font-semibold text-lg text-center mb-2">Starting at just {firstMonthStandard} for your first month</p>
        <div className="flex flex-col items-center mb-4">
          <Avatar uri={profilePhoto} className="w-16 h-16 rounded-full border-2 border-[#262626] mb-2" />
          <p className="text-white font-medium flex items-center gap-1">
            {username}
            <span className="w-5 h-5 rounded-full bg-[#0095f6] flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </span>
          </p>
          <p className="text-[#a8a8a8] text-xs mt-1">Others already have a verified badge.</p>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          <div className="flex-shrink-0 w-[280px]">
            <PlanCard
              title="Standard"
              firstMonthPrice={`${firstMonthStandard} for your first month`}
              regularPrice={regularStandard}
              recommended
              benefits={STANDARD_BENEFITS}
              selected={selectedPlan === 'standard'}
              onSelect={() => setSelectedPlan('standard')}
            />
          </div>
          <div className="flex-shrink-0 w-[280px]">
            <PlanCard
              title="Plus"
              firstMonthPrice={`${firstMonthPlus} for your first month`}
              regularPrice={regularPlus}
              benefits={PLUS_BENEFITS}
              selected={selectedPlan === 'plus'}
              onSelect={() => setSelectedPlan('plus')}
            />
          </div>
        </div>

        <p className="text-[#737373] text-xs text-center mb-4">MOxE Verified is available for people aged 18+.</p>
        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold">Unlock benefits</button>
      </div>
    </SettingsPageShell>
  );
}
