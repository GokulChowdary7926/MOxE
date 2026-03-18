import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function PayoutsPaperlessPage() {
  const [paperless, setPaperless] = useState(true);

  return (
    <SettingsPageShell title="Paperless setting" backTo="/payouts">
      <div className="px-4 py-4">
        <p className="text-white font-semibold mb-2">Paperless delivery</p>
        <p className="text-[#a8a8a8] text-sm mb-4">If you choose paperless delivery, we&apos;ll send an email when your tax forms are available.</p>
        <label className="flex items-center justify-between py-3 border-b border-[#262626] cursor-pointer">
          <span className="text-white">Paperless delivery</span>
          <input type="checkbox" checked={paperless} onChange={(e) => setPaperless(e.target.checked)} className="sr-only" />
          <span className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors ${paperless ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}>
            <span className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${paperless ? 'ml-5' : 'ml-0.5'}`} />
          </span>
        </label>
        <p className="text-[#a8a8a8] text-xs mt-4">Make changes to delivery preferences by Dec 31, 2026 to apply updates to the current tax year.</p>
        <p className="text-[#a8a8a8] text-xs mt-4">By tapping Update, you agree to receive your tax forms online or by post and agree to the <Link to="/settings/help" className="text-[#0095f6]">Tax Forms Electronic Delivery Disclosure</Link>.</p>
        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-6">Update</button>
      </div>
    </SettingsPageShell>
  );
}
