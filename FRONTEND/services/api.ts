import { parseApiErrorBody } from '../utils/readApiError';

/**
 * Central API client for MOxE frontend.
 * All backend calls should use getApiBase() and include auth via getAuthHeaders() when available.
 * On 401, token is cleared and user is redirected to login.
 *
 * Dev (Vite): default `VITE_API_URL` is unset → base is `/api` and Vite proxies to the backend
 * (see vite.config.ts), so the browser uses same-origin requests and CORS does not apply.
 * Set `VITE_API_URL=http://localhost:5007/api` to call the backend directly instead.
 */

/** Shown on Login when the API is unreachable; keep in sync with `vite.config.ts` proxy target. */
export const DEV_API_START_HINT =
  'Start the API: cd BACKEND && npm run dev (listens on port 5007). Open the web app at http://localhost:3001 so /api is proxied, or set VITE_API_URL=http://127.0.0.1:5007/api';

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '/api';
  }
  return 'http://localhost:5007/api';
}

/** Backend origin for Socket.IO (no `/api`). In dev with Vite, use the dev server origin so `/socket.io` is proxied to the API. */
export function getBackendOrigin(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return window.location.origin;
    }
    return 'http://127.0.0.1:3001';
  }
  return 'http://localhost:5007';
}

/** POST `/upload` is not under `/api`; use this for multipart uploads. */
export function getUploadUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.length > 0) {
    const origin = fromEnv.replace(/\/api\/?$/, '').replace(/\/$/, '');
    return `${origin}/upload`;
  }
  if (import.meta.env.DEV) {
    return '/upload';
  }
  return 'http://localhost:5007/upload';
}

/**
 * Absolute URL for fetch/`new URL` when path is under the API (handles relative `/api` in dev).
 */
export function getApiFullUrl(path: string): string {
  const p = path.replace(/^\//, '');
  const base = getApiBase().replace(/\/$/, '');
  const combined = `${base}/${p}`;
  if (combined.startsWith('http')) return combined;
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:3001${combined.startsWith('/') ? combined : `/${combined}`}`;
  }
  return new URL(combined, window.location.origin).href;
}

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem('token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/** Clear auth and redirect to login. Call on 401 when auth is required. */
export function handle401(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('token');
  }
  const base = typeof window !== 'undefined' ? (window as any).__MOXE_BASE__ ?? '' : '';
  const loginPath = `${base}/login`.replace(/\/+/g, '/');
  if (typeof window !== 'undefined' && window.location.pathname !== loginPath) {
    window.location.href = loginPath;
  }
}

export type FetchApiOptions = RequestInit & {
  skipAuth?: boolean;
  /** If false (default), 401 triggers handle401(). Set true for public endpoints. */
  skip401Redirect?: boolean;
};

/**
 * Fetch with base URL and optional Bearer token.
 * On 401 (and !skip401Redirect), clears token and redirects to /login.
 */
export async function fetchApi(
  path: string,
  options: FetchApiOptions = {}
): Promise<Response> {
  const { skipAuth, skip401Redirect, ...init } = options;
  const base = getApiBase();
  const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = new Headers(init.headers as HeadersInit);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!skipAuth && getToken()) headers.set('Authorization', `Bearer ${getToken()}`);
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !skip401Redirect && !skipAuth) {
    handle401();
  }
  return res;
}

/**
 * Convenience: fetch JSON with auth. Returns parsed body or throws on non-2xx.
 * On 401, redirects to login before throwing.
 */
export async function fetchApiJson<T = unknown>(path: string, options: FetchApiOptions = {}): Promise<T> {
  const res = await fetchApi(path, options);
  const text = await res.text();
  let data: unknown = {};
  if (text) {
    try {
      data = JSON.parse(text) as object;
    } catch {
      data = {};
    }
  }
  const errObj = data as { error?: string };
  if (res.status === 401) {
    throw new Error(errObj.error || 'Session expired. Please log in again.');
  }
  if (!res.ok) {
    throw new Error(errObj.error || parseApiErrorBody(text, res.statusText, res.status));
  }
  return data as T;
}

/** Best-effort: record a recent search for Your activity (does not throw). */
export function recordRecentSearchServer(type: string, term: string, refId?: string | null): void {
  if (!getToken() || !term.trim()) return;
  void fetchApi('activity/recent-searches', {
    method: 'POST',
    body: JSON.stringify({ type, term: term.trim(), refId: refId ?? undefined }),
  }).catch(() => {});
}

/** Best-effort: record an opened http(s) link for Your activity → Link history. */
export function recordLinkOpenServer(url: string, title?: string | null): void {
  if (!getToken() || !url.trim()) return;
  void fetchApi('activity/link-history', {
    method: 'POST',
    body: JSON.stringify({ url: url.trim(), title: title ?? undefined }),
  }).catch(() => {});
}

export type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  /** If true, do not parse response as JSON (e.g. for blob). */
  raw?: boolean;
  /** If true, 401 does not trigger handle401 redirect. */
  skip401Redirect?: boolean;
  /** JSON-serializable object, FormData, or standard fetch body. */
  body?: unknown;
};

/**
 * Job tools API helper: path is relative to API_BASE (no leading /api).
 * - GET: returns parsed JSON.
 * - POST/PUT/PATCH with JSON body: sends JSON, returns parsed JSON.
 * - body as FormData: sends multipart, returns parsed JSON (no Content-Type header).
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { raw, skip401Redirect, body: bodyOpt, ...init } = options;
  const normalizedPath = path.replace(/^\/api\/?/, '').replace(/^\//, '');
  const base = getApiBase();
  const url = `${base.replace(/\/$/, '')}/${normalizedPath}`;
  const headers = new Headers(init.headers as HeadersInit);
  if (getToken()) headers.set('Authorization', `Bearer ${getToken()}`);
  const isFormData = bodyOpt instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let body: BodyInit | null | undefined;
  if (isFormData) {
    body = bodyOpt;
  } else if (typeof bodyOpt === 'string' || bodyOpt instanceof Blob || bodyOpt instanceof ArrayBuffer) {
    body = bodyOpt;
  } else if (bodyOpt instanceof URLSearchParams) {
    body = bodyOpt;
  } else if (typeof bodyOpt === 'object' && bodyOpt !== null) {
    body = JSON.stringify(bodyOpt);
  } else {
    body = bodyOpt as BodyInit | null | undefined;
  }
  const res = await fetch(url, { ...init, headers, body });
  if (res.status === 401 && !options.skip401Redirect) {
    handle401();
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(parseApiErrorBody(errText, res.statusText, res.status));
  }
  if (raw) return res as unknown as T;
  const data = await res.json().catch(() => ({}));
  return data as T;
}
