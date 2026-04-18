import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronDown, Copy, Camera, Maximize2 } from 'lucide-react';
import { ThemedView } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import CreationModeBar from '../../components/create/CreationModeBar';
import VideoPostsAsReelsModal from '../../components/create/VideoPostsAsReelsModal';

function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function GridThumb({
  file,
  selected,
  onPick,
  onRemove,
}: {
  file: File;
  selected: boolean;
  onPick: () => void;
  onRemove: () => void;
}) {
  const url = useObjectUrl(file);
  const isVideo = file.type.startsWith('video/');
  if (!url) return null;
  return (
    <div className="relative aspect-square overflow-hidden rounded-sm">
      <button type="button" onClick={onPick} className={`relative block h-full w-full ${selected ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`}>
        {isVideo ? (
          <>
            <video src={url} className="h-full w-full object-cover" muted playsInline />
            <span className="absolute bottom-0.5 right-0.5 rounded bg-black/75 px-1 py-px text-[9px] leading-none text-white">
              ▶
            </span>
          </>
        ) : (
          <img src={url} alt="" className="h-full w-full object-cover" />
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-[11px] text-white"
        aria-label="Remove"
      >
        ×
      </button>
    </div>
  );
}

/**
 * New post — gallery picker (reference: IG “New post”: preview, Recents, 4-col grid, mode pill).
 */
export default function NewPostPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showVideoReelModal, setShowVideoReelModal] = useState(false);

  const openFile = () => inputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    if (!list.length) return;
    setFiles((prev) => {
      const next = [...prev, ...list].slice(0, 10);
      setActiveIndex(next.length - 1);
      return next;
    });
  };

  const goToEdit = useCallback(() => {
    if (!files.length) return;
    const hasVideo = files.some((f) => f.type.startsWith('video/'));
    if (hasVideo) {
      setShowVideoReelModal(true);
      return;
    }
    navigate('/create/post/edit', { state: { files } });
  }, [files, navigate]);

  const confirmVideoModal = () => {
    setShowVideoReelModal(false);
    if (files.length) navigate('/create/post/edit', { state: { files } });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setActiveIndex((ai) => Math.min(ai, Math.max(0, next.length - 1)));
      return next;
    });
  };

  const previewFile = files[activeIndex] ?? null;
  const previewUrl = useObjectUrl(previewFile);
  const stackThumb = files[activeIndex] ?? files[files.length - 1] ?? null;
  const stackUrl = useObjectUrl(stackThumb);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <VideoPostsAsReelsModal open={showVideoReelModal} onClose={confirmVideoModal} />
      <MobileShell>
        <header className="flex h-12 items-center justify-between border-b border-moxe-border bg-black px-3 safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="-m-2 p-2 text-white" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          <span className="text-base font-semibold text-white">New post</span>
          <button
            type="button"
            onClick={goToEdit}
            disabled={!files.length}
            className="text-sm font-semibold text-moxe-primary disabled:opacity-40 disabled:text-moxe-textSecondary"
          >
            Next
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden pb-28">
          <div className="relative aspect-[3/4] w-full max-h-[52vh] shrink-0 bg-[#0a0a0a]">
            {previewUrl ? (
              <>
                {previewFile?.type.startsWith('video/') ? (
                  <video src={previewUrl} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                )}
                <button
                  type="button"
                  className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
                  aria-label="Crop"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openFile}
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-moxe-textSecondary"
              >
                <Camera className="h-14 w-14 opacity-60" />
                <span className="text-sm">Choose photos or videos</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between border-b border-moxe-border/80 px-4 py-2">
            <button type="button" className="flex items-center gap-1 text-sm font-medium text-white">
              Recents
              <ChevronDown className="h-4 w-4 text-moxe-textSecondary" />
            </button>
            <div className="flex items-center gap-3">
              <button type="button" className="p-1 text-white" aria-label="Select multiple">
                <Copy className="h-5 w-5" />
              </button>
              <button type="button" onClick={openFile} className="p-1 text-white" aria-label="Camera or library">
                <Camera className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-1 pt-1">
            <div className="grid grid-cols-4 gap-0.5">
              <button
                type="button"
                onClick={openFile}
                className="relative aspect-square overflow-hidden rounded-sm bg-[#1a1a1a]"
              >
                {stackUrl ? (
                  <>
                    {stackThumb?.type.startsWith('video/') ? (
                      <video src={stackUrl} className="h-full w-full object-cover opacity-95" muted playsInline />
                    ) : (
                      <img src={stackUrl} alt="" className="h-full w-full object-cover opacity-95" />
                    )}
                    <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-moxe-primary text-[11px] font-bold text-white shadow-sm">
                      +
                    </span>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-moxe-textSecondary">+</div>
                )}
              </button>
              {files.map((file, idx) => (
                <GridThumb
                  key={`${file.name}-${idx}-${file.size}`}
                  file={file}
                  selected={idx === activeIndex}
                  onPick={() => setActiveIndex(idx)}
                  onRemove={() => removeFile(idx)}
                />
              ))}
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          data-testid="new-post-file-input"
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onFileChange}
        />

        <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 mx-auto flex max-w-[428px] flex-col items-center gap-2 pb-safe-area-pb pb-6">
          <CreationModeBar />
        </div>
      </MobileShell>
    </ThemedView>
  );
}
