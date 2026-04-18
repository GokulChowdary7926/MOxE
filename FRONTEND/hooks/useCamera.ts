import { useState, useCallback, useRef, useEffect } from 'react';
import { canUseMediaDevices, MEDIA_DEVICES_HTTPS_HINT, normalizeCameraError } from '../utils/browserFeatures';

export type FacingMode = 'user' | 'environment';

export type UseCameraOptions = {
  /** Request video (and optionally audio) for preview/capture. */
  video?: boolean | MediaTrackConstraints;
  /** Request audio (e.g. for video recording). */
  audio?: boolean;
  /** Preferred facing mode for video. */
  facingMode?: FacingMode;
};

export type UseCameraResult = {
  /** Live MediaStream when started, null otherwise. */
  stream: MediaStream | null;
  /** Error message if getUserMedia or switch failed. */
  error: string | null;
  /** Whether the camera is currently active. */
  isActive: boolean;
  /** Current facing mode. */
  facingMode: FacingMode;
  /** Start camera with optional constraints. */
  start: (overrides?: { video?: boolean | MediaTrackConstraints; audio?: boolean; facingMode?: FacingMode }) => Promise<void>;
  /** Stop all tracks. */
  stop: () => void;
  /** Capture a single frame from the current video stream as a Blob (image/png). Returns null if no video track. */
  capturePhoto: () => Promise<Blob | null>;
  /** Start recording video; stop with stopRecording(). */
  startRecording: () => void;
  /** Stop recording and resolve with the recorded Blob (video/webm). */
  stopRecording: () => Promise<Blob | null>;
  /** True while recording. */
  isRecording: boolean;
  /** Switch between front and back camera (only if supported). */
  switchCamera: () => Promise<void>;
};

const defaultVideo: MediaTrackConstraints = { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } };

export function useCamera(options: UseCameraOptions = {}): UseCameraResult {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>(options.facingMode ?? 'user');
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const getVideoConstraints = useCallback(
    (mode?: FacingMode): MediaTrackConstraints => {
      const modeToUse = mode ?? facingMode;
      if (typeof options.video === 'object' && options.video !== null) {
        return { ...options.video, facingMode: modeToUse };
      }
      return { ...defaultVideo, facingMode: modeToUse };
    },
    [facingMode, options.video]
  );

  const start = useCallback(
    async (overrides?: { video?: boolean | MediaTrackConstraints; audio?: boolean; facingMode?: FacingMode }) => {
      setError(null);
      if (!canUseMediaDevices()) {
        setError(MEDIA_DEVICES_HTTPS_HINT);
        setStream(null);
        return;
      }
      const video = overrides?.video ?? options.video ?? true;
      const audio = overrides?.audio ?? options.audio ?? false;
      const mode = overrides?.facingMode ?? facingMode;
      const constraints: MediaStreamConstraints = {
        video: video === true ? getVideoConstraints(mode) : typeof video === 'object' ? { ...video, facingMode: mode } : false,
        audio: !!audio,
      };
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);
        setFacingMode(mode);
      } catch (e: unknown) {
        setError(normalizeCameraError(e));
        setStream(null);
      }
    },
    [options.video, options.audio, facingMode, getVideoConstraints]
  );

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    recorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const switchCamera = useCallback(async () => {
    const nextMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    await start({ video: true, audio: !!options.audio, facingMode: nextMode });
  }, [facingMode, stream, options.audio, start]);

  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    const tracks = stream?.getVideoTracks();
    if (!stream || !tracks?.length) return null;
    return new Promise((resolve) => {
      const videoEl = document.createElement('video');
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.srcObject = stream;
      videoEl.play().then(() => {
        requestAnimationFrame(() => {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(videoEl, 0, 0);
          canvas.toBlob(
            (blob) => {
              videoEl.srcObject = null;
              resolve(blob);
            },
            'image/png',
            0.92
          );
        });
      }).catch(() => resolve(null));
    });
  }, [stream]);

  const startRecording = useCallback(() => {
    if (!stream || isRecording) return;
    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];
    const recStream = new MediaStream();
    if (videoTrack) recStream.addTrack(videoTrack);
    if (audioTrack) recStream.addTrack(audioTrack);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const recorder = new MediaRecorder(recStream, { mimeType: mime, videoBitsPerSecond: 2500000 });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    recorder.start(200);
    recorderRef.current = recorder;
    setIsRecording(true);
  }, [stream, isRecording]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false);
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        setIsRecording(false);
        recorderRef.current = null;
        const blob = chunksRef.current.length ? new Blob(chunksRef.current, { type: 'video/webm' }) : null;
        chunksRef.current = [];
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  return {
    stream,
    error,
    isActive: !!stream,
    facingMode,
    start,
    stop,
    capturePhoto,
    startRecording,
    stopRecording,
    isRecording,
    switchCamera,
  };
}
