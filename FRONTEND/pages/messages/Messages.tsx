import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Camera, Mic, Square, ArrowLeft, Phone, Video, Flag, MoreHorizontal, Plus, Image as ImageIcon, X, Search, MoreVertical, Palette } from 'lucide-react';
import { ThemedView, ThemedText, ThemedInput } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { connectDmSocket, getDmSocket } from '../../services/dmSocket';
import type { RootState } from '../../store';

import toast from 'react-hot-toast';
import { getApiBase, getToken, getUploadUrl } from '../../services/api';
import { fetchClientSettings, patchClientSettings } from '../../services/clientSettings';
import { normalizeToArray } from '../../utils/safeAccess';
import { DM_THEME_IDS, DM_THEME_LABELS, type DmThemeId, getDmThemeSkin, isDmThemeId } from '../../utils/dmTheme';
import { getMyNote, getNotes, type NoteItem } from '../../services/noteService';
import { ensureAbsoluteMediaUrl, isVideoMediaUrl } from '../../utils/mediaUtils';
import {
  canUseMediaDevices,
  isSecureContextHintMessage,
  MEDIA_DEVICES_HTTPS_HINT,
  normalizeCameraError,
} from '../../utils/browserFeatures';
import { messageFromUnknown, userFacingApiError, userFacingUploadError } from '../../utils/userFacingErrors';

const FALLBACK_USER = {
  id: 'account-unavailable',
  username: 'account',
  displayName: 'Account unavailable',
  avatarUrl: null as string | null,
};

function dedupeMessages(items: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const m of items) {
    if (!m || typeof m !== 'object') continue;
    const key =
      (m && typeof m.id === 'string' && m.id) ||
      `${m?.senderId || ''}|${m?.recipientId || ''}|${m?.content || ''}|${m?.createdAt || m?.sentAt || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

function normalizeMessages(items: any[]): any[] {
  if (!Array.isArray(items)) return [];
  return dedupeMessages(items.filter((m) => m && typeof m === 'object'));
}

export default function Messages() {
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  const { currentAccount } = useSelector((state: RootState) => state.account);
  const username = (currentAccount as any)?.username ?? '';

  const [threads, setThreads] = useState<any[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [threadsError, setThreadsError] = useState<string | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [viewOnce, setViewOnce] = useState(false);
  const [muted, setMuted] = useState(false);
  const [muteDuration, setMuteDuration] = useState<'15m' | '1h' | '8h' | '24h' | 'always'>('24h');
  const [pinning, setPinning] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState<{ id: string; name: string } | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<{ id: string; url: string; previewUrl?: string }[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollSubmitting, setPollSubmitting] = useState(false);
  const [refreshThreadTrigger, setRefreshThreadTrigger] = useState(0);
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockedByThem, setBlockedByThem] = useState(false);
  const [showPremiumMessageModal, setShowPremiumMessageModal] = useState(false);
  const [premiumMessageContent, setPremiumMessageContent] = useState('');
  const [premiumCheck, setPremiumCheck] = useState<{ canSend: boolean; reason?: string; remainingGrants: number; characterLimit: number } | null>(null);
  const [premiumSending, setPremiumSending] = useState(false);
  const [premiumBlockedReceivedItems, setPremiumBlockedReceivedItems] = useState<any[]>([]);
  const [loadingPremiumBlockedReceived, setLoadingPremiumBlockedReceived] = useState(false);
  const [premiumBlockedReceivedError, setPremiumBlockedReceivedError] = useState<string | null>(null);
  const [premiumBlockedViewItem, setPremiumBlockedViewItem] = useState<any | null>(null);
  const [inboxTab, setInboxTab] = useState<'primary' | 'general' | 'requests'>('primary');
  const [inboxSearch, setInboxSearch] = useState('');
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [searchUsersLoading, setSearchUsersLoading] = useState(false);
  const [inboxListReloadKey, setInboxListReloadKey] = useState(0);
  const [threadMenuForId, setThreadMenuForId] = useState<string | null>(null);
  const [peerFromProfile, setPeerFromProfile] = useState<any | null>(null);
  const [myNote, setMyNote] = useState<NoteItem | null>(null);
  const [otherNotes, setOtherNotes] = useState<NoteItem[]>([]);
  const [dmThemeId, setDmThemeId] = useState<DmThemeId>('default');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const dmSkin = useMemo(() => getDmThemeSkin(dmThemeId), [dmThemeId]);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSettings()
      .then((s) => {
        if (cancelled) return;
        const t = s.dmTheme;
        if (isDmThemeId(t)) setDmThemeId(t);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setThreadMenuForId(null);
  }, [inboxTab, showRequests]);

  useEffect(() => {
    const q = inboxSearch.trim();
    if (q.length < 2) {
      setSearchUsers([]);
      setSearchUsersLoading(false);
      return;
    }
    let cancelled = false;
    const token = getToken();
    if (!token) return;
    setSearchUsersLoading(true);
    fetch(`${getApiBase()}/explore/search?q=${encodeURIComponent(q)}&type=users&limit=12`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (cancelled) return;
        const users = Array.isArray((data as any)?.users) ? (data as any).users : [];
        setSearchUsers(users);
      })
      .catch(() => {
        if (!cancelled) setSearchUsers([]);
      })
      .finally(() => {
        if (!cancelled) setSearchUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inboxSearch]);

  useEffect(() => {
    if (!threadMenuForId) return;
    const closeIfOutside = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('[data-thread-menu-trigger]')) return;
      if (target.closest('[data-thread-menu-popover]')) return;
      setThreadMenuForId(null);
    };
    document.addEventListener('pointerdown', closeIfOutside);
    return () => document.removeEventListener('pointerdown', closeIfOutside);
  }, [threadMenuForId]);

  useEffect(() => {
    let cancelled = false;
    async function loadNotesForInbox() {
      const token = getToken();
      if (!token) {
        if (!cancelled) {
          setMyNote(null);
          setOtherNotes([]);
        }
        return;
      }
      try {
        const [mine, all, followingRes] = await Promise.all([
          getMyNote(),
          getNotes(),
          fetch(`${getApiBase()}/follow/following/by/${encodeURIComponent(username)}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => null),
        ]);
        if (cancelled) return;
        setMyNote(mine?.note ?? null);
        let allowedIds = new Set<string>();
        let followingLoaded = false;
        if (followingRes?.ok) {
          const followingData = await followingRes.json().catch(() => ({}));
          const followingArr = Array.isArray((followingData as any)?.following) ? (followingData as any).following : [];
          allowedIds = new Set(
            followingArr
              .map((f: any) => String(f?.id || '').trim())
              .filter((id: string) => id.length > 0),
          );
          followingLoaded = true;
        }
        const arr = Array.isArray(all) ? all : [];
        setOtherNotes(
          arr
            .filter((n) => n && n.accountId && n.accountId !== (currentAccount as any)?.id)
            .filter((n) => !followingLoaded || allowedIds.has(String(n.accountId)))
            .slice(0, 8),
        );
      } catch {
        if (!cancelled) {
          setMyNote(null);
          setOtherNotes([]);
        }
      }
    }
    void loadNotesForInbox();
    return () => {
      cancelled = true;
    };
  }, [currentAccount, username]);

  // Realtime DM socket: join /dm namespace and listen for message / typing / read events.
  useEffect(() => {
    const me = currentAccount?.id;
    if (typeof me !== 'string' || !me) return;
    // Only connect once; listeners are (re)attached per component mount.
    const socket = connectDmSocket(me);

    function handleMessage(payload: any) {
      const msg = payload?.message ?? payload;
      if (!msg || typeof msg !== 'object') return;
      // Group messages: not handled yet via socket.
      if (groupId) {
        if (msg.groupId !== groupId) return;
      } else if (userId) {
        // For DMs, only append messages from the peer in this conversation.
        if (msg.senderId !== userId) return;
      } else {
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return normalizeMessages([...prev, msg]);
      });
    }

    function handleTyping(payload: { from?: string }) {
      if (!userId || !payload?.from) return;
      if (payload.from !== userId) return;
      setPeerTyping(true);
      setTimeout(() => setPeerTyping(false), 2000);
    }

    function handleRead(payload: { from?: string }) {
      if (!userId || !payload?.from) return;
      if (payload.from !== userId) return;
      // Peer has read my messages; mark last outgoing as seen.
      setMessages((prev) =>
        prev.map((m, idx) =>
          idx === prev.length - 1 && m.senderId === currentAccount?.id
            ? { ...m, seenByEveryone: true }
            : m,
        ),
      );
    }

    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('read', handleRead);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('read', handleRead);
    };
  }, [currentAccount?.id, userId, groupId]);

  // Load thread list (left pane) — API only; no mock fallback.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingThreads(true);
      setThreadsError(null);
      try {
        const token = getToken();
        if (!token) {
          if (!cancelled) {
            setThreads([]);
            setRequests([]);
            setPinnedIds([]);
            setThreadsError('Sign in to load your inbox.');
          }
          return;
        }
        const res = await fetch(`${getApiBase()}/messages/threads`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !cancelled) {
          const threadsArr = normalizeToArray(data.threads ?? data);
          setThreads(threadsArr);
          setRequests(Array.isArray(data.requests) ? data.requests : []);
          setPinnedIds(Array.isArray(data.pinnedIds) ? data.pinnedIds : []);
          setThreadsError(null);
          return;
        }
        if (!cancelled) {
          const msg =
            typeof (data as { error?: string }).error === 'string'
              ? (data as { error: string }).error
              : `Could not load inbox (${res.status})`;
          setThreadsError(msg);
          setThreads([]);
          setRequests([]);
          setPinnedIds([]);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setThreadsError(e instanceof Error ? e.message : 'Failed to load messages.');
          setThreads([]);
          setRequests([]);
          setPinnedIds([]);
        }
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentAccount, inboxListReloadKey]);

  // Group chat title (inbox no longer lists groups)
  useEffect(() => {
    if (!groupId) {
      setActiveGroup(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const token = getToken();
      if (!token) {
        if (!cancelled) setActiveGroup({ id: groupId, name: 'Group' });
        return;
      }
      try {
        const res = await fetch(`${getApiBase()}/groups/${encodeURIComponent(groupId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data && typeof data === 'object') {
          const name = (data as { name?: string }).name || 'Group';
          setActiveGroup({ id: groupId, name });
        } else {
          setActiveGroup({ id: groupId, name: 'Group' });
        }
      } catch {
        if (!cancelled) setActiveGroup({ id: groupId, name: 'Group' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  // Load messages for active conversation — API only; no mock fallback.
  useEffect(() => {
    if (!userId && !groupId) return;
    let cancelled = false;
    async function loadThread() {
      setLoadingMessages(true);
      setMessagesError(null);
      try {
        const token = getToken();
        if (!token) {
          if (!cancelled) {
            setMessages([]);
            setMessagesError('Sign in to view this conversation.');
          }
          return;
        }
        const qs = groupId
          ? `groupId=${encodeURIComponent(groupId)}`
          : `userId=${encodeURIComponent(userId as string)}`;
        const res = await fetch(`${getApiBase()}/messages?${qs}&limit=50`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !cancelled) {
          const items = normalizeToArray(data.items ?? data.messages ?? data);
          setMessages(normalizeMessages(items));
          if (userId && !groupId) {
            fetch(`${getApiBase()}/messages/thread-read`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId }),
            }).catch(() => {});
          }
          return;
        }
        if (!cancelled) {
          setMessages([]);
          const err =
            typeof (data as { error?: string }).error === 'string'
              ? (data as { error: string }).error
              : `Could not load messages (${res.status})`;
          setMessagesError(err);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setMessagesError(e instanceof Error ? e.message : 'Failed to load conversation.');
          setMessages([]);
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }
    loadThread();
    return () => {
      cancelled = true;
    };
  }, [userId, groupId, currentAccount, refreshThreadTrigger]);

  useEffect(() => {
    async function checkBlock() {
      if (!userId) return;
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${getApiBase()}/privacy/can-message/${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        if (data.reason === 'blocked_by_you') {
          setBlocked(true);
          setBlockedByThem(false);
        } else if (data.reason === 'blocked_by_them') {
          setBlocked(false);
          setBlockedByThem(true);
        } else {
          setBlocked(false);
          setBlockedByThem(false);
        }
      } catch {
        // ignore
      }
    }
    checkBlock();
  }, [userId]);

  // If you have blocked the peer, premium blocked-messages may still exist (recipient-side view).
  useEffect(() => {
    async function loadPremiumBlockedReceived() {
      if (!userId) return;
      if (groupId) return; // only DM view
      if (!blocked) {
        setPremiumBlockedReceivedItems([]);
        setPremiumBlockedViewItem(null);
        return;
      }

      const token = getToken();
      if (!token) return;

      setLoadingPremiumBlockedReceived(true);
      setPremiumBlockedReceivedError(null);
      try {
        const res = await fetch(`${getApiBase()}/premium/blocked-messages/received?senderId=${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || data?.reason || 'Failed to load blocked messages.');
        setPremiumBlockedReceivedItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e: any) {
        setPremiumBlockedReceivedItems([]);
        setPremiumBlockedReceivedError(e?.message || 'Failed to load premium blocked messages.');
      } finally {
        setLoadingPremiumBlockedReceived(false);
      }
    }

    void loadPremiumBlockedReceived();
  }, [userId, groupId, blocked, refreshThreadTrigger]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content && !mediaFile) return;
    if (!userId && !groupId) return;
    if (blocked) {
      setMessagesError('Unblock to message this user.');
      return;
    }
    if (blockedByThem) {
      setMessagesError('Use "Send limited message" to contact this user.');
      return;
    }
    const token = getToken();
    if (!token) {
      setMessagesError('You must be logged in to send messages.');
      return;
    }
    try {
      let mediaPayload: { url: string } | undefined;
      if (mediaFile) {
        const form = new FormData();
        form.append('file', mediaFile);
        const uploadRes = await fetch(getUploadUrl(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!uploadRes.ok) {
          throw new Error(await userFacingUploadError(uploadRes, 'Could not send attachment.'));
        }
        const uploadData = (await uploadRes.json().catch(() => ({}))) as { url?: string };
        if (!uploadData.url) {
          throw new Error('Could not send attachment.');
        }
        mediaPayload = { url: uploadData.url };
      }
      let messageType: 'TEXT' | 'MEDIA' | 'VOICE' | 'GIF' | 'POLL' = 'TEXT';
      let mediaForSend = mediaPayload;
      if (mediaPayload) {
        const isAudio = mediaFile?.type.startsWith('audio/');
        messageType = isAudio ? 'VOICE' : 'MEDIA';
      } else {
        messageType = 'TEXT';
      }
      const res = await fetch(`${getApiBase()}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: groupId ? undefined : userId,
          content,
          messageType,
          media: mediaForSend,
          isVanish: viewOnce,
          groupId: groupId || undefined,
        }),
      });
      if (!res.ok) {
        throw new Error(await userFacingApiError(res, 'Could not send message.'));
      }
      const data = await res.json().catch(() => ({}));
      setMessages((prev) => normalizeMessages([...prev, data]));
      setNewMessage('');
      setMediaFile(null);
      setViewOnce(false);
    } catch (e: unknown) {
      const msg = messageFromUnknown(e, 'Could not send message.');
      setMessagesError(msg);
      const lower = msg.toLowerCase();
      if (lower.includes('recipient has blocked you')) {
        setBlockedByThem(true);
        setBlocked(false);
      } else if (lower.includes('you have blocked this recipient')) {
        setBlocked(true);
        setBlockedByThem(false);
      }
    }
  };

  const handlePremiumBlockedView = async (item: any) => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;
    setPremiumBlockedViewItem(item);

    try {
      const actionRes = await fetch(`${getApiBase()}/premium/blocked-messages/${encodeURIComponent(item.id)}/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'viewed' }),
      });
      const actionData = await actionRes.json().catch(() => ({}));
      if (!actionRes.ok) throw new Error(actionData?.error || actionData?.reason || 'Failed to mark as viewed.');

      // View requires normal chat access; remove the privacy block for this peer.
      await fetch(`${getApiBase()}/privacy/block/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);

      setBlocked(false);
      setBlockedByThem(false);
      setPremiumBlockedViewItem(item);
      setRefreshThreadTrigger((t) => t + 1);
    } catch (e: any) {
      setPremiumBlockedReceivedError(e?.message || 'Failed to view message.');
    }
  };

  const handlePremiumBlockedReblock = async (item: any) => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;

    try {
      const actionRes = await fetch(`${getApiBase()}/premium/blocked-messages/${encodeURIComponent(item.id)}/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reblocked' }),
      });
      const actionData = await actionRes.json().catch(() => ({}));
      if (!actionRes.ok) throw new Error(actionData?.error || actionData?.reason || 'Failed to re-block.');

      setBlocked(true);
      setBlockedByThem(false);
      setPremiumBlockedViewItem(null);
      setRefreshThreadTrigger((t) => t + 1);
    } catch (e: any) {
      setPremiumBlockedReceivedError(e?.message || 'Failed to re-block.');
    }
  };

  const handlePremiumBlockedReport = async (item: any) => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;

    const reason = window.prompt('Why are you reporting this message?')?.trim();
    if (!reason) return;
    const details = window.prompt('Optional details (helps us review)')?.trim() || reason;

    try {
      const actionRes = await fetch(`${getApiBase()}/premium/blocked-messages/${encodeURIComponent(item.id)}/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reported', reason, details }),
      });
      const actionData = await actionRes.json().catch(() => ({}));
      if (!actionRes.ok) throw new Error(actionData?.error || actionData?.reason || 'Failed to report.');

      // Refresh list; sender may lose premium ability after enough strikes.
      setPremiumBlockedReceivedError(null);
      setRefreshThreadTrigger((t) => t + 1);
    } catch (e: any) {
      setPremiumBlockedReceivedError(e?.message || 'Failed to report.');
    }
  };

  const sendPollMessage = async () => {
    if (blocked) {
      setMessagesError('Unblock to send messages to this user.');
      return;
    }
    if (blockedByThem) {
      setMessagesError('Use "Send limited message" to contact this user.');
      return;
    }
    const question = pollQuestion.trim();
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!question || options.length < 2) {
      setMessagesError('Enter a question and at least 2 options.');
      return;
    }
    if (options.length > 4) {
      setMessagesError('Maximum 4 options.');
      return;
    }
    if (!userId && !groupId) return;
    const token = getToken();
    if (!token) return;
    setPollSubmitting(true);
    setMessagesError(null);
    try {
      const res = await fetch(`${getApiBase()}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: groupId ? undefined : userId,
          groupId: groupId || undefined,
          content: question,
          messageType: 'POLL',
          media: { options },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send poll.');
      setMessages((prev) => normalizeMessages([...prev, data]));
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (e: unknown) {
      setMessagesError(messageFromUnknown(e, 'Could not send poll.'));
    } finally {
      setPollSubmitting(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      if (!canUseMediaDevices()) {
        setMessagesError(MEDIA_DEVICES_HTTPS_HINT);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeCandidates = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/aac', 'audio/ogg'];
      const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      const outType = mime || recorder.mimeType || 'audio/webm';
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: outType });
        const ext = outType.includes('mp4') ? 'm4a' : outType.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: outType });
        setMediaFile(file);
        setIsRecordingVoice(true);
      };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setMessagesError(normalizeCameraError(err));
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  const reactToMessage = async (messageId: string) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${getApiBase()}/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji: '❤️' }),
      });
    } catch {
      // ignore
    }
  };

  const deleteMessage = async (messageId: string, forMeOnly: boolean) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(
        `${getApiBase()}/messages/${messageId}?forMeOnly=${forMeOnly ? 'true' : 'false'}`,
        { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      // ignore
    }
  };

  const toggleMute = async () => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;
    try {
      if (!muted) {
        const res = await fetch(`${getApiBase()}/messages/mute/${userId}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ duration: muteDuration === 'always' ? 'always' : muteDuration }),
        });
        if (res.ok) setMuted(true);
      } else {
        const res = await fetch(`${getApiBase()}/messages/mute/${userId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setMuted(false);
      }
    } catch {
      // ignore
    }
  };

  const selectDmTheme = async (id: DmThemeId) => {
    setDmThemeId(id);
    setShowThemePicker(false);
    try {
      await patchClientSettings({ dmTheme: id });
      toast.success('Chat theme saved');
    } catch {
      toast.error('Could not save chat theme');
    }
  };

  const pinChat = async () => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;
    setPinning(true);
    try {
      await fetch(`${getApiBase()}/messages/pin/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // ignore
    } finally {
      setPinning(false);
    }
  };

  const isConversation = !!userId || !!groupId;

  const orderedThreads = useMemo(() => {
    if (!threads.length) return [];
    if (!pinnedIds.length) {
      return [...threads].sort(
        (a: any, b: any) =>
          new Date(b.lastTime || b.lastCreatedAt || 0).getTime() -
          new Date(a.lastTime || a.lastCreatedAt || 0).getTime(),
      );
    }
    const pinnedSet = new Set(pinnedIds);
    const copy = [...threads];
    copy.sort((a: any, b: any) => {
      const aPinned = pinnedSet.has(a.otherId);
      const bPinned = pinnedSet.has(b.otherId);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return (
        new Date(b.lastTime || b.lastCreatedAt || 0).getTime() -
        new Date(a.lastTime || a.lastCreatedAt || 0).getTime()
      );
    });
    return copy;
  }, [threads, pinnedIds]);
  const notePreviewText = (n: NoteItem): string => {
    if (n.type === 'TEXT') return String(n.contentJson?.text ?? '').trim();
    if (n.type === 'POLL') return String((n.contentJson as any)?.poll?.question ?? '').trim();
    if (n.type === 'MUSIC') return String((n.contentJson as any)?.music?.trackName ?? 'Music').trim();
    if (n.type === 'VIDEO') return 'Video note';
    if (n.type === 'LINK') return String((n.contentJson as any)?.link?.preview?.title ?? 'Link note').trim();
    return '';
  };

  /** Primary vs General: mock folders or API conversation labels (e.g. "general"). */
  const isThreadInGeneral = (t: any) => {
    if (t?.inboxFolder === 'general' || t?.isGeneral === true) return true;
    const labels = Array.isArray(t?.labels) ? t.labels : [];
    return labels.some((l: string) => String(l).toLowerCase().trim() === 'general');
  };

  const setThreadGeneralLabel = async (peerId: string, toGeneral: boolean) => {
    const token = getToken();
    if (!token) {
      toast.error('Log in to organize conversations into Primary or General.');
      setThreadMenuForId(null);
      return;
    }
    setThreadMenuForId(null);
    try {
      if (toGeneral) {
        const res = await fetch(
          `${getApiBase()}/messages/threads/${encodeURIComponent(peerId)}/labels`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: 'general' }),
          },
        );
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as { error?: string }).error || 'Could not move to General');
        }
        toast.success('Conversation moved to General');
      } else {
        const res = await fetch(
          `${getApiBase()}/messages/threads/${encodeURIComponent(peerId)}/labels/${encodeURIComponent('general')}`,
          { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as { error?: string }).error || 'Could not move to Primary');
        }
        toast.success('Conversation moved to Primary');
      }
      setInboxListReloadKey((k) => k + 1);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not update folder');
    }
  };

  const inboxTimeLabel = (t: any) => {
    const raw = t.lastTime || t.lastCreatedAt || t.updatedAt;
    if (!raw) return '';
    const d = new Date(raw).getTime();
    const diff = Date.now() - d;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'}`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days`;
  };

  const goBackFromInbox = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const inboxView = (
      <ThemedView className="min-h-screen flex flex-col bg-black text-white">
        <MobileShell>
          <div className="relative flex flex-col flex-1 min-h-0">
          <div className="px-3 pt-3 pb-2 shrink-0 border-b border-[#262626] safe-area-pt bg-black">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-[22px] font-bold text-white tracking-tight">Messages</h1>
                  {requests.length > 0 && (
                    <span className="min-w-[22px] h-[22px] px-1 rounded-full bg-[#ff3040] text-white text-[12px] font-bold flex items-center justify-center">
                      {requests.length > 9 ? '9+' : requests.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  aria-label="Back"
                  onClick={goBackFromInbox}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white active:bg-white/10"
                >
                  <ArrowLeft className="w-[22px] h-[22px]" strokeWidth={2} />
                </button>
                <button
                  type="button"
                  aria-label="More options"
                  onClick={() => navigate('/messages/inbox/more')}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white active:bg-white/10"
                >
                  <MoreHorizontal className="w-[22px] h-[22px]" strokeWidth={2} />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-4 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                className="flex flex-col items-center shrink-0 w-[72px]"
                onClick={() => navigate(myNote ? '/notes' : '/notes/new')}
                aria-label="Create a note"
              >
                <div className="relative w-16 h-16 rounded-full bg-white/10 border border-white/25 flex items-center justify-center">
                  {myNote ? (
                    <Avatar uri={((currentAccount as any)?.profilePhoto as string | null) ?? null} size={60} />
                  ) : (
                    <Plus className="w-7 h-7 text-white" strokeWidth={2} />
                  )}
                </div>
                <span className="mt-1.5 text-[11px] text-white/90 text-center leading-tight">Your note</span>
              </button>
              {otherNotes.map((n: NoteItem) => {
                const other = n.account ?? ({} as NonNullable<NoteItem['account']>);
                const preview = notePreviewText(n);
                return (
                  <button type="button" key={`note-${n.id}`} className="flex flex-col items-center shrink-0 w-[72px]" onClick={() => navigate('/notes')}>
                    {preview ? (
                      <span className="mb-1 max-w-[68px] truncate rounded-lg bg-black/30 px-1.5 py-0.5 text-[9px] text-white/95 leading-tight">
                        {preview}
                      </span>
                    ) : null}
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#333]">
                        <Avatar uri={other.profilePhoto || other.avatarUri || null} size={60} />
                      </div>
                    </div>
                    <span className="mt-1.5 text-[11px] text-white truncate max-w-[72px]">{other.username || other.displayName || 'user'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-3 py-2 shrink-0 bg-black">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#8e8e8e] pointer-events-none" aria-hidden />
              <input
                type="search"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#262626] border border-[#363636] text-[15px] text-white placeholder:text-[#8e8e8e] focus:outline-none focus:ring-1 focus:ring-moxe-primary/60"
              />
            </div>
          </div>

          <div className="px-3 pb-2 shrink-0 bg-black">
            <div className="flex gap-1 rounded-xl bg-[#262626] p-1" role="tablist" aria-label="Inbox sections">
              {(['primary', 'general', 'requests'] as const).map((key) => {
                const label = key === 'primary' ? 'Primary' : key === 'general' ? 'General' : 'Requests';
                const active = key === 'requests' ? showRequests : inboxTab === key && !showRequests;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      if (key === 'requests') setShowRequests(true);
                      else {
                        setInboxTab(key);
                        setShowRequests(false);
                      }
                    }}
                    className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-colors min-h-[40px] ${
                      active ? 'bg-black text-white' : 'text-moxe-textSecondary'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-3 min-h-0 pb-28 bg-black">
          {loadingThreads && (
            <p className="text-white/70 text-sm py-4">Loading conversations…</p>
          )}
          {threadsError && !loadingThreads && (
            <div className="py-4 space-y-2">
              <p className="text-red-300 text-sm">{threadsError}</p>
              <button
                type="button"
                onClick={() => {
                  setThreadsError(null);
                  setInboxListReloadKey((k) => k + 1);
                }}
                className="text-moxe-primary text-sm font-semibold"
              >
                Try again
              </button>
            </div>
          )}
          {!loadingThreads && !threadsError && inboxSearch.trim().length >= 2 && (
            <div className="py-2 space-y-1">
              {searchUsersLoading && (
                <p className="text-white/70 text-sm py-2">Searching users…</p>
              )}
              {!searchUsersLoading && searchUsers.length === 0 && (
                <p className="text-white/70 text-sm py-2">No users found.</p>
              )}
              {!searchUsersLoading &&
                searchUsers.map((u: any) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => navigate(`/messages/${u.id}`)}
                    className="w-full flex items-center gap-3 py-2.5 px-1 rounded-lg text-left active:bg-white/10"
                  >
                    <Avatar uri={u.profilePhoto || null} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-[14px] font-semibold truncate">
                        {u.displayName || u.username}
                      </p>
                      <p className="text-white/65 text-[12px] truncate">@{u.username}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
          {!loadingThreads &&
            !threadsError &&
            inboxSearch.trim().length < 2 &&
            !showRequests &&
            threads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-black/20 border border-white/20 flex items-center justify-center mb-4 text-3xl">
                💬
              </div>
              <p className="font-semibold text-white text-base mb-2">No messages yet</p>
              <p className="text-center text-white/70 text-sm">
                When people message you, they’ll show up here.
              </p>
            </div>
          )}
          {!loadingThreads &&
            !threadsError &&
            inboxSearch.trim().length < 2 &&
            !showRequests &&
            orderedThreads
              .filter((t: any) => {
                const inGeneral = isThreadInGeneral(t);
                if (inboxTab === 'general') return inGeneral;
                if (inboxTab === 'primary') return !inGeneral;
                return true;
              })
              .filter((t: any) => {
                if (!inboxSearch.trim()) return true;
                const other = t.other ?? t.peer ?? {};
                const name = (other.username || other.displayName || '').toLowerCase();
                const q = inboxSearch.trim().toLowerCase();
                return name.includes(q) || (t.lastMessage || '').toLowerCase().includes(q);
              })
              .map((t: any) => {
              const other = t.other ?? t.peer ?? {};
              const avatarUri = other.profilePhoto || other.avatarUri || null;
              const name = other.displayName || other.username || 'Conversation';
              const timeBit = inboxTimeLabel(t);
              const preview = t.lastMessage || 'No messages yet';
              const inGeneral = isThreadInGeneral(t);
              return (
                <div key={t.otherId} className="relative flex w-full items-stretch border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => navigate(`/messages/${t.otherId}`)}
                    className="flex-1 flex items-center gap-3 py-3 pl-1 pr-0 text-left active:bg-black/15 rounded-lg min-w-0 -mx-1"
                  >
                    <div className="relative shrink-0">
                      <div className="w-[52px] h-[52px] rounded-full p-[2px] bg-gradient-to-tr from-[#f58529] via-[#dd2a7b] to-[#8134af]">
                        <div className="w-full h-full rounded-full overflow-hidden bg-[#333]">
                          <Avatar uri={avatarUri} size={48} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-white text-[15px] leading-tight truncate">
                        {name}
                      </span>
                      <span className="text-white/75 text-[13px] leading-snug truncate mt-0.5 inline-flex items-center gap-1.5">
                        <span className="truncate min-w-0">
                          {preview}
                          {timeBit ? <span className="text-white/50"> · {timeBit}</span> : null}
                        </span>
                        {t.unread > 0 ? (
                          <span className="w-2 h-2 rounded-full bg-[#0095f6] shrink-0" aria-label="Unread" />
                        ) : null}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 pr-1">
                      {t.mutedUntil && <span className="text-[9px] text-white/40">Muted</span>}
                      {pinnedIds.includes(t.otherId) && <span className="text-[#0095f6] text-xs">📌</span>}
                      <Camera className="w-[22px] h-[22px] text-white/85" strokeWidth={1.5} aria-hidden />
                    </div>
                  </button>
                  <div className="flex flex-col items-center justify-center shrink-0">
                    <button
                      type="button"
                      data-thread-menu-trigger
                      aria-label="Conversation options"
                      aria-expanded={threadMenuForId === t.otherId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setThreadMenuForId((id) => (id === t.otherId ? null : t.otherId));
                      }}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white/85 active:bg-white/10"
                    >
                      <MoreVertical className="w-5 h-5" strokeWidth={2} />
                    </button>
                  </div>
                  {threadMenuForId === t.otherId && (
                    <div
                      data-thread-menu-popover
                      className="absolute right-0 top-full z-30 mt-0 min-w-[200px] rounded-xl border border-white/15 bg-[#1a1a1a] py-1 shadow-xl"
                      role="menu"
                    >
                      {inGeneral ? (
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                          onClick={() => setThreadGeneralLabel(t.otherId, false)}
                        >
                          Move to Primary
                        </button>
                      ) : (
                        <button
                          type="button"
                          role="menuitem"
                          className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
                          onClick={() => setThreadGeneralLabel(t.otherId, true)}
                        >
                          Move to General
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {!loadingThreads && !threadsError && showRequests &&
            requests.map((t: any) => (
              <div
                key={t.otherId}
                className="w-full flex items-center justify-between py-3 border-b border-white/10"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="font-semibold text-white text-[15px] truncate">
                    {t.other?.displayName || t.other?.username || 'Request'}
                  </span>
                  <span className="text-white/65 text-[13px] truncate">
                    {t.lastMessage || 'No messages yet'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getToken();
                      if (!token) return;
                      try {
                        await fetch(
                          `${getApiBase()}/message_requests/${encodeURIComponent(t.otherId)}/accept`,
                          {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        setRequests((prev) => prev.filter((r) => r.otherId !== t.otherId));
                        navigate(`/messages/${t.otherId}`);
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-[12px] font-semibold text-[#0095f6]"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getToken();
                      if (!token) return;
                      try {
                        await fetch(
                          `${getApiBase()}/message_requests/${encodeURIComponent(t.otherId)}/decline`,
                          {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        setRequests((prev) => prev.filter((r) => r.otherId !== t.otherId));
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-[12px] text-white/70"
                  >
                    Ignore
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const token = getToken();
                      if (!token) return;
                      try {
                        await fetch(
                          `${getApiBase()}/message_requests/${encodeURIComponent(t.otherId)}/block`,
                          {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}` },
                          },
                        );
                        setRequests((prev) => prev.filter((r) => r.otherId !== t.otherId));
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-[12px] text-red-200"
                  >
                    Block
                  </button>
                </div>
              </div>
            ))}
          </div>

          </div>
        </MobileShell>
      </ThemedView>
    );

  const matchThread = (t: any, uid: string | undefined) =>
    !!uid && (t.otherId === uid || t.other?.id === uid || t.peer?.id === uid);
  const threadHit = threads.find((t) => matchThread(t, userId));
  const requestHit = requests.find((t) => matchThread(t, userId));
  const peer = threadHit?.other ?? threadHit?.peer ?? requestHit?.other ?? requestHit?.peer;
  const resolvedPeer = peer ?? peerFromProfile;

  const meId = (currentAccount as any)?.id ?? FALLBACK_USER.id;
  const myAvatarUri =
    (currentAccount as any)?.profilePhoto ||
    (currentAccount as any)?.avatarUri ||
    (currentAccount as any)?.avatarUrl ||
    null;
  const peerAvatarUri = resolvedPeer?.profilePhoto || resolvedPeer?.avatarUri || null;

  useEffect(() => {
    let cancelled = false;
    async function loadPeerProfile() {
      if (!userId || groupId) {
        setPeerFromProfile(null);
        return;
      }
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${getApiBase()}/accounts/${encodeURIComponent(userId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        setPeerFromProfile(data && typeof data === 'object' ? data : null);
      } catch {
        if (!cancelled) setPeerFromProfile(null);
      }
    }
    void loadPeerProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, groupId]);

  const formatMsgClock = (iso: string | undefined) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };

  const conversationRows = useMemo(() => {
    const rows: Array<{ type: 'date'; label: string; key: string } | { type: 'msg'; m: any; idx: number }> = [];
    let lastDay = '';
    messages.forEach((m: any, idx: number) => {
      const iso = m.createdAt || m.timestamp || m.sentAt;
      const d = iso ? new Date(iso) : new Date();
      const day = d.toDateString();
      if (day !== lastDay) {
        lastDay = day;
        rows.push({
          type: 'date',
          key: `d-${day}`,
          label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        });
      }
      rows.push({ type: 'msg', m, idx });
    });
    return rows;
  }, [messages]);

  const mediaInputRef = React.useRef<HTMLInputElement | null>(null);

  if (!isConversation) return inboxView;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <div className={`flex flex-col min-h-[100dvh] max-h-[100dvh] ${dmSkin.shell}`}>
      <header className={`shrink-0 px-3 py-2 ${dmSkin.header}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button type="button" onClick={() => navigate('/messages')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0">
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
            <Avatar uri={peerAvatarUri} size={40} />
            <div className="min-w-0">
              <p className="text-white font-semibold text-[20px] leading-tight truncate">{groupId ? activeGroup?.name || 'Group' : resolvedPeer?.displayName || resolvedPeer?.username || 'Conversation'}</p>
              <p className="text-white/65 text-[13px] leading-tight -mt-0.5 truncate">{groupId ? 'Group chat' : `@${resolvedPeer?.username || 'user'}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-white shrink-0">
            <button type="button" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Phone className="w-[16px] h-[16px]" /></button>
            <button type="button" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Video className="w-[16px] h-[16px]" /></button>
            <button
              type="button"
              aria-label="Chat theme"
              onClick={() => setShowThemePicker(true)}
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Palette className="w-[16px] h-[16px]" />
            </button>
            <button type="button" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"><Flag className="w-[16px] h-[16px]" /></button>
          </div>
        </div>
      </header>
      <div className={`flex-1 overflow-y-auto px-3 py-2 min-h-0 ${dmSkin.scroll}`}>
        {loadingMessages && <p className="text-white/70 text-sm py-4">Loading conversation…</p>}
        {messagesError && !loadingMessages && (
          <p
            className={`text-sm py-4 ${isSecureContextHintMessage(messagesError) ? 'text-[#a8a8a8]' : 'text-red-200'}`}
            role="status"
          >
            {messagesError}
          </p>
        )}
        {!loadingMessages && !messagesError && conversationRows.length === 0 && (
          <div className="h-full flex items-center justify-center text-center px-8">
            <p className="text-white/50 text-sm">No messages yet. Start the conversation.</p>
          </div>
        )}
        {!loadingMessages &&
          !messagesError &&
          conversationRows.map((row) => {
            if (row.type === 'date') {
              return (
                <div key={row.key} className="text-center text-white/65 text-[12px] py-3">
                  {row.label}
                </div>
              );
            }
            const m = row.m;
            const idx = row.idx;
            const isMine = m.isMine ?? m.senderId === meId;
            const isPoll = m.messageType === 'POLL' && m.media && Array.isArray((m.media as any).options);
            const clock = formatMsgClock(m.createdAt || m.timestamp || m.sentAt);
            const isLastMine = isMine && idx === messages.length - 1;
            const bubble = (
              <div
                className={`max-w-[min(78vw,280px)] px-3 py-2 text-[15px] leading-snug ${
                  isMine ? dmSkin.mine : dmSkin.theirs
                }`}
              >
                {m.content && <div className="whitespace-pre-wrap break-words">{m.content}</div>}
                {m.media?.url && m.messageType === 'VOICE' && <audio src={ensureAbsoluteMediaUrl(m.media.url)} controls className="mt-2 w-full" />}
                {m.media?.url && m.messageType === 'MEDIA' && (
                  <div className="mt-2 relative rounded-2xl overflow-hidden bg-black/30">
                    {isVideoMediaUrl(m.media.url) ? (
                      <video
                        src={ensureAbsoluteMediaUrl(m.media.url)}
                        className="w-full max-h-64 object-cover"
                        muted
                        playsInline
                        controls
                      />
                    ) : (
                      <img src={ensureAbsoluteMediaUrl(m.media.url)} alt="" className="w-full max-h-64 object-cover" />
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[10px] text-white">
                      <span className="font-semibold">Reels</span>
                    </div>
                  </div>
                )}
                {m.media?.url && m.messageType === 'GIF' && (
                  <img src={ensureAbsoluteMediaUrl(m.media.url)} alt="" className="mt-2 max-h-48 rounded-xl w-full object-cover" />
                )}
                {isPoll && Array.isArray((m.media as any).options) && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    {(m.media as any).options.map((opt: string, optIdx: number) => {
                      const total = (m.pollResults as number[] | undefined)?.reduce((a, b) => a + b, 0) ?? 0;
                      const count = (m.pollResults as number[] | undefined)?.[optIdx] ?? 0;
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      const voted = m.myVote === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={async () => {
                            try {
                              const token = getToken();
                              if (!token) return;
                              await fetch(`${getApiBase()}/messages/${m.id}/poll/vote`, {
                                method: 'POST',
                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ optionIndex: optIdx }),
                              });
                              setRefreshThreadTrigger((t) => t + 1);
                            } catch {
                              // ignore
                            }
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-full ${
                            voted ? 'bg-white/30 text-white' : 'bg-black/25 text-white/90'
                          }`}
                        >
                          <span>{opt}</span>
                          {total > 0 && <span className="text-[10px] text-white/70">{pct}%</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
            return (
              <div key={m.id} className={`flex items-end gap-2 mb-2.5 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                {!groupId && (
                  <div className="shrink-0 pb-0.5">
                    <Avatar uri={isMine ? myAvatarUri : peerAvatarUri} size={28} />
                  </div>
                )}
                <div className={`flex items-end gap-1.5 min-w-0 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                  {isMine && clock ? <span className="text-[11px] text-white/50 shrink-0 pb-1">{clock}</span> : null}
                  <div className="flex flex-col gap-1">
                    {bubble}
                    <div className="hidden gap-2 text-[10px] text-white/50 group-hover:flex px-1">
                      <button type="button" onClick={() => reactToMessage(m.id)} className="underline">
                        React
                      </button>
                      <button type="button" onClick={() => deleteMessage(m.id, true)}>
                        Delete for me
                      </button>
                      {isMine && (
                        <button type="button" onClick={() => deleteMessage(m.id, false)}>
                          Unsend
                        </button>
                      )}
                    </div>
                    {isLastMine && isMine && (
                      <span className="text-[10px] text-white/45 text-right pr-1">{m.seenByEveryone ? 'Seen' : 'Sent'}</span>
                    )}
                  </div>
                  {!isMine && clock ? <span className="text-[11px] text-white/50 shrink-0 pb-1">{clock}</span> : null}
                </div>
              </div>
            );
          })}
      </div>
      <form
        onSubmit={sendMessage}
        className={`shrink-0 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] ${dmSkin.composer} flex flex-col gap-2`}
      >
        <input ref={mediaInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
        <div className="hidden items-center gap-2">
          <label className="px-3 py-1 rounded-full bg-[#9e7a18] border border-[#8f6e16] text-xs cursor-pointer text-white">
            {mediaFile ? 'Media attached' : 'Add photo/video'}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="px-3 py-1 rounded-full bg-[#9e7a18] border border-[#8f6e16] text-xs cursor-pointer flex items-center gap-1 text-white">
            {isRecordingVoice ? 'Voice selected' : 'Upload voice'}
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setMediaFile(f);
                setIsRecordingVoice(!!f);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => (isRecording ? stopVoiceRecording() : startVoiceRecording())}
            className={`px-3 py-1 rounded-full border text-xs flex items-center gap-1 ${isRecording ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-[#9e7a18] border-[#8f6e16] text-white'}`}
            title={isRecording ? 'Stop recording' : 'Record voice message'}
          >
            {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isRecording ? 'Stop' : 'Record'}
          </button>
          <label className="flex items-center gap-1 text-[11px] text-moxe-textSecondary">
            <input
              type="checkbox"
              checked={viewOnce}
              onChange={(e) => setViewOnce(e.target.checked)}
              className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
            />
            View once
          </label>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex items-center gap-1 min-w-0 rounded-full bg-[#121720] border border-[#2b3442] pl-2 pr-1 py-1.5">
            <button
              type="button"
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white/85"
              aria-label="Search in chat"
            >
              <Search className="w-[17px] h-[17px]" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => (isRecording ? stopVoiceRecording() : startVoiceRecording())}
              className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white/85"
              title={isRecording ? 'Stop recording' : 'Voice message'}
              aria-label={isRecording ? 'Stop recording' : 'Record voice'}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-[16px] h-[16px]" />}
            </button>
            <ThemedInput
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (!typing) {
                  setTyping(true);
                  setTimeout(() => setTyping(false), 2000);
                }
                const socket = getDmSocket();
                if (socket && userId && !groupId) {
                  socket.emit('typing', { to: userId });
                }
              }}
              placeholder="Message…"
              className="flex-1 min-w-0 !border-0 !bg-transparent !shadow-none !rounded-none !py-2 !px-0 !text-[15px] !text-white placeholder:!text-white/45"
            />
            <button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/80 active:bg-white/10"
              aria-label="Attach photo or video"
            >
              <ImageIcon className="w-[20px] h-[20px]" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={() => setNewMessage('')}
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-white/80 active:bg-white/10"
              aria-label="Clear text"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
          <button
            type="submit"
            disabled={blocked || blockedByThem || (!newMessage.trim() && !mediaFile)}
            className="shrink-0 h-10 px-4 rounded-full bg-transparent border-0 text-[#2f81f7] text-[16px] font-semibold disabled:opacity-40"
            aria-label="Send"
          >
            Send
          </button>
        </div>
        {showGifPicker && (
          <div className="mt-2 p-2 rounded-moxe-md bg-moxe-surface border border-moxe-border max-h-40 overflow-auto space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={gifQuery}
                onChange={(e) => setGifQuery(e.target.value)}
                placeholder="Search GIFs…"
                className="flex-1 px-2 py-1 rounded-moxe-md bg-moxe-background border border-moxe-border text-[11px] text-moxe-text placeholder:text-moxe-textSecondary"
              />
              {gifLoading && (
                <ThemedText secondary className="text-[11px]">
                  Loading…
                </ThemedText>
              )}
            </div>
            <div className="flex gap-2 mb-1 text-[11px]">
              {['Trending', 'Happy', 'Sad', 'Love', 'Reaction'].map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={async () => {
                    const token = getToken();
                    if (!token) return;
                    setGifQuery(label);
                    setGifLoading(true);
                    setGifError(null);
                    try {
                      const res = await fetch(
                        `${getApiBase()}/gifs/search?q=${encodeURIComponent(label.toLowerCase())}`,
                        { headers: { Authorization: `Bearer ${token}` } },
                      );
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(data.error || 'Failed to load GIFs.');
                      }
                      const items = (data.items ?? data.results ?? []) as any[];
                      setGifResults(
                        items.map((g) => ({
                          id: g.id || g.url,
                          url: g.url,
                          previewUrl: g.previewUrl || g.url,
                        })),
                      );
                      setShowGifPicker(true);
                    } catch (e: any) {
                      setGifError(e.message || 'Failed to load GIFs.');
                    } finally {
                      setGifLoading(false);
                    }
                  }}
                  className="px-2 py-0.5 rounded-full border border-moxe-border bg-moxe-background text-moxe-textSecondary"
                >
                  {label}
                </button>
              ))}
            </div>
            {gifError && (
              <ThemedText className="text-[11px] text-moxe-danger">
                {gifError}
              </ThemedText>
            )}
            <div className="grid grid-cols-3 gap-2">
              {gifResults.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={async () => {
                    if (blocked) {
                      setGifError('Unblock to send messages to this user.');
                      return;
                    }
                    if (blockedByThem) {
                      setGifError('Use "Send limited message" to contact this user.');
                      return;
                    }
                    const token = getToken();
                    if (!token || (!userId && !groupId)) return;
                    try {
                      const res = await fetch(`${getApiBase()}/messages`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          recipientId: groupId ? undefined : userId,
                          groupId: groupId || undefined,
                          messageType: 'GIF',
                          media: { url: g.url },
                          content: '',
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        throw new Error(data.error || 'Failed to send GIF.');
                      }
                      setMessages((prev) => normalizeMessages([...prev, data]));
                      setShowGifPicker(false);
                    } catch (e: any) {
                      setGifError(e.message || 'Failed to send GIF.');
                    }
                  }}
                  className="relative w-full aspect-square rounded-moxe-md overflow-hidden bg-moxe-background"
                >
                  <img
                    src={g.previewUrl || g.url}
                    alt="gif"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        {showPollModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl bg-moxe-surface border border-moxe-border p-4 shadow-xl">
              <h3 className="text-sm font-semibold text-moxe-text mb-3">Create poll</h3>
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Poll question"
                className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-text text-sm placeholder:text-moxe-textSecondary mb-2"
              />
              <div className="space-y-2 mb-3">
                {pollOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const next = [...pollOptions];
                      next[i] = e.target.value;
                      setPollOptions(next);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-text text-sm placeholder:text-moxe-textSecondary"
                  />
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((p) => [...p, ''])}
                    className="px-2 py-1 text-xs text-moxe-primary border border-moxe-primary rounded-moxe-md"
                  >
                    + Add option
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowPollModal(false);
                    setPollQuestion('');
                    setPollOptions(['', '']);
                  }}
                  className="px-2 py-1 text-xs text-moxe-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendPollMessage}
                  disabled={pollSubmitting}
                  className="px-3 py-1 text-xs bg-moxe-primary text-white rounded-moxe-md disabled:opacity-50"
                >
                  {pollSubmitting ? 'Sending…' : 'Send poll'}
                </button>
              </div>
            </div>
          </div>
        )}
        {peerTyping && (
          <ThemedText secondary className="text-moxe-caption text-[#737373]">
            Typing…
          </ThemedText>
        )}
        {blocked && userId && (
          <ThemedText secondary className="text-moxe-caption text-[#737373]">
            You can&apos;t message this user while blocked.
          </ThemedText>
        )}
        {blocked &&
          userId &&
          premiumBlockedReceivedItems.length > 0 && (
            <div className="mt-2 space-y-2">
              <ThemedText secondary className="text-moxe-caption text-[#737373]">
                Premium message received from this user. View to reply.
              </ThemedText>
              {loadingPremiumBlockedReceived && (
                <ThemedText secondary className="text-moxe-caption">
                  Loading premium message…
                </ThemedText>
              )}
              {premiumBlockedReceivedError && (
                <ThemedText className="text-[11px] text-moxe-danger">
                  {premiumBlockedReceivedError}
                </ThemedText>
              )}
              {premiumBlockedReceivedItems[0] && (
                <div className="rounded-xl bg-moxe-background border border-moxe-border p-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-moxe-text">
                        {premiumBlockedReceivedItems[0].sender?.displayName ||
                          premiumBlockedReceivedItems[0].sender?.username ||
                          'Premium sender'}
                      </p>
                      <p className="text-[10px] text-moxe-textSecondary">
                        {premiumBlockedReceivedItems[0].sentAt
                          ? new Date(premiumBlockedReceivedItems[0].sentAt).toLocaleString()
                          : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-moxe-text whitespace-pre-wrap">
                    {premiumBlockedReceivedItems[0].content}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => handlePremiumBlockedView(premiumBlockedReceivedItems[0])}
                      className="px-2 py-1 text-xs bg-moxe-primary text-white rounded-moxe-md"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePremiumBlockedReblock(premiumBlockedReceivedItems[0])}
                      className="px-2 py-1 text-xs text-moxe-textSecondary border border-moxe-border rounded-moxe-md"
                    >
                      Re-block
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePremiumBlockedReport(premiumBlockedReceivedItems[0])}
                      className="px-2 py-1 text-xs text-moxe-danger border border-moxe-danger/40 rounded-moxe-md"
                    >
                      Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        {blockedByThem && userId && (
          <div className="space-y-1">
            <ThemedText secondary className="text-moxe-caption text-[#737373]">
              This user has blocked you. Star or Thick members can send a limited message (2 per month).
            </ThemedText>
            <button
              type="button"
              onClick={async () => {
                const token = getToken();
                if (!token || !userId) return;
                try {
                  const res = await fetch(`${getApiBase()}/premium/blocked-messages/check?recipientId=${encodeURIComponent(userId)}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const data = await res.json().catch(() => ({}));
                  setPremiumCheck(data);
                  setShowPremiumMessageModal(true);
                  setPremiumMessageContent('');
                } catch {
                  setPremiumCheck({ canSend: false, remainingGrants: 0, characterLimit: 150 });
                  setShowPremiumMessageModal(true);
                }
              }}
              className="text-xs text-moxe-primary font-medium"
            >
              Send limited message
            </button>
          </div>
        )}
        {showPremiumMessageModal && userId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl bg-moxe-surface border border-moxe-border p-4 shadow-xl">
              <h3 className="text-sm font-semibold text-moxe-text mb-2">Send limited message</h3>
              {premiumCheck && (
                <p className="text-xs text-moxe-textSecondary mb-2">
                  {premiumCheck.canSend
                    ? `You have ${premiumCheck.remainingGrants} grant(s) this period. Max ${premiumCheck.characterLimit} characters.`
                    : premiumCheck.reason || 'You cannot send a limited message.'}
                </p>
              )}
              {premiumCheck?.canSend && (
                <>
                  <textarea
                    value={premiumMessageContent}
                    onChange={(e) => setPremiumMessageContent(e.target.value.slice(0, premiumCheck?.characterLimit ?? 150))}
                    placeholder="Your message…"
                    maxLength={premiumCheck?.characterLimit ?? 150}
                    className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-text text-sm placeholder:text-moxe-textSecondary mb-2 min-h-[80px]"
                    rows={3}
                  />
                  <p className="text-[10px] text-moxe-textSecondary mb-2">{premiumMessageContent.length} / {premiumCheck?.characterLimit ?? 150}</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setShowPremiumMessageModal(false); setPremiumCheck(null); setPremiumMessageContent(''); }} className="px-2 py-1 text-xs text-moxe-textSecondary">Cancel</button>
                    <button
                      type="button"
                      disabled={premiumSending || !premiumMessageContent.trim()}
                      onClick={async () => {
                        const token = getToken();
                        if (!token || !userId || !premiumMessageContent.trim()) return;
                        setPremiumSending(true);
                        try {
                          const res = await fetch(`${getApiBase()}/premium/blocked-messages`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ recipientId: userId, content: premiumMessageContent.trim() }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (res.ok) {
                            setShowPremiumMessageModal(false);
                            setPremiumCheck(null);
                            setPremiumMessageContent('');
                            setMessagesError(null);
                            setRefreshThreadTrigger((t) => t + 1);
                          } else {
                            setMessagesError(data.error || data.reason || 'Failed to send.');
                          }
                        } finally {
                          setPremiumSending(false);
                        }
                      }}
                      className="px-3 py-1 text-xs bg-moxe-primary text-white rounded-moxe-md disabled:opacity-50"
                    >
                      {premiumSending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                </>
              )}
              {premiumCheck && !premiumCheck.canSend && (
                <button type="button" onClick={() => { setShowPremiumMessageModal(false); setPremiumCheck(null); }} className="mt-2 px-2 py-1 text-xs text-moxe-textSecondary">Close</button>
              )}
            </div>
          </div>
        )}
      </form>
      {showThemePicker && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dm-theme-title"
        >
          <button
            type="button"
            className="absolute inset-0 z-0 cursor-default"
            aria-label="Close theme picker"
            onClick={() => setShowThemePicker(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-[#1a1a1a] border border-white/10 p-4 shadow-xl safe-area-pb">
            <div className="flex items-center justify-between mb-2">
              <p id="dm-theme-title" className="text-white font-semibold">
                Chat theme
              </p>
              <button
                type="button"
                onClick={() => setShowThemePicker(false)}
                className="p-2 rounded-full text-white/70 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/60 text-xs mb-3">
              Conversation colors are saved to your account and apply when you open DMs on this web app.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DM_THEME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => void selectDmTheme(id)}
                  className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                    dmThemeId === id ? 'border-moxe-primary bg-white/10' : 'border-white/15 bg-black/30 active:bg-white/5'
                  }`}
                >
                  <span className="text-white font-medium">{DM_THEME_LABELS[id]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {premiumBlockedViewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-xl bg-moxe-surface border border-moxe-border p-4 shadow-xl space-y-3">
            <h3 className="text-sm font-semibold text-moxe-text">Premium blocked message</h3>
            <div className="text-xs text-moxe-textSecondary">
              From{' '}
              {premiumBlockedViewItem.sender?.displayName ||
                premiumBlockedViewItem.sender?.username ||
                'Premium sender'}
            </div>
            <div className="text-sm text-moxe-text whitespace-pre-wrap">
              {premiumBlockedViewItem.content}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPremiumBlockedViewItem(null)}
                className="px-2 py-1 text-xs text-moxe-textSecondary border border-moxe-border rounded-moxe-md"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setPremiumBlockedViewItem(null)}
                className="px-3 py-1 text-xs bg-moxe-primary text-white rounded-moxe-md"
              >
                Reply
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
