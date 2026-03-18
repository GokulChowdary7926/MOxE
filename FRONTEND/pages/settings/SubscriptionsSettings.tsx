import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { ChevronRight, Shield, Check } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function SubscriptionsSettings() {
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as { accountType?: string } | null;
  const accountType = currentAccount?.accountType ?? 'PERSONAL';

  const isProfessional = accountType === 'CREATOR' || accountType === 'BUSINESS' || accountType === 'JOB';
  const benefits = isProfessional
    ? ['Verified badge', 'Pro account tools', 'Priority support', 'Monetisation features']
    : ['Verified badge', 'Extra account protection', 'Direct support', 'Custom stickers and more'];

  return (
    <SettingsPageShell title="Subscriptions" backTo="/settings">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#262626] mb-4">
          <Shield className="w-10 h-10 text-[#0095f6] flex-shrink-0" />
          <div>
            <p className="text-white font-semibold">MOxE Verified</p>
            <p className="text-[#a8a8a8] text-sm">Not subscribed</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373] ml-auto" />
        </div>
        <p className="text-[#a8a8a8] text-sm mb-4">
          {isProfessional
            ? 'Get a verified badge and access to professional tools with a MOxE Verified subscription.'
            : 'Get a verified badge, extra protection and support with a MOxE Verified subscription.'}
        </p>
        <h3 className="text-white font-semibold mb-2">What you get</h3>
        <ul className="space-y-2 mb-6">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-[#a8a8a8] text-sm">
              <Check className="w-4 h-4 text-[#0095f6] flex-shrink-0" />
              {b}
            </li>
          ))}
        </ul>
        <Link to="/settings/subscriptions/plans" className="block w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold text-center">
          View plans
        </Link>
      </div>
    </SettingsPageShell>
  );
}
