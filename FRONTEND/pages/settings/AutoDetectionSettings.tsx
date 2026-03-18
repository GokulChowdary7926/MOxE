import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function AutoDetectionSettings() {
  const [payments, setPayments] = useState(false);

  return (
    <SettingsPageShell title="Auto-detection" backTo="/settings/orders-payments">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Allow MOxE to suggest features based on activities in your conversations.</p>
        <SettingsToggleRow
          label="Payments"
          checked={payments}
          onChange={setPayments}
          description="Automatically detect payment requests"
        />
      </div>
    </SettingsPageShell>
  );
}
