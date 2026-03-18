import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function CommentsSettingsPage() {
  const [allowGif, setAllowGif] = useState(true);

  return (
    <SettingsPageShell title="Comments" backTo="/settings">
      <Link to="/settings/comments/block-from" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Block comments from</span>
        <span className="text-[#a8a8a8] flex items-center">0 people<ChevronRight className="w-5 h-5 ml-1" /></span>
      </Link>
      <p className="text-[#a8a8a8] text-sm px-4 py-2">Any new comments from people you block won&apos;t be visible to anyone but them.</p>

      <h2 className="text-white font-semibold px-4 pt-4 pb-2">Who can comment</h2>
      <Link to="/settings/comments/allow-from-posts" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Posts and reels</span>
        <span className="text-[#a8a8a8] flex items-center">Your followers<ChevronRight className="w-5 h-5 ml-1" /></span>
      </Link>
      <Link to="/settings/comments/allow-from-stories" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Stories</span>
        <span className="text-[#a8a8a8] flex items-center">Your followers<ChevronRight className="w-5 h-5 ml-1" /></span>
      </Link>

      <h2 className="text-white font-semibold px-4 pt-4 pb-2">Types of comments</h2>
      <Link to="/settings/comments/hide-unwanted" className="flex items-center justify-between px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
        <span className="font-medium">Hide unwanted comments</span>
        <span className="text-[#a8a8a8] flex items-center">Some<ChevronRight className="w-5 h-5 ml-1" /></span>
      </Link>
      <p className="text-[#a8a8a8] text-sm px-4 py-2">MOxE will automatically move comments that may be offensive or spam to the hidden comments section at the bottom of your comments.</p>
      <SettingsToggleRow
        label="Allow GIF comments"
        checked={allowGif}
        onChange={setAllowGif}
        description="People will be able to comment GIFs on your posts and reels."
      />
    </SettingsPageShell>
  );
}
