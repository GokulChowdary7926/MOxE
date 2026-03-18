import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ArrowRight, Search, MapPin, AtSign, Music, Image as ImageIcon, FileImage, Users, LayoutGrid, HelpCircle, Scissors, Heart, Link2, Hash, Clock, Type, Smile } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';

const STICKER_BUTTONS = [
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
  { key: 'countdown', label: 'Countdown', icon: Clock },
];

/**
 * Reels edit page – timeline, sticker overlay, bottom toolbar. Same for all accounts.
 */
export default function ReelEditPage() {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const file = location.state?.file as File | undefined;
  const [showStickers, setShowStickers] = useState(true);

  if (!file) {
    navigate('/create/reel');
    return null;
  }

  const isVideo = file.type.startsWith('video/');
  const previewUrl = URL.createObjectURL(file);

  const goToShare = () => {
    navigate('/create/reel/share', { state: { file } });
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <div className="w-full max-w-[428px] mx-auto flex flex-col flex-1">
        {/* Top: back, search (or placeholder), next */}
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#262626]">
              <Search className="w-4 h-4 text-[#737373]" />
              <span className="text-[#737373] text-sm">Search</span>
            </div>
          </div>
          <button
            type="button"
            onClick={goToShare}
            className="w-10 h-10 rounded-full bg-[#0095f6] flex items-center justify-center text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </header>

        {/* Sticker overlay */}
        {showStickers && (
          <div className="mx-4 mt-2 rounded-xl bg-[#262626]/95 border border-[#363636] p-3 max-h-[45vh] overflow-auto">
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
              <input
                type="text"
                placeholder="Q Search"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#363636] text-white placeholder:text-[#737373] text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {STICKER_BUTTONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-[#363636] py-2 px-2 text-left"
                >
                  <Icon className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-white text-xs truncate">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar">
              {['2030', '28°C', '❤️1', 'SOUND ON', 'WEDNESDAY'].map((s, i) => (
                <button key={i} type="button" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#363636] text-white text-xs">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video preview + timeline */}
        <div className="flex-1 flex flex-col min-h-0 px-4 py-2">
          <div className="relative aspect-[9/16] max-h-[35vh] rounded-lg bg-[#262626] overflow-hidden">
            {isVideo ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted playsInline loop />
            ) : (
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[#a8a8a8] text-xs">
            <span>II</span>
            <span>0:01 / 0:04</span>
            <span className="ml-auto">↶ ↷</span>
          </div>
          <div className="h-12 rounded-lg bg-[#262626] mt-1 flex items-center px-2">
            <div className="flex-1 h-6 rounded bg-[#363636] relative">
              <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-white/30 rounded" />
            </div>
          </div>
          <p className="text-[#737373] text-[10px] mt-1">Tap on a track to trim. Pinch to zoom.</p>
          <div className="flex gap-4 mt-1 text-[#a8a8a8] text-xs">
            <span>♪ Tap to add audio</span>
            <span>Aa Tap to add text</span>
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-around py-3 border-t border-[#262626] bg-black safe-area-pb">
          {[
            { icon: Type, label: 'Aa Text' },
            { icon: Smile, label: 'Sticker' },
            { icon: Music, label: 'Audio' },
            { icon: ImageIcon, label: 'Add clips' },
            { icon: LayoutGrid, label: 'Overlay' },
            { icon: Scissors, label: 'Edit' },
            { icon: Type, label: 'Caption' },
          ].map(({ icon: Icon, label }) => (
            <button key={label} type="button" className="flex flex-col items-center gap-0.5 text-white">
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </ThemedView>
  );
}
