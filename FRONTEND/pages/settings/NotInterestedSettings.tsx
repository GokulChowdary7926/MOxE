import React from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';

export default function NotInterestedSettings() {
  return (
    <SettingsPageShell title="Not interested" backTo="/settings/content-preferences">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">When you tap “Not interested” on a post or reel, we use that to show you less of that type of content. You can review and remove topics or accounts you’ve marked.</p>
        <Link
          to="/settings/info/not-interested-topics"
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#262626] border border-[#363636] text-white active:bg-white/5"
        >
          <span className="font-medium">Topics you’ve hidden</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link
          to="/settings/info/not-interested-accounts"
          className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#262626] border border-[#363636] text-white active:bg-white/5 mt-2"
        >
          <span className="font-medium">Accounts you’ve hidden</span>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
      </div>
    </SettingsPageShell>
  );
}
