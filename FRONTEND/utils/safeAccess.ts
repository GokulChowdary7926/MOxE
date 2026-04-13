/**
 * Safe array/object access utilities to prevent crashes from undefined or non-array values.
 */

export function safeFirst<T>(arr: T[] | null | undefined): T | null {
  if (arr == null) return null;
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[0];
}

export function safeFirstId(arr: { id?: string }[] | null | undefined): string | null {
  const first = safeFirst(arr);
  return first?.id ?? null;
}

export function safeFirstProperty<T, K extends keyof T>(
  arr: T[] | null | undefined,
  property: K
): (T[K] | null) {
  const first = safeFirst(arr);
  if (first == null || typeof first !== 'object') return null;
  return property in first ? (first as T)[property] : null;
}

export function safeMap<T, R>(
  arr: T[] | null | undefined,
  fn: (item: T, index: number) => R
): R[] {
  if (arr == null || !Array.isArray(arr)) return [];
  return arr.map(fn);
}

export function safeFilter<T>(
  arr: T[] | null | undefined,
  fn: (item: T) => boolean
): T[] {
  if (arr == null || !Array.isArray(arr)) return [];
  return arr.filter(fn);
}

export function safeFind<T>(
  arr: T[] | null | undefined,
  fn: (item: T) => boolean
): T | undefined {
  if (arr == null || !Array.isArray(arr)) return undefined;
  return arr.find(fn);
}

/** Normalize API response to array. Handles { items }, { feed }, { results }, { threads }, { messages }, or raw array. */
export function normalizeToArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data != null && typeof data === 'object') {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.feed)) return o.feed;
    if (Array.isArray(o.results)) return o.results;
    if (Array.isArray(o.threads)) return o.threads;
    if (Array.isArray(o.messages)) return o.messages;
  }
  return [];
}
