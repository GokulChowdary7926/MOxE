import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Settings, Search, MapPin, AtSign, Music, Image as ImageIcon, FileImage, Users, LayoutGrid, HelpCircle, Scissors, Heart, Link2, Hash, BadgeCheck } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

const FEATURE_BUTTONS = [
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'mention', label: '@mention', icon: AtSign },
  { key: 'music', label: 'Music', icon: Music },
  { key: 'photo', label: 'Photo', icon: ImageIcon },
  { key: 'gif', label: 'Q GIF', icon: FileImage },
  { key: 'add-yours', label: 'Add yours', icon: Users },
  { key: 'frames', label: 'Frames', icon: LayoutGrid },
  { key: 'questions', label: 'Questions', icon: HelpCircle },
  { key: 'cutouts', label: 'Cutouts', icon: Scissors },
  { key: 'highlight', label: 'Highlight', icon: Heart },
  { key: 'link', label: 'Link', icon: Link2 },
  { key: 'hashtag', label: '#hashtag', icon: Hash },
];

/**
 * Search page in story (stickers / features) – same for all accounts.
 * Header: X, Add to story, gear. Q Search. Grid of feature buttons. Sticker grid below.
 */
const VERIFIED_ONLY_STICKERS = ['Verified banner', 'Blue seal', 'Official link'];

export default function StorySearchStickersPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount() as { verifiedBadge?: boolean } | null;
  const isVerified = !!account?.verifiedBadge;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-base">Add to story</span>
          <Link to="/settings/camera" className="p-2 -m-2 text-white" aria-label="Settings">
            <Settings className="w-6 h-6" />
          </Link>
        </header>

        <div className="flex-1 overflow-auto p-4 pb-20">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#737373]" />
            <input
              type="text"
              placeholder="Q Search"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {FEATURE_BUTTONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className="flex items-center gap-2 rounded-xl bg-[#262626] border border-[#363636] py-3 px-3 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#363636] flex items-center justify-center flex-shrink-0 text-white">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-white text-xs font-medium truncate">{label}</span>
              </button>
            ))}
          </div>

          <p className="text-white font-semibold text-sm mb-2">Stickers</p>
          <div className="grid grid-cols-4 gap-3">
            {['2030', '28°C', '❤️', 'SOUND ON', 'WEDNESDAY', 'Countdown'].map((s, i) => (
              <button
                key={i}
                type="button"
                className="aspect-square rounded-xl bg-[#262626] border border-[#363636] flex items-center justify-center text-white text-sm font-medium"
              >
                {s}
              </button>
            ))}
          </div>

          <p className="text-white font-semibold text-sm mt-6 mb-2 flex items-center gap-1">
            <BadgeCheck className="w-4 h-4 text-[#0095f6]" aria-hidden />
            Verified-only stickers
          </p>
          {!isVerified ? (
            <p className="text-[#737373] text-xs px-0.5">
              These stickers are available to verified accounts. Get verified to unlock them on your stories.
            </p>
          ) : null}
          <div className={`grid grid-cols-4 gap-3 mt-2 ${!isVerified ? 'opacity-40 pointer-events-none' : ''}`}>
            {VERIFIED_ONLY_STICKERS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={!isVerified}
                className="aspect-square rounded-xl bg-[#262626] border border-[#363636] flex items-center justify-center text-white text-xs font-medium text-center px-1"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
