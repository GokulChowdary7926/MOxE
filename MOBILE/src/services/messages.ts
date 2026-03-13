import { API_BASE, apiGet, apiPost, getStoredToken } from '../config/api';

export type ThreadItem = {
  otherId: string;
  other?: { id: string; username: string; displayName: string; profilePhoto: string | null };
  lastMessage: string;
  lastTime: string;
  unread: number;
};

export type MessageItem = {
  id: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'MEDIA' | 'VOICE' | 'GIF' | string;
  media?: { url?: string; [k: string]: unknown } | null;
  createdAt?: string;
};

export async function fetchThreads(): Promise<ThreadItem[]> {
  const data = await apiGet<{ threads?: ThreadItem[]; requests?: ThreadItem[]; pinnedIds?: string[] }>(
    'messages/threads',
  );
  return data.threads ?? [];
}

export async function fetchThreadMessages(userId: string): Promise<MessageItem[]> {
  const qs = `messages?userId=${encodeURIComponent(userId)}&limit=50`;
  const data = await apiGet<{ items?: MessageItem[]; messages?: MessageItem[] }>(qs);
  return data.items ?? data.messages ?? [];
}

export async function sendTextMessage(recipientId: string, content: string) {
  return apiPost<MessageItem>('messages', {
    recipientId,
    content,
    messageType: 'TEXT',
  });
}

export async function sendGifMessage(recipientId: string, url: string) {
  return apiPost<MessageItem>('messages', {
    recipientId,
    content: '',
    messageType: 'GIF',
    media: { url },
  });
}

export async function searchGifs(query: string) {
  const qs = `gifs/search?q=${encodeURIComponent(query)}`;
  const data = await apiGet<{ items?: { id: string; url: string; previewUrl?: string }[] }>(qs);
  return data.items ?? [];
}

export async function uploadAudio(uri: string): Promise<string> {
  const token = await getStoredToken();
  if (!token) throw new Error('Not logged in');
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'audio/m4a',
    name: `voice-${Date.now()}.m4a`,
  } as any);

  const res = await fetch(`${API_BASE.replace(/\/$/, '')}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Failed to upload audio');
  }
  return data.url as string;
}

export async function sendVoiceMessage(recipientId: string, mediaUrl: string) {
  return apiPost<MessageItem>('messages', {
    recipientId,
    content: '',
    messageType: 'VOICE',
    media: { url: mediaUrl },
  });
}

