/**
 * Central API client for MOxE frontend.
 * All backend calls should use getApiBase() and include auth via getAuthHeaders() when available.
 * On 401, token is cleared and user is redirected to login.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

export function getApiBase(): string {
  return API_BASE;
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
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
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
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) return {} as T;
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  return data as T;
}

export type ApiFetchOptions = RequestInit & {
  /** If true, do not parse response as JSON (e.g. for blob). */
  raw?: boolean;
  /** If true, 401 does not trigger handle401 redirect. */
  skip401Redirect?: boolean;
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
  const url = `${API_BASE.replace(/\/$/, '')}/${normalizedPath}`;
  const headers = new Headers(init.headers as HeadersInit);
  if (getToken()) headers.set('Authorization', `Bearer ${getToken()}`);
  const isFormData = bodyOpt instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const body: BodyInit | null | undefined = isFormData
    ? bodyOpt
    : typeof bodyOpt === 'object' && bodyOpt !== null
      ? JSON.stringify(bodyOpt)
      : bodyOpt;
  const res = await fetch(url, { ...init, headers, body });
  if (res.status === 401 && !options.skip401Redirect) {
    handle401();
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  }
  if (raw) return res as unknown as T;
  const data = await res.json().catch(() => ({}));
  return data as T;
}
