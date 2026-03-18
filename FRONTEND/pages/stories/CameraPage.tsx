import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, RefreshCw, Type, Infinity, LayoutGrid, Sparkles, Circle, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

type ContentMode = 'POST' | 'STORY' | 'REEL' | 'LIVE';

/**
 * Creation page of camera – same for all accounts.
 * Top: X, flash, camera switch. Right sidebar: Create, Boomerang, Layout, AI Images, Hands-free, Close.
 * Bottom: gallery thumb, shutter, mode selector (POST/STORY/REEL/LIVE), loop button.
 */
export default function CameraPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = React.useState<ContentMode>('STORY');
  const [flashOff, setFlashOff] = React.useState(true);

  const capture = () => {
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) navigate('/stories/create/editor', { state: { file } });
    e.target.value = '';
  };

  const modes: ContentMode[] = ['POST', 'STORY', 'REEL', 'LIVE'];

  return (
    <ThemedView className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="w-full max-w-[428px] h-full flex flex-col mx-auto">
        {/* Top bar: X, flash, camera switch */}
        <div className="flex items-center justify-between px-4 py-3 safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={() => setFlashOff((v) => !v)}
            className="p-2 -m-2 text-white"
            aria-label={flashOff ? 'Flash off' : 'Flash on'}
          >
            <Zap className={`w-6 h-6 ${flashOff ? 'opacity-50' : ''}`} />
          </button>
          <button type="button" className="p-2 -m-2 text-white" aria-label="Switch camera">
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0 relative">
          {/* Camera preview placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-[#737373] text-sm">Camera preview</div>
          </div>

          {/* Right sidebar: Create, Boomerang, Layout, AI, Hands-free, Close */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-10">
            <button type="button" className="flex flex-col items-center gap-0.5 text-white">
              <Type className="w-6 h-6" />
              <span className="text-[10px]">Create</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white">
              <Infinity className="w-6 h-6" />
              <span className="text-[10px]">Boomerang</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white">
              <LayoutGrid className="w-6 h-6" />
              <span className="text-[10px]">Layout</span>
            </button>
            <button type="button" onClick={() => navigate('/stories/create/effects')} className="flex flex-col items-center gap-0.5 text-white">
              <Sparkles className="w-6 h-6" />
              <span className="text-[10px]">AI Images</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white">
              <Circle className="w-6 h-6" />
              <span className="text-[10px]">Hands-free</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-[#737373]">
              <ChevronUp className="w-5 h-5" />
              <span className="text-[10px]">Close</span>
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        {/* Bottom: gallery, shutter, mode bar, loop */}
        <div className="flex items-center justify-between px-4 py-3 safe-area-pb bg-black/50">
          <button
            type="button"
            onClick={() => navigate('/stories/create')}
            className="w-12 h-12 rounded-lg bg-[#262626] border border-[#363636] flex items-center justify-center"
          >
            <ImageIcon className="w-6 h-6 text-[#737373]" />
          </button>
          <button
            type="button"
            onClick={capture}
            className="w-16 h-16 rounded-full border-4 border-white bg-transparent"
            aria-label="Capture"
          />
          <div className="flex items-center gap-1">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-2 py-1 text-xs font-semibold rounded ${m === mode ? 'text-white' : 'text-[#737373]'}`}
              >
                {m}
              </button>
            ))}
          </div>
          <button type="button" className="p-2 text-white" aria-label="Effects">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </ThemedView>
  );
}
