import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function AddTaxInfoPage() {
  const [country, setCountry] = useState('');
  const [taxId, setTaxId] = useState('');

  return (
    <SettingsPageShell title="Add tax info" backTo="/payouts/setup">
      <div className="px-4 py-4 space-y-4">
        <p className="text-[#a8a8a8] text-sm">Required for payouts. Your information is kept secure.</p>
        <div>
          <label className="block text-[#a8a8a8] text-xs mb-1">Country / region</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="Select"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <div>
          <label className="block text-[#a8a8a8] text-xs mb-1">Tax ID (SSN / EIN / VAT)</label>
          <input
            type="text"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="Enter tax ID"
            className="w-full px-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <button type="button" className="w-full py-3 rounded-xl bg-[#0095f6] text-white font-semibold text-sm">
          Save
        </button>
      </div>
    </SettingsPageShell>
  );
}
