import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PenSquare, Camera, Search as SearchIcon, Mic, Square, StickyNote } from 'lucide-react';
import { ThemedView, ThemedText, ThemedHeader, ThemedInput, ThemedButton } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { MobileShell } from '../../components/layout/MobileShell';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import { useAccountType } from '../../hooks/useAccountCapabilities';
import { connectDmSocket, getDmSocket } from '../../services/dmSocket';
import type { RootState } from '../../store';

import { getApiBase, getToken } from '../../services/api';
import { normalizeToArray } from '../../utils/safeAccess';
import { mockThreads } from '../../mocks/messages';
import { mockMessages as mockMessagesList } from '../../mocks/messages';
import { mockUsers } from '../../mocks/users';

export default function Messages() {
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  const { currentAccount } = useSelector((state: RootState) => state.account);
  const accountType = useAccountType() || 'PERSONAL';
  const showPrimaryGeneral = accountType === 'BUSINESS' || accountType === 'CREATOR';
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
  const [groups, setGroups] = useState<any[]>([]);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
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

  const buildMockThreads = useCallback(() => {
    const me = (currentAccount as any)?.id ?? mockUsers[0].id;
    let source = mockThreads.filter((t) => t.userId === me);
    // If current account has no dedicated mock seed, fall back to global mock list
    // so the inbox never renders as a broken/blank state.
    if (source.length === 0) source = mockThreads;
    return source.map((t) => {
      const other = mockUsers.find((u) => u.id === t.otherUserId) ?? mockUsers[0];
      return {
        otherId: t.otherUserId,
        other: { id: other.id, username: other.username, displayName: other.displayName, profilePhoto: other.avatarUrl },
        lastMessage: t.lastMessage,
        unread: t.unreadCount,
        isMuted: t.isMuted,
        updatedAt: t.updatedAt,
      };
    });
  }, [currentAccount]);

  // Realtime DM socket: join /dm namespace and listen for message / typing / read events.
  useEffect(() => {
    const me = currentAccount?.id;
    if (!me) return;
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
        return [...prev, msg];
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

  // Load thread list (left pane). API-first with mock fallback.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingThreads(true);
      setThreadsError(null);
      try {
        const token = getToken();
        if (token) {
          const res = await fetch(`${getApiBase()}/messages/threads`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && !cancelled) {
            const threadsArr = normalizeToArray(data.threads ?? data);
            if (threadsArr.length > 0) {
              setThreads(threadsArr);
              setRequests(data.requests ?? []);
              setPinnedIds(data.pinnedIds ?? []);
              setLoadingThreads(false);
              return;
            }
          }
        }
        // No token or empty/failed: use mocks so inbox is always populated.
        if (!cancelled) {
          setThreads(buildMockThreads());
          setPinnedIds(mockThreads.filter((t) => t.isPinned).map((t) => t.otherUserId));
        }
      } catch (e: any) {
        if (!cancelled) {
          setThreadsError(e.message || 'Failed to load messages.');
          setThreads(buildMockThreads());
        }
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentAccount, buildMockThreads]);

  // Load groups list
  useEffect(() => {
    let cancelled = false;
    async function loadGroups() {
      setLoadingGroups(true);
      setGroupsError(null);
      try {
        const token = getToken();
        if (!token) {
          setGroups([]);
          setLoadingGroups(false);
          return;
        }
        const res = await fetch(`${getApiBase()}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Unable to load groups.');
        }
        if (cancelled) return;
        const groupsArr = normalizeToArray(data.groups ?? data);
        setGroups(groupsArr);
      } catch (e: any) {
        if (!cancelled) setGroupsError(e.message || 'Failed to load groups.');
      } finally {
        if (!cancelled) setLoadingGroups(false);
      }
    }
    loadGroups();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load messages for active conversation (DM or group). API-first with mock fallback.
  useEffect(() => {
    if (!userId && !groupId) return;
    let cancelled = false;
    async function loadThread() {
      setLoadingMessages(true);
      setMessagesError(null);
      try {
        const token = getToken();
        const me = (currentAccount as any)?.id ?? mockUsers[0].id;
        if (token && (userId || groupId)) {
          const qs = groupId
            ? `groupId=${encodeURIComponent(groupId)}`
            : `userId=${encodeURIComponent(userId as string)}`;
          const res = await fetch(`${getApiBase()}/messages?${qs}&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && !cancelled) {
            const items = normalizeToArray(data.items ?? data.messages ?? data);
            setMessages(items);
            setLoadingMessages(false);
            if (userId && !groupId) {
              fetch(`${getApiBase()}/messages/thread-read`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
              }).catch(() => {});
            }
            if (items.length > 0 || groupId) return;
          }
        }
        // No token or empty/failed (DM only): use mocks for this thread.
        if (!cancelled && !groupId && userId) {
          const thread = mockThreads.find(
            (t) => t.otherUserId === userId || t.userId === userId,
          );
          const list = thread
            ? mockMessagesList
                .filter((m) => m.threadId === thread.id)
                .map((m) => {
                  const sender = mockUsers.find((u) => u.id === m.senderId) ?? mockUsers[0];
                  return {
                    id: m.id,
                    senderId: m.senderId,
                    content: m.content,
                    createdAt: m.createdAt,
                    messageType: m.type === 'text' ? 'TEXT' : m.type === 'image' ? 'MEDIA' : 'TEXT',
                    account: { username: sender.username, profilePhoto: sender.avatarUrl },
                  };
                })
            : [];
          setMessages(list);
        }
      } catch (e: any) {
        if (!cancelled) {
          setMessagesError(e.message || 'Failed to load conversation.');
          if (!groupId && userId) {
            const thread = mockThreads.find(
              (t) => t.otherUserId === userId || t.userId === userId,
            );
            const list = thread
              ? mockMessagesList
                  .filter((m) => m.threadId === thread.id)
                  .map((m) => {
                    const sender = mockUsers.find((u) => u.id === m.senderId) ?? mockUsers[0];
                    return {
                      id: m.id,
                      senderId: m.senderId,
                      content: m.content,
                      createdAt: m.createdAt,
                      messageType: 'TEXT',
                      account: { username: sender.username, profilePhoto: sender.avatarUrl },
                    };
                  })
              : [];
            setMessages(list);
          }
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
        const uploadRes = await fetch(`${getApiBase()}/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Failed to upload media.');
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message.');
      }
      setMessages((prev) => [...prev, data]);
      setNewMessage('');
      setMediaFile(null);
      setViewOnce(false);
    } catch (e: any) {
      const msg = e.message || 'Failed to send message.';
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
      setMessages((prev) => [...prev, data]);
      setShowPollModal(false);
      setPollQuestion('');
      setPollOptions(['', '']);
    } catch (e: any) {
      setMessagesError(e.message || 'Failed to send poll.');
    } finally {
      setPollSubmitting(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: mime });
        setMediaFile(file);
        setIsRecordingVoice(true);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setMessagesError('Microphone access needed for voice messages.');
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

  if (!isConversation) {
    return (
      <ThemedView className="min-h-screen flex flex-col bg-black">
        <MobileShell>
          {/* Header: username + chevron (left), new message icon (right) – same as screenshot for all accounts */}
          <MoxePageHeader
            title={username || 'Messages'}
            left={
              <button
                type="button"
                className="w-9 h-9 flex items-center justify-center text-white"
                aria-label="Switch account"
                onClick={() => navigate('/settings/accounts')}
              >
                <span className="text-xl leading-none text-[#a8a8a8]">⌄</span>
              </button>
            }
            right={
              <div className="flex items-center gap-1">
                <Link to="/notes" className="w-9 h-9 flex items-center justify-center text-white" aria-label="MOxE Notes">
                  <StickyNote className="w-5 h-5" />
                </Link>
                <Link to="/messages/new" className="w-9 h-9 flex items-center justify-center text-white" aria-label="New message">
                  <PenSquare className="w-5 h-5" />
                </Link>
              </div>
            }
          />

          {/* Search bar */}
          <div className="px-4 py-2 border-b border-[#262626]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
              <input
                type="search"
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
              />
            </div>
          </div>

          {/* Primary | General – only for Business and Creator */}
          {showPrimaryGeneral && (
            <div className="flex border-b border-[#262626]">
              {[
                { key: 'primary' as const, label: 'Primary' },
                { key: 'general' as const, label: 'General' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setInboxTab(key); setShowRequests(false); }}
                  className={`flex-1 py-3 text-sm font-semibold ${
                    inboxTab === key && !showRequests
                      ? 'text-[#0095f6] border-b-2 border-[#0095f6]'
                      : 'text-[#737373] border-b-2 border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Messages section title + Requests link */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#262626]">
            <span className="text-white font-semibold text-sm">Messages</span>
            <Link
              to="/messages/requests"
              className="text-[#0095f6] text-sm font-medium"
            >
              Requests {requests.length > 0 ? `(${requests.length})` : ''}
            </Link>
          </div>

          <div className="flex-1 overflow-auto px-4 py-0 space-y-0 pb-20">
          {loadingThreads && (
            <ThemedText secondary className="text-moxe-caption block py-4">
              Loading conversations…
            </ThemedText>
          )}
          {threadsError && !loadingThreads && (
            <ThemedText className="text-moxe-caption text-moxe-danger block py-4">
              {threadsError}
            </ThemedText>
          )}
          {!loadingThreads &&
            !threadsError &&
            !showRequests &&
            threads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-moxe-surface border border-moxe-border flex items-center justify-center mb-4 text-3xl">
                💬
              </div>
              <ThemedText className="font-semibold text-moxe-title mb-2">No messages yet</ThemedText>
              <ThemedText secondary className="text-center text-moxe-body">
                When people message you, they’ll show up here.
              </ThemedText>
            </div>
          )}
          {!loadingThreads &&
            !threadsError &&
            !showRequests &&
            orderedThreads
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
              const name = other.username || other.displayName || 'Conversation';
              return (
                <button
                  type="button"
                  key={t.otherId}
                  onClick={() => navigate(`/messages/${t.otherId}`)}
                  className="w-full flex items-center justify-between py-3 border-b border-[#262626] text-left active:bg-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <Avatar uri={avatarUri} size={44} />
                      {t.unread > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#0095f6]" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <ThemedText className="font-semibold text-white text-sm truncate">
                        {name}
                      </ThemedText>
                      <ThemedText secondary className="text-[#a8a8a8] text-xs truncate">
                        {t.lastMessage || 'No messages yet'}
                      </ThemedText>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    {t.mutedUntil && (
                      <span className="text-[9px] text-[#737373]">Muted</span>
                    )}
                    {pinnedIds.includes(t.otherId) && (
                      <span className="text-[#0095f6] text-xs">📌</span>
                    )}
                    <span className="text-white/70" aria-hidden>
                      <Camera className="w-5 h-5" />
                    </span>
                  </div>
                </button>
              );
            })}

          {!loadingThreads && !threadsError && showRequests &&
            requests.map((t: any) => (
              <div
                key={t.otherId}
                className="w-full flex items-center justify-between py-2 border-b border-moxe-border/60"
              >
                <div className="flex flex-col">
                  <ThemedText className="font-semibold text-moxe-body">
                    {t.other?.username || t.other?.displayName || 'Request'}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {t.lastMessage || 'No messages yet'}
                  </ThemedText>
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
                    className="text-[11px] text-moxe-primary"
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
                    className="text-[11px] text-moxe-textSecondary"
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
                    className="text-[11px] text-moxe-danger"
                  >
                    Block
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#262626] mt-2 pt-2 px-4 pb-4">
            <ThemedText secondary className="text-[#a8a8a8] text-sm mb-1">
              Groups
            </ThemedText>
          {loadingGroups && (
            <ThemedText secondary className="text-moxe-caption">
              Loading groups…
            </ThemedText>
          )}
          {groupsError && !loadingGroups && (
            <ThemedText className="text-moxe-caption text-moxe-danger">
              {groupsError}
            </ThemedText>
          )}
          {!loadingGroups && !groupsError && groups.length === 0 && (
            <ThemedText secondary className="text-moxe-caption">
              You&apos;re not in any groups yet.
            </ThemedText>
          )}
          {!loadingGroups &&
            !groupsError &&
            groups.map((g: any) => (
              <button
                type="button"
                key={g.id}
                onClick={() => navigate(`/messages/group/${g.id}`)}
                className="w-full flex items-center justify-between py-2 border-b border-moxe-border/60 text-left"
              >
                <div className="flex flex-col">
                  <ThemedText className="font-semibold text-moxe-body">
                    {g.name || 'Group'}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    {g.latestMessagePreview || 'No messages yet'}
                  </ThemedText>
                </div>
              </button>
            ))}
          </div>
        </MobileShell>
      </ThemedView>
    );
  }

  const peer = threads.find((t) => t.peer?.id === userId || t.otherId === userId)?.other ||
    requests.find((t) => t.peer?.id === userId || t.otherId === userId)?.other;
  const group = groups.find((g) => g.id === groupId);

  return (
    <ThemedView className="min-h-screen flex flex-col">
      <ThemedHeader
        title=""
        left={
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/messages')}
              className="text-moxe-text text-2xl leading-none"
              aria-label="Back"
            >
              ←
            </button>
            <span className="text-moxe-title font-semibold text-moxe-text truncate max-w-[170px]">
              {groupId ? group?.name || 'Group' : peer?.username || 'Conversation'}
            </span>
          </div>
        }
        right={
          <div className="flex items-center gap-2">
            {!groupId && (
              <select
                value={muteDuration}
                onChange={(e) =>
                  setMuteDuration(e.target.value as '15m' | '1h' | '8h' | '24h' | 'always')
                }
                className="bg-moxe-surface border border-moxe-border rounded-moxe-md px-1.5 py-1 text-[11px] text-moxe-caption"
              >
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="8h">8h</option>
                <option value="24h">24h</option>
                <option value="always">Always</option>
              </select>
            )}
            {!groupId && userId && (
              <button
                type="button"
                onClick={async () => {
                  const token = getToken();
                  if (!token) return;
                  setBlocking(true);
                  try {
                    if (blocked) {
                      await fetch(`${getApiBase()}/privacy/block/${encodeURIComponent(userId)}`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      setBlocked(false);
                    } else {
                      await fetch(`${getApiBase()}/privacy/block`, {
                        method: 'POST',
                        headers: {
                          Authorization: `Bearer ${token}`,
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ accountId: userId }),
                      });
                      setBlocked(true);
                    }
                  } catch {
                    // ignore
                  } finally {
                    setBlocking(false);
                  }
                }}
                className="text-[11px] px-2 py-1 rounded-moxe-md border border-moxe-border bg-moxe-surface text-moxe-text"
              >
                {blocking ? '…' : blocked ? 'Unblock' : 'Block'}
              </button>
            )}
            <ThemedButton
              label={muted ? 'Unmute' : 'Mute'}
              variant="secondary"
              onClick={toggleMute}
              className="px-2 py-1 text-[11px]"
            />
            <ThemedButton
              label="Pin"
              variant="secondary"
              onClick={pinChat}
              disabled={pinning}
              className="px-2 py-1 text-[11px]"
            />
          </div>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-3 space-y-2">
        {loadingMessages && (
          <ThemedText secondary className="text-moxe-caption block py-4">
            Loading conversation…
          </ThemedText>
        )}
        {messagesError && !loadingMessages && (
          <ThemedText className="text-moxe-caption text-moxe-danger block py-4">
            {messagesError}
          </ThemedText>
        )}
        {!loadingMessages &&
          !messagesError &&
          messages.map((m: any, idx: number) => {
            const meId = (currentAccount as any)?.id ?? mockUsers[0]?.id;
            const isMine = m.isMine ?? m.senderId === meId;
            const isLastMine = isMine && idx === messages.length - 1;
            const isPoll = m.messageType === 'POLL' && m.media && Array.isArray((m.media as any).options);
            return (
              <div key={m.id} className="flex flex-col gap-1 group">
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'self-end bg-[#0095f6] text-white rounded-br-md'
                      : 'self-start bg-[#262626] text-white border border-[#363636] rounded-bl-md'
                  }`}
                >
                  {m.content && (
                    <div className="whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                  )}
                  {m.media?.url && m.messageType === 'VOICE' && (
                    <audio
                      src={m.media.url}
                      controls
                      className="mt-2 w-full"
                    />
                  )}
                  {m.media?.url && m.messageType === 'MEDIA' && (
                    <img
                      src={m.media.url}
                      alt="media"
                      className="mt-2 max-h-40 rounded-md"
                    />
                  )}
                  {m.media?.url && m.messageType === 'GIF' && (
                    <img
                      src={m.media.url}
                      alt="gif"
                      className="mt-2 max-h-40 rounded-md"
                    />
                  )}
                  {isPoll && Array.isArray((m.media as any).options) && (
                    <div className="mt-2 space-y-1 text-[11px]">
                      {(m.media as any).options.map((opt: string, idx: number) => {
                        const total =
                          (m.pollResults as number[] | undefined)?.reduce(
                            (a, b) => a + b,
                            0,
                          ) ?? 0;
                        const count =
                          (m.pollResults as number[] | undefined)?.[idx] ??
                          0;
                        const pct =
                          total > 0 ? Math.round((count / total) * 100) : 0;
                        const voted = m.myVote === idx;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={async () => {
                              try {
                                const token = getToken();
                                if (!token) return;
                                await fetch(
                                  `${getApiBase()}/messages/${m.id}/poll/vote`,
                                  {
                                    method: 'POST',
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ optionIndex: idx }),
                                  },
                                );
                                setRefreshThreadTrigger((t) => t + 1);
                              } catch {
                                // ignore
                              }
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1 rounded-full ${
                              voted
                                ? 'bg-moxe-primary/90 text-white'
                                : 'bg-moxe-background text-moxe-text'
                            }`}
                          >
                            <span>{opt}</span>
                            {total > 0 && (
                              <span className="text-[10px] text-moxe-textSecondary">
                                {pct}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => reactToMessage(m.id)}
                  className="text-[11px] text-moxe-textSecondary self-start px-1"
                >
                  ❤️ React
                </button>
                <div className="flex gap-2 text-[11px] text-moxe-textSecondary opacity-0 group-hover:opacity-100 px-1">
                  <button type="button" onClick={() => deleteMessage(m.id, true)}>
                    Delete for me
                  </button>
                  {isMine && (
                    <button type="button" onClick={() => deleteMessage(m.id, false)}>
                      Unsend for everyone
                    </button>
                  )}
                </div>
                {isLastMine && isMine && (
                  <div className="text-[10px] text-moxe-textSecondary self-end px-1">
                    {m.seenByEveryone ? 'Seen' : 'Sent'}
                  </div>
                )}
              </div>
            );
          })}
      </div>
      <form onSubmit={sendMessage} className="px-moxe-md py-2 border-t border-moxe-border flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <label className="px-3 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-xs cursor-pointer">
            {mediaFile ? 'Media attached' : 'Add photo/video'}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="px-3 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-xs cursor-pointer flex items-center gap-1">
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
            className={`px-3 py-1 rounded-moxe-md border text-xs flex items-center gap-1 ${isRecording ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-moxe-surface border-moxe-border text-moxe-text'}`}
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
        <div className="flex gap-2 items-center">
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
            className="flex-1"
          />
          <button
            type="button"
            onClick={async () => {
              const q = gifQuery.trim();
              if (!q) {
                setShowGifPicker((prev) => !prev);
                return;
              }
              const token = getToken();
              if (!token) return;
              setGifLoading(true);
              setGifError(null);
              try {
                const res = await fetch(
                  `${getApiBase()}/gifs/search?q=${encodeURIComponent(q)}`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(data.error || 'Failed to search GIFs.');
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
                setGifError(e.message || 'Failed to search GIFs.');
              } finally {
                setGifLoading(false);
              }
            }}
            className="px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-xs text-moxe-text"
          >
            GIF
          </button>
          {groupId && (
            <button
              type="button"
              onClick={() => setShowPollModal(true)}
              className="px-2 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-xs text-moxe-text"
            >
              Poll
            </button>
          )}
          <ThemedButton
            type="submit"
            label="Send"
            className="px-3 py-1 text-xs"
            disabled={blocked || blockedByThem || (!newMessage.trim() && !mediaFile)}
          />
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
                      setMessages((prev) => [...prev, data]);
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
    </ThemedView>
  );
}
