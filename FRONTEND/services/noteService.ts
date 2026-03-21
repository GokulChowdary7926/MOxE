import { apiFetch, getApiBase, getToken } from './api';

export type NoteItem = {
  id: string;
  accountId: string;
  type: 'TEXT' | 'MUSIC' | 'VIDEO' | 'POLL' | 'LINK';
  contentJson: Record<string, any>;
  appearanceJson?: Record<string, any> | null;
  expiresAt: string;
  account?: { id: string; username: string; profilePhoto?: string | null };
  likes?: Array<{ accountId: string }>;
  pollVotes?: Array<{ accountId: string; option: string }>;
};

export async function getNotes() {
  return apiFetch<NoteItem[]>('/notes');
}

export async function getMyNote() {
  return apiFetch<{ hasNote: boolean; note: NoteItem | null }>('/notes/my');
}

export async function createTextNote(payload: {
  text: string;
  audienceType: 'mutual' | 'closeFriends';
  emoji?: string;
  scheduleAt?: string;
}) {
  return apiFetch<NoteItem>('/notes', {
    method: 'POST',
    body: {
      type: 'TEXT',
      content: { text: payload.text.trim() },
      appearance: payload.emoji ? { emoji: payload.emoji } : undefined,
      audience: { type: payload.audienceType },
      scheduleAt: payload.scheduleAt,
    },
  });
}

export async function createPollNote(payload: {
  question: string;
  options: string[];
  audienceType: 'mutual' | 'closeFriends';
  scheduleAt?: string;
}) {
  return apiFetch<NoteItem>('/notes', {
    method: 'POST',
    body: {
      type: 'POLL',
      content: {
        poll: {
          question: payload.question.trim(),
          options: payload.options.filter(Boolean).map((o) => o.trim()),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      },
      audience: { type: payload.audienceType },
      scheduleAt: payload.scheduleAt,
    },
  });
}

export async function createMusicNote(payload: {
  trackName: string;
  artist: string;
  previewUrl?: string;
  albumArt?: string;
  audienceType: 'mutual' | 'closeFriends';
  scheduleAt?: string;
}) {
  return apiFetch<NoteItem>('/notes', {
    method: 'POST',
    body: {
      type: 'MUSIC',
      content: {
        music: {
          trackName: payload.trackName.trim(),
          artist: payload.artist.trim(),
          previewUrl: payload.previewUrl?.trim() || '',
          albumArt: payload.albumArt?.trim() || '',
        },
      },
      audience: { type: payload.audienceType },
      scheduleAt: payload.scheduleAt,
    },
  });
}

export async function createVideoNote(payload: {
  url: string;
  audienceType: 'mutual' | 'closeFriends';
  scheduleAt?: string;
}) {
  return apiFetch<NoteItem>('/notes', {
    method: 'POST',
    body: {
      type: 'VIDEO',
      content: { video: { url: payload.url.trim() } },
      audience: { type: payload.audienceType },
      scheduleAt: payload.scheduleAt,
    },
  });
}

export async function createLinkNote(payload: {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  audienceType: 'mutual' | 'closeFriends';
  scheduleAt?: string;
}) {
  const domain = (() => {
    try {
      return new URL(payload.url).hostname;
    } catch {
      return '';
    }
  })();
  return apiFetch<NoteItem>('/notes', {
    method: 'POST',
    body: {
      type: 'LINK',
      content: {
        link: {
          url: payload.url.trim(),
          preview: {
            title: payload.title?.trim() || payload.url.trim(),
            description: payload.description?.trim() || '',
            image: payload.image?.trim() || '',
            domain,
          },
        },
      },
      audience: { type: payload.audienceType },
      scheduleAt: payload.scheduleAt,
    },
  });
}

export async function uploadNoteMedia(file: File): Promise<string> {
  const token = getToken();
  if (!token) throw new Error('You must be logged in.');
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${getApiBase()}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed');
  return String(data.url);
}

export async function deleteNote(noteId: string) {
  return apiFetch<{ success: boolean }>(`/notes/${noteId}`, { method: 'DELETE' });
}

export async function likeNote(noteId: string) {
  return apiFetch<{ success: boolean }>(`/notes/${noteId}/like`, { method: 'POST', body: {} });
}

export async function votePoll(noteId: string, option: string) {
  return apiFetch<{ success: boolean }>(`/notes/${noteId}/poll`, { method: 'POST', body: { option } });
}

export async function getNoteAnalytics(noteId: string) {
  return apiFetch<{
    impressions: number;
    uniqueImpressions: number;
    likes: number;
    replies: number;
    engagementRate: number;
    likeRate: number;
    replyRate: number;
    isPromoted: boolean;
    promotionImpressions: number;
  }>(`/notes/${noteId}/analytics`);
}

export async function scheduleNote(noteId: string, publishAt: string) {
  return apiFetch<{ success: boolean }>(`/notes/${noteId}/schedule`, {
    method: 'POST',
    body: { publishAt },
  });
}
