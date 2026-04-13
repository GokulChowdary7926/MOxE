/** Client-side chroma-style key (green screen) + optional PiP second camera for reel recording. */

export type PipRect = { rx: number; ry: number; rw: number; rh: number };

export type CompositeRecordOptions = {
  chromaKey?: boolean;
  /** Background color for keyed regions (hex #rrggbb or #rgb). */
  chromaBackground?: string;
  secondaryVideo?: HTMLVideoElement | null;
  pipRect?: PipRect;
  audioTrack?: MediaStreamTrack | null;
};

function parseHexColor(hex: string): [number, number, number] {
  const h = hex.replace('#', '').trim();
  if (h.length === 3) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)];
  }
  if (h.length >= 6) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  return [26, 26, 26];
}

function isGreenPixel(r: number, g: number, b: number): boolean {
  return g > 85 && g > r * 1.12 && g > b * 1.12 && r < 130 && b < 130;
}

/**
 * Draws `sourceVideo` to a canvas each frame, optionally replaces green backdrop with `chromaBackground`,
 * optionally composites `secondaryVideo` in a PiP rectangle. Returns a MediaStream suitable for MediaRecorder.
 */
export function startCanvasRecording(
  sourceVideo: HTMLVideoElement,
  opts: CompositeRecordOptions,
): { mediaStream: MediaStream; stopDrawing: () => void } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    const empty = new MediaStream();
    return { mediaStream: empty, stopDrawing: () => {} };
  }

  const [br, bg, bb] = parseHexColor(opts.chromaBackground || '#1a1a1a');
  let raf = 0;
  let stopped = false;

  const draw = () => {
    if (stopped) return;
    if (!sourceVideo.videoWidth || !sourceVideo.videoHeight) {
      raf = requestAnimationFrame(draw);
      return;
    }
    if (canvas.width !== sourceVideo.videoWidth || canvas.height !== sourceVideo.videoHeight) {
      canvas.width = sourceVideo.videoWidth;
      canvas.height = sourceVideo.videoHeight;
    }
    const cw = canvas.width;
    const ch = canvas.height;

    if (opts.chromaKey) {
      ctx.drawImage(sourceVideo, 0, 0, cw, ch);
      const img = ctx.getImageData(0, 0, cw, ch);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        if (isGreenPixel(d[i]!, d[i + 1]!, d[i + 2]!)) {
          d[i] = br;
          d[i + 1] = bg;
          d[i + 2] = bb;
        }
      }
      ctx.putImageData(img, 0, 0);
    } else {
      ctx.drawImage(sourceVideo, 0, 0, cw, ch);
    }

    const sec = opts.secondaryVideo;
    if (sec && sec.srcObject && opts.pipRect && sec.videoWidth > 0) {
      const pr = opts.pipRect;
      const px = pr.rx * cw;
      const py = pr.ry * ch;
      const pw = pr.rw * cw;
      const ph = pr.rh * ch;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = Math.max(2, cw / 400);
      ctx.drawImage(sec, px, py, pw, ph);
      ctx.strokeRect(px, py, pw, ph);
      ctx.restore();
    }

    raf = requestAnimationFrame(draw);
  };

  raf = requestAnimationFrame(draw);
  const videoStream = canvas.captureStream(30);
  const out = new MediaStream();
  videoStream.getVideoTracks().forEach((t) => out.addTrack(t));
  if (opts.audioTrack) out.addTrack(opts.audioTrack);

  return {
    mediaStream: out,
    stopDrawing: () => {
      stopped = true;
      cancelAnimationFrame(raf);
    },
  };
}

/** Apply green-screen style replacement to a captured image blob (story photo). */
export async function chromaKeyBlobToPng(blob: Blob, backgroundHex = '#1a1a1a'): Promise<Blob | null> {
  const [br, bg, bb] = parseHexColor(backgroundHex);
  const bitmap = await createImageBitmap(blob).catch(() => null);
  if (!bitmap) return null;
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    bitmap.close?.();
    return null;
  }
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (isGreenPixel(d[i]!, d[i + 1]!, d[i + 2]!)) {
      d[i] = br;
      d[i + 1] = bg;
      d[i + 2] = bb;
    }
  }
  ctx.putImageData(img, 0, 0);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png', 0.92));
}
