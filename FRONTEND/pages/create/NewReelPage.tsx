import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import CreationModeBar from '../../components/create/CreationModeBar';

const TEMPLATE_PLACEHOLDERS = [
  { id: '1', gradient: 'from-slate-600 via-slate-500 to-amber-200/90', user: 'okay_kaiden4', audio: 'okay_kaiden_459 · Original Audio' },
  { id: '2', gradient: 'from-orange-400/90 via-rose-500/80 to-violet-900', user: 'okay_kaiden4', audio: 'okay_kaiden_459 · Original Audio' },
];

/**
 * Reels entry — browse templates or open camera (reference: IG templates + camera tabs).
 */
export default function NewReelPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'templates' | 'camera'>('templates');
  const [carousel, setCarousel] = useState(0);

  const openFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) navigate('/create/reel/edit', { state: { file } });
    e.target.value = '';
  };

  const useTemplate = () => {
    navigate('/create/reel/record', { state: { templateId: TEMPLATE_PLACEHOLDERS[carousel]?.id } });
  };

  return (
    <ThemedView className="flex min-h-screen flex-col bg-black">
      <MobileShell>
        <header className="flex h-12 items-center justify-between border-b border-moxe-border bg-black px-3 safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="-m-2 p-2 text-white" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          <span className="text-base font-semibold text-white">New reel</span>
          <Link to="/settings/camera" className="-m-2 p-2 text-white" aria-label="Settings">
            <Settings className="h-6 w-6" />
          </Link>
        </header>

        {tab === 'templates' ? (
          <div className="flex flex-1 flex-col px-4 pb-32 pt-4">
            <h1 className="text-center text-lg font-bold text-white">Browse templates</h1>
            <p className="mt-1 text-center text-sm text-moxe-textSecondary">
              Popular reels you can use audio and clip timing from to create your own.
            </p>

            <div className="relative mt-6 flex flex-1 flex-col items-center">
              <div className="relative aspect-[9/16] w-full max-w-[240px] overflow-hidden rounded-xl bg-moxe-surface">
                <div
                  className={`h-full w-full bg-gradient-to-br ${TEMPLATE_PLACEHOLDERS[carousel]?.gradient ?? 'from-zinc-700 to-zinc-900'}`}
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-white/20 ring-2 ring-white/40" />
                    <div>
                      <p className="text-xs font-semibold text-white">{TEMPLATE_PLACEHOLDERS[carousel]?.user}</p>
                      <p className="text-[10px] text-white/80">🎵 {TEMPLATE_PLACEHOLDERS[carousel]?.audio}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white"
                  aria-label="Previous"
                  onClick={() => setCarousel((c) => (c === 0 ? TEMPLATE_PLACEHOLDERS.length - 1 : c - 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white"
                  aria-label="Next"
                  onClick={() => setCarousel((c) => (c + 1) % TEMPLATE_PLACEHOLDERS.length)}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={useTemplate}
                className="mt-6 w-full max-w-[280px] rounded-full bg-white py-3 text-center text-sm font-bold text-black"
              >
                Use template
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-32 pt-8">
            <ThemedText className="text-center text-moxe-textSecondary">Open the camera to record a reel, or pick from your library.</ThemedText>
            <button
              type="button"
              onClick={() => navigate('/stories/create/camera')}
              className="rounded-full bg-moxe-primary px-8 py-3 text-sm font-semibold text-white"
            >
              Open camera
            </button>
            <button
              type="button"
              onClick={openFile}
              className="text-sm font-semibold text-moxe-primary"
            >
              Choose from library
            </button>
            <input ref={inputRef} type="file" accept="video/*,image/*" className="hidden" onChange={onFileChange} />
          </div>
        )}

        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-[428px] flex-col items-center gap-2 pb-safe-area-pb pb-4">
          <div className="pointer-events-auto flex w-full max-w-xs rounded-full border border-moxe-border bg-black/70 p-1">
            <button
              type="button"
              onClick={() => setTab('camera')}
              className={`flex-1 rounded-full py-2 text-center text-xs font-bold ${
                tab === 'camera' ? 'bg-white text-black' : 'text-moxe-textSecondary'
              }`}
            >
              CAMERA
            </button>
            <button
              type="button"
              onClick={() => setTab('templates')}
              className={`flex-1 rounded-full py-2 text-center text-xs font-bold ${
                tab === 'templates' ? 'bg-white text-black' : 'text-moxe-textSecondary'
              }`}
            >
              TEMPLATES
            </button>
          </div>
          <CreationModeBar />
        </div>
      </MobileShell>
    </ThemedView>
  );
}
