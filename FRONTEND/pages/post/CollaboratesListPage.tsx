import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { ChevronRight } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';

const MOCK_COLLAB = [{ id: '1', username: 'brand_account', displayName: 'Brand Partner' }];

export default function CollaboratesListPage() {
  const { postId, reelId } = useParams();
  const backTo = postId ? `/post/${postId}` : reelId ? `/reels` : '/';

  return (
    <SettingsPageShell title="Collaborators" backTo={backTo}>
      <p className="text-[#a8a8a8] text-sm px-4 py-3">People tagged or in a paid partnership with this content.</p>
      <div className="border-t border-[#262626]">
        {MOCK_COLLAB.map((c) => (
          <Link key={c.id} to={`/profile/${c.username}`} className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
            <Avatar uri={null} size={44} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{c.username}</p>
              <p className="text-[#a8a8a8] text-sm truncate">{c.displayName}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#737373]" />
          </Link>
        ))}
      </div>
    </SettingsPageShell>
  );
}
