/**
 * Server-side upload library: files stay until DELETE /api/upload/:id.
 * Use with Redux or local state; server is the source of truth.
 */
import { fetchApiJson } from './api';

export type UploadedAssetDto = {
  id: string;
  storageKey: string;
  publicUrl: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  purpose: string;
  storageBackend: string;
  createdAt: string;
};

export type UploadLibraryPage = {
  items: UploadedAssetDto[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
};

export async function fetchUploadLibrary(params?: { limit?: number; offset?: number }): Promise<UploadLibraryPage> {
  const limit = params?.limit ?? 40;
  const offset = params?.offset ?? 0;
  return fetchApiJson<UploadLibraryPage>(`upload?limit=${limit}&offset=${offset}`);
}

export async function deleteUpload(id: string): Promise<{ ok: boolean }> {
  return fetchApiJson<{ ok: boolean }>(`upload/${id}`, { method: 'DELETE' });
}
