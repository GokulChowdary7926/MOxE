import algoliasearch, { SearchClient } from 'algoliasearch';
import { getApiBase } from './api';

let client: SearchClient | null = null;
let indices:
  | {
      users: string | null;
      posts: string | null;
    }
  | null = null;

export async function initSearchClient(): Promise<SearchClient | null> {
  if (client) return client;
  const res = await fetch(`${getApiBase().replace(/\/$/, '')}/search/config`);
  if (!res.ok) return null;
  const cfg = await res.json().catch(() => ({}));
  if (!cfg?.appId || !cfg?.searchKey) return null;
  client = algoliasearch(cfg.appId, cfg.searchKey);
  indices = cfg.indices ?? null;
  return client;
}

export function getIndices() {
  return indices;
}

