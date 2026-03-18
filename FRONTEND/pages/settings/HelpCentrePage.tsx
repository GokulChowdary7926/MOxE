import React, { useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search, ChevronRight } from 'lucide-react';

const TOPICS = [
  { id: 'account', title: 'Account and login', count: 12 },
  { id: 'privacy', title: 'Privacy and security', count: 8 },
  { id: 'payments', title: 'Payments and orders', count: 6 },
  { id: 'content', title: 'Content and copyright', count: 10 },
];

export default function HelpCentrePage() {
  const [search, setSearch] = useState('');

  return (
    <SettingsPageShell title="Help Centre" backTo="/settings/help">
      <div className="px-4 py-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search help"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        <p className="text-[#a8a8a8] text-sm mb-4">Browse topics or search for what you need.</p>
        <div className="space-y-0 border border-[#262626] rounded-xl overflow-hidden">
          {TOPICS.map((t) => (
            <a
              key={t.id}
              href="#"
              className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#262626] last:border-b-0 text-white active:bg-white/5"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">{t.title}</span>
                <span className="text-[#737373] text-xs">{t.count} articles</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#737373] flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </SettingsPageShell>
  );
}
