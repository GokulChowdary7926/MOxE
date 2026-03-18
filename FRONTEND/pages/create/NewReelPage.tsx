import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Settings, LayoutGrid, Camera } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';

/**
 * New reel page (before edit) – same for all accounts.
 * X, "New reel", gear. Templates, Recents dropdown. Camera area. Cancel.
 */
export default function NewReelPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const openFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) navigate('/create/reel/edit', { state: { file } });
    e.target.value = '';
  };

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <header className="flex items-center justify-between h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold text-base">New reel</span>
          <Link to="/settings/camera" className="p-2 -m-2 text-white" aria-label="Settings">
            <Settings className="w-6 h-6" />
          </Link>
        </header>

        <div className="flex-1 flex flex-col p-4 pb-20">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white text-sm font-medium"
            >
              <LayoutGrid className="w-5 h-5" />
              Templates
            </button>
            <button
              type="button"
              className="flex items-center gap-1 text-[#a8a8a8] text-sm"
            >
              Recents
              <span className="text-[10px]">▼</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openFile}
            className="flex-1 flex flex-col items-center justify-center rounded-xl bg-[#262626] border border-[#363636] border-dashed gap-3"
          >
            <Camera className="w-16 h-16 text-[#737373]" />
            <ThemedText secondary className="text-sm">Tap to add video or photo</ThemedText>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="video/*,image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <div className="flex justify-end mt-3">
            <button type="button" onClick={() => navigate(-1)} className="text-[#a8a8a8] text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
