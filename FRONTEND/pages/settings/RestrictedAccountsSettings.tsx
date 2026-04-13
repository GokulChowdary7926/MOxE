import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';

export default function RestrictedAccountsSettings() {
  const [query, setQuery] = useState('');
  const [restricted] = useState<{ id: string; username: string }[]>([]);

  return (
    <SettingsPageShell title="Restricted accounts" backTo="/settings">
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-2">
          Limit interactions from someone on MOxE without having to block or unfollow them.
        </p>
        <Link to="/settings/info/help-restricted-accounts" className="text-[#0095f6] text-sm font-medium">Learn how it works.</Link>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        {restricted.length === 0 ? (
          <p className="text-[#a8a8a8] text-sm text-center py-12">You haven&apos;t restricted anyone.</p>
        ) : (
          <ul className="divide-y divide-[#262626] mt-4">
            {restricted.map((u) => (
              <li key={u.id} className="py-3 flex items-center justify-between">
                <Link to={`/profile/${u.username}`} className="text-white font-medium">@{u.username}</Link>
                <button type="button" className="text-[#0095f6] text-sm">Unrestrict</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SettingsPageShell>
  );
}
