import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function AccountToolsMessagingPage() {
  return (
    <SettingsPageShell title="Messaging tools" backTo="/settings/account-type-tools">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">Manage message requests, saved replies, and story replies.</p>
        <Link to="/settings/messages" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <span className="font-medium">Messages and story replies</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
