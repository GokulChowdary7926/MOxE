import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchMe } from '../../store/authSlice';
import { setCurrentAccount } from '../../store/accountSlice';
import { getApiBase, getToken } from '../../services/api';
import { Check, X, Info } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Avatar } from '../../components/ui/Avatar';

/** Backend subscription tiers (matches Prisma enum). */
type BackendTier = 'FREE' | 'STAR' | 'THICK';

/** Effective tier key for /api/subscription/upgrade */
type EffectiveTierKey = 'PERSONAL_STAR' | 'BUSINESS_PAID' | 'CREATOR_PAID' | 'JOB_PAID';

/** Account type for display (MOxE guide). */
type AccountType = 'PERSONAL' | 'BUSINESS' | 'CREATOR' | 'JOB';

interface TierInfo {
  id: BackendTier;
  /** Effective tier for API upgrade (e.g. PERSONAL_STAR, BUSINESS_PAID) */
  targetTier?: EffectiveTierKey;
  name: string;
  price: string;
  priceYear?: string;
  features: { label: string; included: boolean }[];
  badge?: 'blue' | 'purple' | null;
}

const ACCOUNT_LABELS: Record<AccountType, string> = {
  PERSONAL: 'Personal',
  BUSINESS: 'Business',
  CREATOR: 'Creator',
  JOB: 'Job',
};

/** Tiers we can upgrade to, by account type. Personal → STAR; Business/Creator → THICK; Job → THICK (backend has no JOB tier). */
const UPGRADE_TIERS: Record<AccountType, TierInfo[]> = {
  PERSONAL: [
    {
      id: 'FREE',
      name: 'Free',
      price: '$0',
      features: [
        { label: 'Core social features', included: true },
        { label: 'Ads in feed & stories', included: true },
        { label: '1 GB cloud storage', included: true },
        { label: 'Profile visitors', included: false },
        { label: 'Anonymous story viewing', included: false },
        { label: 'Ad-free', included: false },
      ],
    },
    {
      id: 'STAR',
      targetTier: 'PERSONAL_STAR',
      name: 'Star',
      price: '$1/month',
      priceYear: '$11/year',
      features: [
        { label: 'Ad-free', included: true },
        { label: 'Profile visitors', included: true },
        { label: '2 anonymous story views/day', included: true },
        { label: 'Download protection', included: true },
        { label: 'Voice commands', included: true },
        { label: '5 GB cloud storage', included: true },
      ],
    },
  ],
  BUSINESS: [
    {
      id: 'FREE',
      name: 'Business Free',
      price: '$0',
      features: [
        { label: 'Business profile, 50 products', included: true },
        { label: 'Basic analytics', included: true },
        { label: 'Ads in experience', included: true },
        { label: 'Blue verification badge', included: false },
        { label: 'Advanced analytics', included: false },
        { label: 'Live shopping', included: false },
      ],
    },
    {
      id: 'THICK',
      targetTier: 'BUSINESS_PAID',
      name: 'Business Paid',
      price: '$5/month',
      priceYear: '$55/year',
      badge: 'blue',
      features: [
        { label: 'Blue verification badge', included: true },
        { label: 'Advanced analytics', included: true },
        { label: 'Unlimited products, live shopping', included: true },
        { label: 'Team management (5 members)', included: true },
        { label: 'Ad-free', included: true },
      ],
    },
  ],
  CREATOR: [
    {
      id: 'FREE',
      name: 'Creator Free',
      price: '$0',
      features: [
        { label: 'Creator profile, basic tools', included: true },
        { label: 'Basic insights (7 days)', included: true },
        { label: 'Ads in experience', included: true },
        { label: 'Subscriptions & gifts', included: false },
        { label: 'Blue verification badge', included: false },
        { label: 'Content scheduling', included: false },
      ],
    },
    {
      id: 'THICK',
      targetTier: 'CREATOR_PAID',
      name: 'Creator Paid',
      price: '$5/month',
      priceYear: '$55/year',
      badge: 'blue',
      features: [
        { label: 'Blue verification badge', included: true },
        { label: 'Subscriptions, badges, gifts', included: true },
        { label: 'Content scheduling & calendar', included: true },
        { label: 'Advanced insights', included: true },
        { label: 'Ad-free', included: true },
      ],
    },
  ],
  JOB: [
    {
      id: 'FREE',
      name: 'Job (Free tier)',
      price: '$0',
      features: [
        { label: 'Limited job tools', included: true },
        { label: 'Purple badge', included: false },
        { label: 'Full 24 job tools', included: false },
        { label: '10 GB storage', included: false },
      ],
    },
    {
      id: 'THICK',
      targetTier: 'JOB_PAID',
      name: 'Job Paid',
      price: '$10/month',
      priceYear: '$110/year',
      badge: 'purple',
      features: [
        { label: 'Purple verification badge', included: true },
        { label: 'All 24 professional tools', included: true },
        { label: '10 GB cloud storage', included: true },
        { label: 'Priority support', included: true },
      ],
    },
  ],
};

function PlanCard({
  tier,
  currentTier,
  onUpgrade,
  isUpgrading,
  upgradeError,
}: {
  tier: TierInfo;
  currentTier: string;
  onUpgrade: () => void;
  isUpgrading: boolean;
  upgradeError: string | null;
}) {
  const isCurrent = (currentTier || 'FREE').toUpperCase() === tier.id;
  const canUpgrade = !isCurrent && tier.id !== 'FREE';

  return (
    <div
      className={`w-full text-left rounded-xl border-2 p-4 mb-4 transition-colors ${
        isCurrent ? 'border-[#0095f6] bg-[#0095f6]/10' : 'border-[#262626] bg-[#262626]'
      }`}
    >
      <p className="text-white font-bold text-lg">{tier.name}</p>
      <p className="text-emerald-400 font-semibold mt-1">{tier.price}</p>
      {tier.priceYear && <p className="text-[#a8a8a8] text-sm">or {tier.priceYear}</p>}
      {tier.badge && (
        <p className="text-[#a8a8a8] text-xs mt-1 flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          <span className={tier.badge === 'purple' ? 'text-purple-400' : 'text-blue-400'}>
            {tier.badge === 'purple' ? 'Purple' : 'Blue'} verification badge
          </span>
        </p>
      )}
      {isCurrent && (
        <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#36B37E] text-white text-xs font-semibold">Current plan</span>
      )}
      <div className="mt-3 space-y-2">
        {tier.features.map((f) => (
          <div key={f.label} className="flex items-center gap-2">
            {f.included ? <Check className="w-4 h-4 text-white flex-shrink-0" /> : <X className="w-4 h-4 text-[#737373] flex-shrink-0" />}
            <span className={f.included ? 'text-white text-sm' : 'text-[#737373] text-sm'}>{f.label}</span>
          </div>
        ))}
      </div>
      {canUpgrade && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onUpgrade}
            disabled={isUpgrading}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold disabled:opacity-50"
          >
            {isUpgrading ? 'Upgrading…' : 'Subscribe / Upgrade'}
          </button>
          {upgradeError && <p className="text-red-400 text-sm mt-2">{upgradeError}</p>}
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPlansPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as {
    id?: string;
    accountType?: string;
    subscriptionTier?: string;
    username?: string;
    profilePhoto?: string | null;
  } | null;

  const accountType = ((currentAccount?.accountType ?? 'PERSONAL') as string).toUpperCase() as AccountType;
  const subscriptionTier = (currentAccount?.subscriptionTier ?? 'FREE') as BackendTier;
  const accountId = currentAccount?.id;
  const username = currentAccount?.username ?? 'username';
  const profilePhoto = currentAccount?.profilePhoto;

  const [upgradeTier, setUpgradeTier] = useState<BackendTier | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const tiers = useMemo(() => UPGRADE_TIERS[accountType] ?? UPGRADE_TIERS.PERSONAL, [accountType]);

  const handleUpgrade = async (tier: BackendTier, targetTierKey?: EffectiveTierKey) => {
    if (!accountId || tier === 'FREE') return;
    setUpgradeTier(tier);
    setUpgradeError(null);
    const base = getApiBase();
    const token = getToken();
    try {
      if (targetTierKey) {
        const res = await fetch(`${base}/subscription/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ targetTier: targetTierKey }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUpgradeError((data as { error?: string }).error ?? 'Upgrade failed. Please try again.');
          setUpgradeTier(null);
          return;
        }
        const payload = data as { account?: Record<string, unknown> };
        if (payload.account) {
          dispatch(setCurrentAccount(payload.account));
        } else {
          const me = await dispatch(fetchMe()).unwrap();
          dispatch(setCurrentAccount({ ...me.account, capabilities: me.capabilities }));
        }
      } else {
        const res = await fetch(`${base}/accounts/${accountId}/upgrade`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setUpgradeError((data as { error?: string }).error ?? 'Upgrade failed. Please try again.');
          setUpgradeTier(null);
          return;
        }
        const me = await dispatch(fetchMe()).unwrap();
        dispatch(setCurrentAccount({ ...me.account, capabilities: me.capabilities }));
      }
      setUpgradeTier(null);
      setUpgradeError(null);
      navigate('/settings/subscriptions');
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : 'Upgrade failed. Please try again.');
      setUpgradeTier(null);
    }
  };

  return (
    <SettingsPageShell title="Subscription & Plans" backTo="/settings/subscriptions">
      <div className="px-4 py-4">
        <p className="text-white font-semibold text-lg text-center mb-2">
          {ACCOUNT_LABELS[accountType]} account · Choose your plan
        </p>
        <div className="flex flex-col items-center mb-4">
          <Avatar uri={profilePhoto} className="w-16 h-16 rounded-full border-2 border-[#262626] mb-2" />
          <p className="text-white font-medium flex items-center gap-1">
            {username}
            {subscriptionTier !== 'FREE' && (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  accountType === 'JOB' ? 'bg-purple-500' : 'bg-[#0095f6]'
                }`}
              >
                <Check className="w-3 h-3 text-white" />
              </span>
            )}
          </p>
          <p className="text-[#a8a8a8] text-xs mt-1">
            Current plan: {subscriptionTier === 'FREE' ? 'Free' : subscriptionTier === 'STAR' ? 'Star' : 'Paid'}
          </p>
        </div>

        <div className="space-y-4">
          {tiers.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              currentTier={subscriptionTier}
              onUpgrade={() => handleUpgrade(tier.id, tier.targetTier)}
              isUpgrading={upgradeTier === tier.id}
              upgradeError={upgradeTier === tier.id ? upgradeError : null}
            />
          ))}
        </div>

        <p className="text-[#737373] text-xs text-center mt-4 mb-4">
          Payment methods: card, UPI, net banking. Cancel anytime from Manage Subscription.
        </p>
        <Link to="/settings/subscriptions" className="block w-full py-3 rounded-lg border border-[#262626] text-white font-semibold text-center">
          Back to Subscriptions
        </Link>
      </div>
    </SettingsPageShell>
  );
}
