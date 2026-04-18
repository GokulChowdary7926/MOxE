import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { getApiBase, getUploadUrl } from '../../services/api';
import { useCamera } from '../../hooks/useCamera';
import { startCanvasRecording } from '../../lib/reelCompositeRecord';
import { canUseMediaDevices, isSecureContextHintMessage } from '../../utils/browserFeatures';
import { messageFromUnknown, userFacingApiError, userFacingUploadError } from '../../utils/userFacingErrors';

const API_BASE = getApiBase();

const REEL_TEMPLATES: { id: string; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'safe-center', label: 'Safe center' },
  { id: 'lower-thirds', label: 'Lower thirds' },
  { id: 'split', label: 'Split hint' },
];

export default function CreateReel() {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { file?: File } };
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [startMs, setStartMs] = useState(0);
  const [endMs, setEndMs] = useState(15000);
  const [mute, setMute] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<'original' | 'vivid' | 'mono' | 'warm'>('original');
  const [templateId, setTemplateId] = useState('none');
  const [isSubscriberOnly, setIsSubscriberOnly] = useState(false);
  const [subscriberTierKeys, setSubscriberTierKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const secondVideoRef = useRef<HTMLVideoElement>(null);
  const compositeRecorderRef = useRef<MediaRecorder | null>(null);
  const compositeChunksRef = useRef<Blob[]>([]);
  const compositeStopDrawingRef = useRef<(() => void) | null>(null);

  const [greenScreen, setGreenScreen] = useState(false);
  const [dualCamera, setDualCamera] = useState(false);
  const [greenScreenBg, setGreenScreenBg] = useState('#1a1a1a');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [pendingCountdown, setPendingCountdown] = useState<number | null>(null);
  const [alignGhostUrl, setAlignGhostUrl] = useState<string | null>(null);
  const [pipStream, setPipStream] = useState<MediaStream | null>(null);
  const [isCompositeRecording, setIsCompositeRecording] = useState(false);

  const {
    stream,
    error: cameraError,
    isActive,
    isRecording,
    facingMode,
    start,
    stop,
    capturePhoto,
    startRecording,
    stopRecording,
    switchCamera,
  } = useCamera({
    video: true,
    audio: true,
  });

  useEffect(() => {
    const stateFile = location.state?.file;
    if (stateFile) setFile(stateFile);
  }, [location.state?.file]);

  useEffect(() => {
    if (showCamera) {
      start();
      return () => stop();
    }
  }, [showCamera]);

  useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (secondVideoRef.current && pipStream) secondVideoRef.current.srcObject = pipStream;
  }, [pipStream]);

  useEffect(() => {
    if (!showCamera || !dualCamera) {
      setPipStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
      return;
    }
    if (!canUseMediaDevices()) {
      setPipStream(null);
      return;
    }
    let cancelled = false;
    let ms: MediaStream | null = null;
    const opposite = facingMode === 'user' ? 'environment' : 'user';
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: opposite, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        ms = s;
        setPipStream(s);
      })
      .catch(() => setPipStream(null));
    return () => {
      cancelled = true;
      ms?.getTracks().forEach((t) => t.stop());
    };
  }, [showCamera, dualCamera, facingMode]);

  const beginRecording = useCallback(() => {
    if (!stream || !videoRef.current) return;
    if (greenScreen || dualCamera) {
      const { mediaStream, stopDrawing } = startCanvasRecording(videoRef.current, {
        chromaKey: greenScreen,
        chromaBackground: greenScreenBg,
        secondaryVideo: dualCamera ? secondVideoRef.current : null,
        pipRect: dualCamera ? { rx: 0.58, ry: 0.08, rw: 0.38, rh: 0.22 } : undefined,
        audioTrack: stream.getAudioTracks()[0] ?? null,
      });
      compositeStopDrawingRef.current = stopDrawing;
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const rec = new MediaRecorder(mediaStream, { mimeType: mime, videoBitsPerSecond: 2500000 });
      compositeChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) compositeChunksRef.current.push(e.data);
      };
      rec.start(200);
      compositeRecorderRef.current = rec;
      setIsCompositeRecording(true);
    } else {
      startRecording();
    }
  }, [stream, greenScreen, dualCamera, greenScreenBg, startRecording]);

  useEffect(() => {
    if (pendingCountdown === null || pendingCountdown < 0) return;
    if (pendingCountdown === 0) {
      beginRecording();
      setPendingCountdown(null);
      return;
    }
    const id = window.setTimeout(() => setPendingCountdown((c) => (c == null ? null : c - 1)), 1000);
    return () => clearTimeout(id);
  }, [pendingCountdown, beginRecording]);

  const onPressRecord = () => {
    if (isRecording || isCompositeRecording) return;
    if (countdownSeconds > 0) {
      setPendingCountdown(countdownSeconds);
    } else {
      beginRecording();
    }
  };

  const captureAlignFrame = async () => {
    const blob = await capturePhoto();
    if (blob) {
      const url = URL.createObjectURL(blob);
      setAlignGhostUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }
  };

  async function handleRecordDone() {
    if (isCompositeRecording && compositeRecorderRef.current) {
      compositeStopDrawingRef.current?.();
      compositeStopDrawingRef.current = null;
      const rec = compositeRecorderRef.current;
      const blob = await new Promise<Blob | null>((resolve) => {
        rec.onstop = () => {
          const b = compositeChunksRef.current.length
            ? new Blob(compositeChunksRef.current, { type: 'video/webm' })
            : null;
          compositeChunksRef.current = [];
          resolve(b);
        };
        rec.stop();
      });
      compositeRecorderRef.current = null;
      setIsCompositeRecording(false);
      if (blob) {
        setFile(new File([blob], `reel-${Date.now()}.webm`, { type: 'video/webm' }));
        setShowCamera(false);
      }
      stop();
      return;
    }
    const blob = await stopRecording();
    if (blob) {
      setFile(new File([blob], `reel-${Date.now()}.webm`, { type: 'video/webm' }));
      setShowCamera(false);
    }
    stop();
  }

  async function handleShare() {
    try {
      setError(null);
      if (!file) {
        setError('Please add a video first.');
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create a reel.');
        return;
      }
      setLoading(true);
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch(getUploadUrl(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!uploadRes.ok) {
        throw new Error(await userFacingUploadError(uploadRes, 'Could not upload your video.'));
      }
      const uploadData = (await uploadRes.json().catch(() => ({}))) as { url?: string };
      if (!uploadData.url) {
        throw new Error('Could not upload your video.');
      }
      const body = {
        media: [{ url: uploadData.url }],
        caption: caption || undefined,
        altText: altText.trim() || undefined,
        speed,
        edits: {
          trimStartMs: startMs,
          trimEndMs: endMs,
          mute,
          filter,
        },
        effects: {
          templateId: templateId === 'none' ? undefined : templateId,
          editor: {
            greenScreen,
            dualCamera,
            recordCountdownSec: countdownSeconds,
            alignUsed: !!alignGhostUrl,
          },
        },
        ...(isSubscriberOnly && {
          isSubscriberOnly: true,
          subscriberTierKeys: subscriberTierKeys.length > 0 ? subscriberTierKeys : undefined,
        }),
      };
      const res = await fetch(`${API_BASE}/reels`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(await userFacingApiError(res, 'Could not publish your reel.'));
      }
      navigate('/');
    } catch (e: unknown) {
      setError(messageFromUnknown(e, 'Could not publish your reel.'));
    } finally {
      setLoading(false);
    }
  }

  const recordingActive = isRecording || isCompositeRecording;

  const filePreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const templateOverlayClass =
    templateId === 'safe-center'
      ? 'ring-4 ring-white/40 ring-inset rounded-moxe-md'
      : templateId === 'lower-thirds'
        ? 'bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none'
        : templateId === 'split'
          ? 'border-x-4 border-dashed border-white/25 pointer-events-none'
          : '';

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20" data-testid="reel-studio">
      <ThemedHeader
        title="Create reel"
        left={
          <Link to="/" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
        right={
          <ThemedButton
            label={loading ? 'Posting…' : 'Post'}
            onClick={handleShare}
            disabled={loading}
            className="px-3 py-1 text-xs"
            data-testid="reel-studio-post"
          />
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {error && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}

        <div>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Template (metadata + framing guide)
          </ThemedText>
          <div className="flex flex-wrap gap-2">
            {REEL_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                data-testid={`reel-template-chip-${t.id}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  templateId === t.id
                    ? 'bg-moxe-primary border-moxe-primary text-white'
                    : 'border-moxe-border text-moxe-body'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="sr-only" data-testid="active-template-id" data-template-id={templateId} />
        </div>

        <label className="w-full aspect-[9/16] bg-moxe-surface rounded-moxe-md border border-moxe-border flex flex-col items-center justify-center cursor-pointer overflow-hidden">
          {file && filePreviewUrl ? (
            <div data-testid="reel-canvas" className="w-full h-full min-h-[200px]">
            <video
              src={filePreviewUrl}
              className="w-full h-full object-cover"
              muted
              controls
            />
            </div>
          ) : (
            <div className="text-center text-moxe-textSecondary space-y-3">
              <div className="w-16 h-16 rounded-full bg-moxe-background flex items-center justify-center mx-auto text-2xl">
                ＋
              </div>
              <ThemedText secondary className="block text-moxe-body">
                Tap to add a video
              </ThemedText>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowCamera(true);
                }}
                className="flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-body text-sm"
                data-testid="reel-open-camera"
              >
                <Camera className="w-5 h-5" />
                Record with camera
              </button>
            </div>
          )}
          <input
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
            }}
          />
        </label>

        <div className="space-y-3">
          <div>
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Caption
            </ThemedText>
            <ThemedInput
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption…"
            />
          </div>
          <div>
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Alt text (accessibility)
            </ThemedText>
            <ThemedInput
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe this video for people using screen readers"
            />
          </div>
          <div className="border border-moxe-border rounded-moxe-md p-3 space-y-2 text-[11px]">
            <ThemedText secondary className="text-moxe-caption mb-1 block">
              Video editing (metadata; server stores trim/speed/filter)
            </ThemedText>
            <div className="flex items-center gap-2">
              <span className="w-20">Trim start (ms)</span>
              <input
                type="number"
                value={startMs}
                onChange={(e) => setStartMs(Number(e.target.value) || 0)}
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20">Trim end (ms)</span>
              <input
                type="number"
                value={endMs}
                onChange={(e) => setEndMs(Number(e.target.value) || 0)}
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
              />
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mute}
                onChange={(e) => setMute(e.target.checked)}
                className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
              />
              <span>Mute audio</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="w-20">Speed</span>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value) || 1)}
                className="flex-1"
                data-testid="reel-speed-slider"
              />
              <span data-testid="reel-speed-value">{speed.toFixed(2)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20">Filter</span>
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as 'original' | 'vivid' | 'mono' | 'warm')
                }
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-body"
              >
                <option value="original">Original</option>
                <option value="vivid">Vivid</option>
                <option value="mono">Mono</option>
                <option value="warm">Warm</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-moxe-body">
            <input
              type="checkbox"
              checked={isSubscriberOnly}
              onChange={(e) => setIsSubscriberOnly(e.target.checked)}
              className="w-4 h-4 rounded border-moxe-border bg-moxe-background"
            />
            Subscribers only
          </label>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-3 safe-area-pt">
            <button
              type="button"
              onClick={() => {
                if (isCompositeRecording && compositeRecorderRef.current) {
                  compositeStopDrawingRef.current?.();
                  compositeRecorderRef.current.stop();
                  compositeRecorderRef.current = null;
                  setIsCompositeRecording(false);
                }
                stop();
                setShowCamera(false);
                setPendingCountdown(null);
              }}
              className="text-white font-medium"
            >
              Cancel
            </button>
            <span className="text-white font-semibold">Record reel</span>
            {recordingActive ? (
              <button type="button" onClick={handleRecordDone} className="text-red-400 font-semibold">
                Done
              </button>
            ) : (
              <div className="w-12" />
            )}
          </div>
          <div className="flex-1 relative min-h-0 px-2 pt-2">
            <div className="absolute inset-x-2 top-2 bottom-0 rounded-lg overflow-hidden bg-black">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <ThemedText
                    className={`text-center mb-2 ${isSecureContextHintMessage(cameraError) ? 'text-[#a3a3a3]' : 'text-red-400'}`}
                  >
                    {cameraError}
                  </ThemedText>
                  <button type="button" onClick={() => start()} className="text-[#0095f6] text-sm font-semibold">
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  {stream && (
                    <div className="absolute inset-0">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {templateId !== 'none' && (
                        <div className={`absolute inset-0 pointer-events-none ${templateOverlayClass}`} />
                      )}
                      {alignGhostUrl && recordingActive && (
                        <img
                          src={alignGhostUrl}
                          alt=""
                          data-testid="reel-align-ghost"
                          className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
                        />
                      )}
                      {pipStream && dualCamera && (
                        <video
                          ref={secondVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="absolute right-2 top-12 w-[34%] rounded-lg border-2 border-white/60 object-cover aspect-video z-10 bg-black"
                        />
                      )}
                    </div>
                  )}
                  {!stream && (
                    <div className="absolute inset-0 flex items-center justify-center text-moxe-textSecondary text-sm">
                      Starting camera…
                    </div>
                  )}
                  {pendingCountdown !== null && pendingCountdown > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
                      <span
                        className="text-white text-7xl font-bold tabular-nums"
                        data-testid="reel-timer-countdown"
                      >
                        {pendingCountdown}
                      </span>
                    </div>
                  )}
                  {recordingActive && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/90 z-10">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-xs font-medium">Recording</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="px-4 py-2 space-y-2 bg-black/80 max-h-[40vh] overflow-y-auto">
            <div className="flex flex-wrap gap-2 text-xs">
              <label className="flex items-center gap-1 text-white">
                <input
                  type="checkbox"
                  checked={greenScreen}
                  onChange={(e) => setGreenScreen(e.target.checked)}
                  className="rounded border-white/40"
                  data-testid="reel-green-screen-toggle"
                />
                Green screen (beta)
              </label>
              {greenScreen ? (
                <span data-testid="reel-green-screen-active" className="text-emerald-400 text-[10px] font-medium">
                  GS on
                </span>
              ) : null}
              <label className="flex items-center gap-1 text-white">
                <input
                  type="checkbox"
                  checked={dualCamera}
                  onChange={(e) => setDualCamera(e.target.checked)}
                  className="rounded border-white/40"
                />
                Dual camera (PiP)
              </label>
              <label className="flex items-center gap-1 text-white">
                <span className="text-white/70">BG</span>
                <input
                  type="color"
                  value={greenScreenBg}
                  onChange={(e) => setGreenScreenBg(e.target.value)}
                  className="w-8 h-6 rounded border-0"
                />
              </label>
              <span className="text-white/70">Timer</span>
              <select
                value={countdownSeconds}
                onChange={(e) => setCountdownSeconds(Number(e.target.value))}
                className="bg-[#262626] text-white rounded px-2 py-0.5"
                data-testid="reel-timer-select"
              >
                <option value={0}>Off</option>
                <option value={3}>3s</option>
                <option value={5}>5s</option>
              </select>
              <button
                type="button"
                onClick={switchCamera}
                className="px-2 py-0.5 rounded bg-[#262626] text-white"
              >
                Flip cam
              </button>
              <button
                type="button"
                onClick={captureAlignFrame}
                disabled={!isActive}
                className="px-2 py-0.5 rounded bg-[#262626] text-white disabled:opacity-50"
                data-testid="reel-align-snap"
              >
                Align snap
              </button>
            </div>
          </div>

          <div className="p-4 safe-area-pb bg-black/50">
            {!recordingActive ? (
              <button
                type="button"
                onClick={onPressRecord}
                disabled={!isActive || pendingCountdown !== null}
                className="w-16 h-16 rounded-full border-4 border-white bg-transparent mx-auto block disabled:opacity-50"
                aria-label="Start recording"
                data-testid="reel-record-start"
              />
            ) : (
              <button
                type="button"
                onClick={handleRecordDone}
                className="w-16 h-16 rounded-full border-4 border-red-500 bg-red-500 mx-auto block flex items-center justify-center"
                aria-label="Stop recording"
                data-testid="reel-record-stop"
              >
                <span className="w-6 h-6 rounded bg-white" />
              </button>
            )}
          </div>
        </div>
      )}
    </ThemedView>
  );
}
