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
