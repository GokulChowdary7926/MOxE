import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { Search } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

const MOCK_LIKES = [
  { id: '1', username: 'jcoper', displayName: 'Jane Cooper' },
  { id: '2', username: 'theresewbb', displayName: 'Theresa Webb' },
  { id: '3', username: 'mrvinny', displayName: 'Marvin McKinsey' },
];

export default function LikesPage() {
  const { postId, reelId } = useParams();
  const backTo = postId ? `/post/${postId}` : reelId ? `/reels` : '/';

  return (
    <SettingsPageShell title="Likes" backTo={backTo}>
      <div className="px-4 py-2 border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
          <input type="search" placeholder="Search" className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm" />
        </div>
      </div>
      <div className="divide-y divide-[#262626]">
        {MOCK_LIKES.map((u) => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar uri={null} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{u.username}</p>
              <p className="text-[#a8a8a8] text-sm truncate">{u.displayName}</p>
            </div>
            <button type="button" className="px-4 py-1.5 rounded-lg bg-[#0095f6] text-white text-sm font-semibold">Follow</button>
          </div>
        ))}
      </div>
    </SettingsPageShell>
  );
}
