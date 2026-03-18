import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Settings, Users, Music, LayoutGrid, Sparkles, Camera, Image as ImageIcon } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * Add to story landing – same layout for all accounts.
 * Header: X, "Add to story", gear. Cards: Add yours, Music, Collage, AI.
 * Recents / Select. Camera + gallery area.
 */
export default function AddStoryPage() {
  const navigate = useNavigate();

  const cards = [
    { key: 'add-yours', label: 'Add yours', icon: Users, to: '/stories/create/editor' },
    { key: 'music', label: 'Music', icon: Music, to: '/stories/create/music' },
    { key: 'collage', label: 'Collage', icon: LayoutGrid, to: '/stories/create/editor' },
    { key: 'ai', label: 'AI', icon: Sparkles, to: '/stories/create/effects' },
  ];

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-base">Add to story</span>
          <Link to="/settings/camera" className="p-2 -m-2 text-white" aria-label="Camera settings">
            <Settings className="w-6 h-6" />
          </Link>
        </header>

        <div className="flex-1 overflow-auto p-4 pb-20">
          {/* Story creation option cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {cards.map(({ key, label, icon: Icon, to }) => (
              <Link
                key={key}
                to={to}
                className="flex flex-col items-center justify-center rounded-xl bg-[#262626] border border-[#363636] py-4 px-2 active:bg-[#363636]"
              >
                <div className="w-12 h-12 rounded-full bg-[#363636] flex items-center justify-center mb-2 text-white">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-white text-xs font-medium text-center">{label}</span>
              </Link>
            ))}
          </div>

          {/* Recents / Select row */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" className="text-[#a8a8a8] text-sm font-medium flex items-center gap-1">
              Recents
              <span className="text-[10px]">▼</span>
            </button>
            <button type="button" className="flex items-center gap-1.5 text-white text-sm font-medium">
              <span className="w-4 h-4 rounded border border-[#363636] bg-[#262626]" />
              Select
            </button>
          </div>

          {/* Camera + gallery area */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/stories/create/camera')}
              className="flex-1 aspect-[9/16] max-h-[50vh] rounded-xl bg-[#262626] border border-[#363636] flex flex-col items-center justify-center gap-2"
            >
              <Camera className="w-12 h-12 text-[#737373]" />
              <ThemedText secondary className="text-xs">Camera</ThemedText>
            </button>
            <button
              type="button"
              onClick={() => navigate('/stories/create/editor')}
              className="w-20 aspect-square rounded-lg bg-[#262626] border border-[#363636] flex items-center justify-center overflow-hidden"
            >
              <ImageIcon className="w-8 h-8 text-[#737373]" />
            </button>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
