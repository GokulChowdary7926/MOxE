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
 * Post edit page – sticker overlay, media carousel, bottom toolbar. Same as Reels for all accounts.
 */
export default function PostEditPage() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { files?: File[] } };
  const files = location.state?.files as File[] | undefined;
  const [activeIndex, setActiveIndex] = useState(0);

  if (!files?.length) {
    navigate('/create/post');
    return null;
  }

  const current = files[activeIndex] ?? files[0] ?? null;
  if (!current) {
    navigate('/create/post');
    return null;
  }
  const isVideo = current.type.startsWith('video/');
  const previewUrl = URL.createObjectURL(current);

  const goToShare = () => {
    navigate('/create/post/share', { state: { files } });
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <div className="w-full max-w-[428px] mx-auto flex flex-col flex-1">
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
            data-testid="post-edit-next"
            onClick={goToShare}
            className="w-10 h-10 rounded-full bg-[#0095f6] flex items-center justify-center text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </header>

        {/* Sticker overlay */}
        <div className="mx-4 mt-2 rounded-xl bg-[#262626]/95 border border-[#363636] p-3 max-h-[38vh] overflow-auto">
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
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {['2030', '28°C', '❤️1', 'SOUND ON', 'WEDNESDAY'].map((s, i) => (
              <button key={i} type="button" className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-[#363636] text-white text-xs">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Media preview */}
        <div className="flex-1 flex flex-col min-h-0 px-4 py-2">
          <div className="relative aspect-square max-h-[35vh] rounded-lg bg-[#262626] overflow-hidden">
            {isVideo ? (
              <video src={previewUrl} className="w-full h-full object-cover" muted playsInline loop />
            ) : (
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          {files.length > 1 && (
            <div className="flex gap-1 mt-2 overflow-x-auto justify-center">
              {files.map((f, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === activeIndex ? 'border-[#0095f6]' : 'border-transparent'}`}
                >
                  {f.type.startsWith('video/') ? (
                    <video src={URL.createObjectURL(f)} className="w-full h-full object-cover" muted />
                  ) : (
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
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
