/**
 * API client for MOxE backend. Attaches auth token from AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_TOKEN_KEY = 'moxe_token';
const STORAGE_ACCOUNT_ID_KEY = 'moxe_account_id';

export const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5007/api';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_TOKEN_KEY);
}

export async function setStoredAuth(token: string, accountId?: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
  if (accountId != null) await AsyncStorage.setItem(STORAGE_ACCOUNT_ID_KEY, accountId);
}

export async function getStoredAccountId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_ACCOUNT_ID_KEY);
}

export async function clearStoredAuth(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_ACCOUNT_ID_KEY]);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...rest } = options;
  const url = path.startsWith('http') ? path : `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((rest.headers as Record<string, string>) || {}),
  };
  if (!skipAuth) {
    const token = await getStoredToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...rest, headers: { ...headers, ...rest.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || res.statusText || 'Request failed');
  return data as T;
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  return apiFetch<T>(path, { method: 'GET' });
}

export async function apiPost<T = unknown>(
  path: string,
  body?: object,
  opts?: { skipAuth?: boolean }
): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...opts,
  });
}

export async function apiPatch<T = unknown>(path: string, body?: object): Promise<T> {
  return apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
}

export async function apiDelete(path: string): Promise<void> {
  await apiFetch(path, { method: 'DELETE' });
}
