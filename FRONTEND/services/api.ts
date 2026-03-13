/**
 * Central API client for MOxE frontend.
 * All backend calls should use getApiBase() and include auth via getAuthHeaders() when available.
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

export type FetchApiOptions = RequestInit & {
  skipAuth?: boolean;
};

/**
 * Fetch with base URL and optional Bearer token.
 * Use for consistent API calls; on 401 you may clear token and redirect to login.
 */
export async function fetchApi(
  path: string,
  options: FetchApiOptions = {}
): Promise<Response> {
  const { skipAuth, ...init } = options;
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers = new Headers(init.headers as HeadersInit);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!skipAuth && getToken()) headers.set('Authorization', `Bearer ${getToken()}`);
  return fetch(url, { ...init, headers });
}

/**
 * Convenience: fetch JSON with auth. Returns parsed body or throws on non-2xx.
 */
export async function fetchApiJson<T = unknown>(path: string, options: FetchApiOptions = {}): Promise<T> {
  const res = await fetchApi(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  return data as T;
}
