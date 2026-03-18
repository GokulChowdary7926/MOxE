import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Avatar } from '../../components/ui/Avatar';
import { Bell } from 'lucide-react';

type Account = { id: string; username: string; displayName: string; profilePhoto?: string | null; verified?: boolean };

export default function FromAccountsYouFollowSettings() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  return (
    <SettingsPageShell title="From accounts you follow" backTo="/settings/notifications" right={<button type="button" className="text-[#0095f6] text-sm font-semibold">Select</button>}>
      {accounts.length === 0 ? (
        <p className="text-[#a8a8a8] text-sm px-4 py-8">No accounts yet. When you follow people, you can choose to get notifications from them here.</p>
      ) : (
        <ul className="divide-y divide-[#262626]">
          {accounts.map((acc) => (
            <li key={acc.id} className="flex items-center gap-3 px-4 py-3 active:bg-white/5">
              <Avatar uri={acc.profilePhoto} className="w-11 h-11 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium flex items-center gap-1">
                  {acc.username}
                  {acc.verified && <span className="text-[#0095f6]" aria-label="Verified">✓</span>}
                </p>
                <p className="text-[#a8a8a8] text-sm truncate">{acc.displayName}</p>
              </div>
              <button type="button" className="p-2 text-[#a8a8a8] active:opacity-70" aria-label="Notifications">
                <Bell className="w-5 h-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SettingsPageShell>
  );
}
