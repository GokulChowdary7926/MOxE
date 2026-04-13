import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Star, LayoutGrid } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * Audience page for reels – same for all accounts.
 * Who can see: Followers (222 people) / Close Friends (13 people).
 * Where: Profile display > Main grid and Reels grid.
 */
export default function ReelAudiencePage() {
  const navigate = useNavigate();
  const [whoCanSee, setWhoCanSee] = useState<'followers' | 'closeFriends'>('followers');

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="flex-1 text-white font-semibold text-base text-center">Audience</span>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto pb-20">
          <p className="text-white font-semibold text-sm px-4 pt-4 pb-2">Who can see your reel</p>
          <div className="border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setWhoCanSee('followers')}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-left"
            >
              <Users className="w-5 h-5 text-[#a8a8a8]" />
              <div className="flex-1">
                <span className="text-white text-sm font-medium block">Followers</span>
                <span className="text-[#737373] text-xs">222 people</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${whoCanSee === 'followers' ? 'border-[#0095f6] bg-[#0095f6]' : 'border-[#363636]'}`} />
            </button>
            <button
              type="button"
              onClick={() => setWhoCanSee('closeFriends')}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-left"
            >
              <Star className="w-5 h-5 text-[#a8a8a8]" />
              <div className="flex-1">
                <span className="text-white text-sm font-medium block">Close Friends</span>
                <span className="text-[#737373] text-xs">13 people ›</span>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 ${whoCanSee === 'closeFriends' ? 'border-[#0095f6] bg-[#0095f6]' : 'border-[#363636]'}`} />
            </button>
          </div>
          <p className="text-[#737373] text-xs px-4 py-2">
            This doesn&apos;t affect your account privacy, or change sharing preferences in other apps you&apos;ve linked.
          </p>

          <p className="text-white font-semibold text-sm px-4 pt-4 pb-2">Where your reel can be seen</p>
          <Link to="/create/reel/audience/display" className="flex items-center gap-3 px-4 py-3 border-t border-b border-[#262626] text-white">
            <LayoutGrid className="w-5 h-5 text-[#a8a8a8]" />
            <span className="flex-1 text-left">Profile display</span>
            <span className="text-[#a8a8a8] text-sm">Main grid and Reels grid ›</span>
          </Link>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
