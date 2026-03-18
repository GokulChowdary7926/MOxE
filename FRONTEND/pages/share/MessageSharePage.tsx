import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

const MOCK_CHATS = [
  { id: '1', name: 'Jane', username: 'jane' },
  { id: '2', name: 'John', username: 'john' },
];

export default function MessageSharePage() {
  const { contentType, id } = useParams<{ contentType?: string; id?: string }>();
  const [search, setSearch] = useState('');
  const type = contentType || 'post';
  const backTo = id ? `/share/${type}/${id}` : '/share';

  return (
    <SettingsPageShell title="Share to Message" backTo={backTo}>
      <div className="px-4 py-2 border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
      </div>
      <div className="px-4 py-2">
        <p className="text-[#737373] text-xs font-semibold mb-2">Recent</p>
        {MOCK_CHATS.map((c) => (
          <Link key={c.id} to={`/messages/${c.id}`} className="flex items-center gap-3 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <Avatar uri={null} size={44} />
            <span className="flex-1 font-medium">{c.name}</span>
            <span className="text-[#737373] text-sm">@{c.username}</span>
          </Link>
        ))}
      </div>
    </SettingsPageShell>
  );
}
