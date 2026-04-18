import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Zap,
  RefreshCw,
  Music,
  Timer,
  Gauge,
  LayoutGrid,
  StopCircle,
  Clapperboard,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { useCamera } from '../../hooks/useCamera';
import { isSecureContextHintMessage } from '../../utils/browserFeatures';
import { chromaKeyBlobToPng } from '../../lib/reelCompositeRecord';
import { InCameraModePill, type CreationModeId } from '../../components/create/CreationModeBar';

/**
 * Full-screen create camera (reference: IG Reels — left tools, top bar, gallery + record + flip, mode pill).
 */
export default function CameraPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = React.useState<CreationModeId>('REEL');
  const [flashOff, setFlashOff] = React.useState(true);
  const [greenScreenBeta, setGreenScreenBeta] = React.useState(false);
  const [reelLengthSec] = React.useState(30);

  const {
    stream,
    error: cameraError,
    isActive,
    isRecording,
    start,
    stop,
    capturePhoto,
    startRecording,
    stopRecording,
    switchCamera,
  } = useCamera({ video: true, audio: mode === 'REEL' || mode === 'LIVE' });

  useEffect(() => {
    start({ video: true, audio: mode === 'REEL' || mode === 'LIVE' });
    return () => stop();
  }, [mode]);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = stream;
  }, [stream]);

  const blobToFile = (blob: Blob, name: string, mime: string): File => new File([blob], name, { type: mime });

  const handleCapture = async () => {
    if (mode === 'REEL' || mode === 'LIVE') {
      if (isRecording) {
        const blob = await stopRecording();
        if (blob) {
          const file = blobToFile(blob, `reel-${Date.now()}.webm`, 'video/webm');
          if (mode === 'LIVE') {
            navigate('/live/start');
          } else {
            navigate('/create/reel/edit', { state: { file } });
          }
        }
      } else {
        startRecording();
      }
      return;
    }
    let blob = await capturePhoto();
    if (blob && greenScreenBeta && (mode === 'STORY' || mode === 'POST')) {
      blob = (await chromaKeyBlobToPng(blob, '#1a1a1a')) ?? blob;
    }
    if (blob) {
      const file = blobToFile(blob, `capture-${Date.now()}.png`, 'image/png');
      if (mode === 'POST') {
        navigate('/create/post/edit', { state: { files: [file] } });
      } else {
        navigate('/stories/create/editor', { state: { file } });
      }
    }
  };

  const onGalleryFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.type.startsWith('video/')) {
      navigate('/create/reel/edit', { state: { file: f } });
    } else {
      navigate('/create/post/edit', { state: { files: [f] } });
    }
  };

  return (
    <ThemedView className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative mx-auto flex h-full w-full max-w-[428px] flex-col">
        {/* Top bar: settings · flash · close */}
        <div className="relative z-20 flex items-center justify-between px-3 pb-2 safe-area-pt">
          <Link to="/settings/camera" className="-m-2 p-2 text-white" aria-label="Settings">
            <Settings className="h-6 w-6" />
          </Link>
          <button
            type="button"
            onClick={() => setFlashOff((v) => !v)}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 text-white"
            aria-label={flashOff ? 'Flash off' : 'Flash on'}
          >
            <Zap className={`h-6 w-6 ${flashOff ? 'opacity-50' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              stop();
              navigate(-1);
            }}
            className="-m-2 p-2 text-white"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {cameraError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0a0a] p-4">
              <ThemedText
                className={`mb-2 text-center ${isSecureContextHintMessage(cameraError) ? 'text-[#a3a3a3]' : 'text-red-400'}`}
              >
                {cameraError}
              </ThemedText>
              <button type="button" onClick={() => start()} className="text-sm font-semibold text-moxe-primary">
                Try again
              </button>
            </div>
          )}

          {!cameraError && (
            <>
              {isActive && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                  <ThemedText className="text-sm text-[#737373]">Starting camera…</ThemedText>
                </div>
              )}
              {isRecording && (
                <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded bg-red-500/90 px-2 py-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <ThemedText className="text-xs font-medium text-white">Recording</ThemedText>
                </div>
              )}
            </>
          )}

          {/* Left vertical tools (reels-style) */}
          <div className="pointer-events-auto absolute bottom-36 left-2 top-24 z-10 flex flex-col gap-5">
            <Link to="/stories/create/music" className="flex flex-col items-center gap-0.5 text-white drop-shadow-md">
              <Music className="h-6 w-6" />
              <span className="max-w-[52px] text-center text-[9px] font-medium leading-tight">Audio</span>
            </Link>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white drop-shadow-md">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/80 text-[10px] font-bold">
                {reelLengthSec}
              </span>
              <span className="text-[9px] font-medium">Length</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white drop-shadow-md">
              <Gauge className="h-6 w-6" />
              <span className="text-[9px] font-medium">1x</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white drop-shadow-md">
              <LayoutGrid className="h-6 w-6" />
              <span className="text-[9px] font-medium">Layout</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5 text-white drop-shadow-md">
              <StopCircle className="h-6 w-6" />
              <span className="text-[9px] font-medium">Timer</span>
            </button>
            <label className="flex cursor-pointer flex-col items-center gap-0.5 text-white/90 drop-shadow-md">
              <input
                type="checkbox"
                checked={greenScreenBeta}
                onChange={(e) => setGreenScreenBeta(e.target.checked)}
                className="sr-only"
              />
              <span className="text-[9px] font-medium">Green</span>
            </label>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="z-20 flex flex-col gap-3 bg-gradient-to-t from-black via-black/90 to-transparent safe-area-pb pt-2">
          <div className="flex items-center justify-between px-6">
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-[#262626] ring-1 ring-white/20"
              aria-label="Open gallery"
            >
              <ImageIcon className="h-6 w-6 text-[#a8a8a8]" />
              <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-moxe-primary text-[10px] font-bold leading-none text-white">
                +
              </span>
            </button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onGalleryFiles}
            />

            <button
              type="button"
              onClick={handleCapture}
              disabled={!isActive && !isRecording}
              className={`relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-[4px] border-white transition-transform ${
                isRecording ? 'scale-110 border-red-500 bg-red-500' : 'bg-transparent'
              }`}
              aria-label={isRecording ? 'Stop' : 'Record'}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-[#F77737] via-[#E1306C] to-[#833AB4] ${
                  isRecording ? 'rounded-md bg-white' : ''
                }`}
              >
                {isRecording ? (
                  <span className="h-4 w-4 rounded-sm bg-white" />
                ) : (
                  <Clapperboard className="h-6 w-6 text-white" />
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchCamera()}
              className="rounded-md p-2 text-white"
              aria-label="Flip camera"
            >
              <RefreshCw className="h-7 w-7" />
            </button>
          </div>

          <InCameraModePill value={mode} onChange={setMode} className="pb-1" />
        </div>
      </div>
    </ThemedView>
  );
}
