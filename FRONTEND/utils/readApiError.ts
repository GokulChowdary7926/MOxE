/**
 * Sync parse of an error response body (already read as text).
 */
export function parseApiErrorBody(text: string, statusText: string, status?: number): string {
  if (status === 413) {
    return 'This file is too large. Use a smaller file (under 20 MB for standard uploads).';
  }
  const t = text.trim();
  if (!t) return statusText || (status != null ? `Request failed (${status})` : 'Request failed');
  try {
    const j = JSON.parse(t) as { error?: string; message?: string };
    if (typeof j.error === 'string' && j.error) return j.error;
    if (typeof j.message === 'string' && j.message) return j.message;
  } catch {
    /* plain text */
  }
  return t.length > 280 ? `${t.slice(0, 280)}…` : t;
}

/**
 * Best-effort message from a failed fetch Response (JSON `{ error }` or plain text).
 */
export async function readApiError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  return parseApiErrorBody(text, res.statusText, res.status);
}
