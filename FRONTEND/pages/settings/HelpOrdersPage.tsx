import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function HelpOrdersPage() {
  return (
    <SettingsPageShell title="Orders and returns" backTo="/settings/help">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Find order confirmations, track shipments, and request returns for shop orders.</p>
        <Link to="/commerce/orders" className="block rounded-xl bg-[#262626] border border-[#363636] p-4 hover:border-[#0095f6]/50 transition-colors">
          <p className="text-white font-medium text-sm mb-1">View my orders</p>
          <p className="text-[#a8a8a8] text-xs">See your past purchases and order status.</p>
        </Link>
      </div>
    </SettingsPageShell>
  );
}
