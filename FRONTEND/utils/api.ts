/**
 * Centralized API fetch with status check and typed errors.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg =
      (data as { message?: string })?.message ??
      (data as { error?: string })?.error ??
      `HTTP ${res.status}`;
    throw new ApiError(res.status, typeof msg === 'string' ? msg : 'Request failed', data);
  }
  return data as T;
}

export async function safeApiFetch<T>(
  url: string,
  fallback: T,
  options?: RequestInit
): Promise<T> {
  try {
    return await apiFetch<T>(url, options);
  } catch (err) {
    console.error(`API error ${url}:`, err);
    return fallback;
  }
}
