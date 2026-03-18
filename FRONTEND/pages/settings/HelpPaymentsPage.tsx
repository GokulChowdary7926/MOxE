import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Link } from 'react-router-dom';
import { ChevronRight, CreditCard } from 'lucide-react';

export default function HelpPaymentsPage() {
  return (
    <SettingsPageShell title="Payments in MOxE" backTo="/settings/help">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Add a payment method, manage MOxE Pay, and view payment history.</p>
        <Link to="/settings/orders-payments/meta-pay" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#737373]" />
            <span className="font-medium">MOxE Pay settings</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <div className="px-4 py-3">
          <p className="text-[#a8a8a8] text-sm">Pay for boosts, subscriptions, and shop orders with a saved card or other payment method.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
