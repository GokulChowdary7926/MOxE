import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, PlusCircle, PlaySquare, Radio } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * Camera settings – same for all accounts.
 * Creation type: Story, Reels, Live (with arrows).
 * Controls: Default to front camera toggle, Camera tools (Left / Right).
 * Camera roll: Allow access + Learn more, toggle.
 */
export default function CameraSettings() {
  const navigate = useNavigate();
  const [defaultFrontCamera, setDefaultFrontCamera] = useState(false);
  const [toolbarSide, setToolbarSide] = useState<'left' | 'right'>('right');
  const [allowCameraRollAccess, setAllowCameraRollAccess] = useState(false);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <span className="text-white font-semibold text-base">Camera settings</span>
          <button type="button" onClick={() => navigate(-1)} className="text-[#0095f6] font-semibold text-sm">
            Done
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
          {/* Creation type */}
          <div className="py-2">
            <LinkRow icon={<PlusCircle className="w-5 h-5 text-[#737373]" />} label="Story" to="/settings/story" />
            <LinkRow icon={<PlaySquare className="w-5 h-5 text-[#737373]" />} label="Reels" to="/settings/story" />
            <LinkRow icon={<Radio className="w-5 h-5 text-[#737373]" />} label="Live" to="/settings/story" />
          </div>

          {/* Controls */}
          <p className="text-white font-bold text-sm px-4 pt-4 pb-2">Controls</p>
          <div className="px-4 py-3 border-t border-[#262626] flex items-center justify-between">
            <span className="text-white text-sm font-medium">Default to front camera</span>
            <Toggle value={defaultFrontCamera} onToggle={setDefaultFrontCamera} />
          </div>
          <div className="px-4 py-3 border-t border-[#262626]">
            <p className="text-white text-sm font-medium mb-0.5">Camera tools</p>
            <p className="text-[#a8a8a8] text-xs mb-2">Choose which side of the screen you want your camera toolbar to be on.</p>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="toolbarSide"
                  checked={toolbarSide === 'left'}
                  onChange={() => setToolbarSide('left')}
                  className="w-4 h-4 text-[#0095f6]"
                />
                <span className="text-white text-sm">Left-hand side</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="toolbarSide"
                  checked={toolbarSide === 'right'}
                  onChange={() => setToolbarSide('right')}
                  className="w-4 h-4 text-[#0095f6]"
                />
                <span className="text-white text-sm">Right-hand side</span>
              </label>
            </div>
          </div>

          {/* Camera roll */}
          <p className="text-white font-bold text-sm px-4 pt-4 pb-2">Camera roll</p>
          <div className="px-4 py-3 border-t border-[#262626] flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className="text-white text-sm font-medium block">Allow access</span>
              <p className="text-[#a8a8a8] text-xs mt-0.5">
                Allow MOxE to suggest stories and posts and prepare ready-made reels from photos and videos on your device camera roll using data such as image quality, location and the presence of people or animals.{' '}
                <button type="button" className="text-[#0095f6] underline">Learn more</button>
              </p>
            </div>
            <Toggle value={allowCameraRollAccess} onToggle={setAllowCameraRollAccess} />
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}

function LinkRow({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center justify-between px-4 py-3 border-b border-[#262626]">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-white text-sm font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-[#737373]" />
    </Link>
  );
}

function Toggle({ value, onToggle }: { value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onToggle(!value)}
      className={`w-11 h-6 rounded-full flex-shrink-0 ${value ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
    >
      <span className={`block w-5 h-5 rounded-full bg-white shadow mt-0.5 transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );
}
