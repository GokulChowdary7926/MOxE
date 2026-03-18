import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { ChevronRight, CreditCard } from 'lucide-react';

export default function MoxePaySettings() {
  const [saveCards, setSaveCards] = useState(true);

  return (
    <SettingsPageShell title="MOxE Pay" backTo="/settings/orders-payments">
      <div className="border-t border-[#262626]">
        <SettingsToggleRow
          label="Save payment methods"
          checked={saveCards}
          onChange={setSaveCards}
          description="Store cards and payment info for faster checkout in MOxE."
        />
        <Link
          to="#"
          className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-[#737373]" />
            <span className="font-medium">Payment methods</span>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <div className="px-4 py-3">
          <p className="text-[#a8a8a8] text-sm">MOxE Pay lets you pay for orders, boosts, and subscriptions securely. Manage your saved payment methods above.</p>
        </div>
      </div>
    </SettingsPageShell>
  );
}
