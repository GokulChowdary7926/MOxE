import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Settings, Search } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

const PILLS = ['For you', 'Trending', 'Original audio', 'Saved'];
const TRACKS = [
  { id: '1', title: 'back to friends', artist: 'sombr', reels: '814K', duration: '3:20' },
  { id: '2', title: 'Tenu Sang Rakhna', artist: 'Arijit Singh, Achint...', reels: '120K', duration: '3:45' },
  { id: '3', title: 'Chekuthan (Reprise)', artist: 'Ribin Richard, Nihal Sadiq', reels: '95K', duration: '1:41' },
  { id: '4', title: 'Night Changes', artist: 'One Direction', reels: '651K', duration: '3:47' },
];

/**
 * Music page for story – same for all accounts.
 * Header: X, Add to story, gear. Search. Pills: For you, Trending, Original audio, Saved. Featured card. Track list.
 */
export default function StoryMusicPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pill, setPill] = useState(0);

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
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3">
            {PILLS.map((p, i) => (
              <button
                key={p}
                type="button"
                onClick={() => setPill(i)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold ${
                  pill === i ? 'bg-white text-black' : 'bg-[#262626] text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Featured */}
          <div className="rounded-xl bg-[#262626] border border-[#363636] overflow-hidden mb-4">
            <div className="aspect-[2/1] bg-[#363636] flex items-center justify-center">
              <span className="text-[#737373] text-sm">Featured</span>
            </div>
            <div className="p-3">
              <p className="text-white font-semibold">Sanu Hi Pata</p>
              <p className="text-[#a8a8a8] text-xs">Kunwarr</p>
            </div>
          </div>

          <p className="text-white font-semibold text-sm mb-2">Music</p>
          <div className="space-y-2">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="w-full flex items-center gap-3 py-2 rounded-lg active:bg-white/5"
              >
                <div className="w-12 h-12 rounded-lg bg-[#262626] flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white font-medium text-sm truncate">{t.title}</p>
                  <p className="text-[#a8a8a8] text-xs truncate">{t.artist}</p>
                </div>
                <span className="text-[#737373] text-xs flex-shrink-0">{t.reels} reels</span>
                <span className="text-[#737373] text-xs flex-shrink-0">{t.duration}</span>
                <button type="button" className="p-1 text-[#737373]">♡</button>
              </button>
            ))}
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
