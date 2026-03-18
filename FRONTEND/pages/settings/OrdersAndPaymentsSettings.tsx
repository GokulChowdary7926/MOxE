import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Calendar, Scan, Shield, HelpCircle } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

function Row({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
      <Icon className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

export default function OrdersAndPaymentsSettings() {
  return (
    <SettingsPageShell title="Orders and payments" backTo="/settings/account-centre">
      <div className="p-4">
        <Link to="/settings/orders-payments/meta-pay" className="block p-4 rounded-xl bg-[#262626] mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">∞</span>
            <span className="text-white font-semibold">MOxE Pay</span>
          </div>
          <p className="text-[#a8a8a8] text-sm">Transactions, credit cards, debit cards, delivery info, PayPal.</p>
        </Link>

        <p className="text-[#737373] text-xs font-semibold px-0 pb-2">Payment information</p>
        <div className="border-t border-[#262626]">
          <Row to="/settings/subscriptions" icon={Calendar} label="Subscriptions" />
        </div>

        <p className="text-[#737373] text-xs font-semibold px-0 pt-6 pb-2">Settings</p>
        <div className="border-t border-[#262626]">
          <Row to="/settings/orders-payments/auto-detection" icon={Scan} label="Auto-detection" />
          <Row to="/settings/orders-payments/security" icon={Shield} label="Security" />
          <Row to="/settings/help" icon={HelpCircle} label="Help & support" />
        </div>
      </div>
    </SettingsPageShell>
  );
}
