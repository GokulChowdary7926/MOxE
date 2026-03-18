import React from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function HelpContactPaymentPage() {
  return (
    <SettingsPageShell title="Contact about a payment" backTo="/settings/help">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Having an issue with a charge or refund? Get in touch with support.</p>
        <a href="mailto:support@moxe.app" className="block w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm text-center">
          Email support
        </a>
      </div>
    </SettingsPageShell>
  );
}
