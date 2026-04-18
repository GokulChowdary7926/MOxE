/**
 * Browser-gated APIs: geolocation and camera/mic require a secure context (HTTPS),
 * except localhost / loopback. Calling them on plain HTTP to a public IP (e.g. EC2) causes
 * console errors — we must not invoke the APIs at all.
 */

function isLoopbackHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h === '[::1]') return true;
  if (h === '127.0.0.1') return true;
  // 127.0.0.0/8 — common dev bindings
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/** True when the page origin may use geolocation / getUserMedia per typical browser rules. */
export function canUseBrowserGeolocation(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('geolocation' in navigator)) return false;

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  // Plain HTTP to anything that is not loopback: browsers block geolocation (no API calls).
  if (protocol === 'http:' && !isLoopbackHostname(hostname)) {
    return false;
  }

  if (window.isSecureContext) return true;
  return isLoopbackHostname(hostname);
}

/** Camera/mic — same origin rules as geolocation in modern browsers. */
export function canUseMediaDevices(): boolean {
  if (typeof window === 'undefined') return false;
  const md = navigator.mediaDevices;
  if (!md || typeof md.getUserMedia !== 'function') return false;

  const protocol = window.location.protocol;
  const hostname = window.location.hostname;

  if (protocol === 'http:' && !isLoopbackHostname(hostname)) {
    return false;
  }

  if (window.isSecureContext) return true;
  return isLoopbackHostname(hostname);
}

/** Shown in UI — short, non-alarming (pair with neutral styling where possible). */
export const GEOLOCATION_HTTPS_HINT =
  'Location needs a secure connection (HTTPS).';

export const MEDIA_DEVICES_HTTPS_HINT =
  'Camera needs a secure connection (HTTPS).';

/** Map low-level browser errors (e.g. `undefined is not an object … getUserMedia`) to safe copy. */
export function normalizeCameraError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const insecure =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'http:' && !isLoopbackHostname(window.location.hostname));
  if (insecure) return MEDIA_DEVICES_HTTPS_HINT;
  if (/mediaDevices|getUserMedia|undefined is not an object|NotReadableError|TrackStartError/i.test(msg)) {
    return MEDIA_DEVICES_HTTPS_HINT;
  }
  if (/permission|denied|NotAllowedError|Permission dismissed/i.test(msg)) {
    return 'Allow camera access in your browser or system settings.';
  }
  const t = msg.trim();
  if (!t || /TypeError|ReferenceError|undefined is not an object/i.test(t)) {
    return MEDIA_DEVICES_HTTPS_HINT;
  }
  return t.length > 120 ? MEDIA_DEVICES_HTTPS_HINT : t;
}

/** Use neutral (non-red) styling for expected HTTPS / secure-context hints. */
export function isSecureContextHintMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  return /HTTPS|secure connection|localhost for testing/i.test(message);
}
