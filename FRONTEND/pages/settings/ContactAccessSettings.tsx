import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function ContactAccessSettings() {
  return (
    <SettingsPageShell title="Contact access" backTo="/settings/following-invitations">
      <div className="px-4 py-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center mb-6">
          <Smartphone className="w-10 h-10 text-[#a8a8a8]" />
        </div>
        <h2 className="text-white font-bold text-xl text-center mb-3">Allow MOxE to access your contacts</h2>
        <p className="text-[#a8a8a8] text-sm text-center mb-2">
          We&apos;ll use your contacts to help you connect with people that you know, make recommendations for things that you care about and offer a better service.
        </p>
        <p className="text-[#a8a8a8] text-sm text-center mb-2">Your contacts will be periodically synced and stored securely.</p>
        <p className="text-[#a8a8a8] text-sm text-center mb-4">You can turn off syncing at any time in settings.</p>
        <Link to="/settings/info/help-contact-access" className="text-[#0095f6] text-sm font-medium mb-8">Learn more</Link>
        <button type="button" className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold">Go to Settings</button>
        <button type="button" className="w-full py-3 text-white font-medium mt-2">Skip</button>
      </div>
    </SettingsPageShell>
  );
}
