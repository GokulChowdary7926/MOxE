import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, RefreshCw, Type, Infinity, LayoutGrid, Sparkles, Circle, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { useCamera } from '../../hooks/useCamera';

type ContentMode = 'POST' | 'STORY' | 'REEL' | 'LIVE';

/**
 * Creation page of camera – real camera preview and capture.
 * Top: X, flash, camera switch. Right sidebar: Create, Boomerang, Layout, AI Images, Hands-free, Close.
 * Bottom: gallery thumb, shutter (photo or record), mode selector (POST/STORY/REEL/LIVE).
 */
export default function CameraPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = React.useState<ContentMode>('STORY');
  const [flashOff, setFlashOff] = React.useState(true);

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

  const handleSwitchCamera = () => {
    switchCamera();
  };

  const blobToFile = (blob: Blob, name: string, mime: string): File => {
    return new File([blob], name, { type: mime });
  };

  const handleCapture = async () => {
    if (mode === 'REEL' || mode === 'LIVE') {
      if (isRecording) {
        const blob = await stopRecording();
        if (blob) {
          const file = blobToFile(blob, `reel-${Date.now()}.webm`, 'video/webm');
          navigate('/create/reel', { state: { file } });
        }
      } else {
        startRecording();
      }
      return;
    }
    // Photo for POST / STORY
    const blob = await capturePhoto();
    if (blob) {
      const file = blobToFile(blob, `capture-${Date.now()}.png`, 'image/png');
      if (mode === 'STORY') {
        navigate('/stories/create/editor', { state: { file } });
      } else {
        navigate('/stories/create/editor', { state: { file } });
      }
    }
  };

  const modes: ContentMode[] = ['POST', 'STORY', 'REEL', 'LIVE'];

  return (
    <ThemedView className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="w-full max-w-[428px] h-full flex flex-col mx-auto">
        <div className="flex items-center justify-between px-4 py-3 safe-area-pt">
          <button type="button" onClick={() => { stop(); navigate(-1); }} className="p-2 -m-2 text-white" aria-label="Close">
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
          <button type="button" onClick={handleSwitchCamera} className="p-2 -m-2 text-white" aria-label="Switch camera">
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex min-h-0 relative">
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] p-4 z-10">
              <ThemedText className="text-red-400 text-center mb-2">{cameraError}</ThemedText>
              <button type="button" onClick={() => start()} className="text-[#0095f6] text-sm font-semibold">
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
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                  <ThemedText secondary className="text-[#737373] text-sm">Starting camera…</ThemedText>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/90 z-10">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <ThemedText className="text-white text-xs font-medium">Recording</ThemedText>
                </div>
              )}
            </>
          )}

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
        </div>

        <div className="flex items-center justify-between px-4 py-3 safe-area-pb bg-black/50">
          <button
            type="button"
            onClick={() => { stop(); navigate('/stories/create'); }}
            className="w-12 h-12 rounded-lg bg-[#262626] border border-[#363636] flex items-center justify-center"
          >
            <ImageIcon className="w-6 h-6 text-[#737373]" />
          </button>
          <button
            type="button"
            onClick={handleCapture}
            disabled={!isActive && !isRecording}
            className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
              isRecording ? 'bg-red-500 border-red-500 scale-110' : 'border-white bg-transparent'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Capture'}
          >
            {isRecording && <span className="w-6 h-6 rounded bg-white" />}
          </button>
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
