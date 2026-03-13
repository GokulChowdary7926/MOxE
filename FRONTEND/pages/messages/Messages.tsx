import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemedView, ThemedText, ThemedHeader, ThemedInput, ThemedButton } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { connectDmSocket, getDmSocket } from '../../services/dmSocket';
import type { RootState } from '../../store';

import { getApiBase, getToken } from '../../services/api';
import { mockThreads } from '../../mocks/messages';
import { mockMessages as mockMessagesList } from '../../mocks/messages';
import { mockUsers } from '../../mocks/users';

export default function Messages() {
  const { userId, groupId } = useParams();
  const navigate = useNavigate();
  const { currentAccount } = useSelector((state: RootState) => state.account);

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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<{ id: string; url: string; previewUrl?: string }[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [inboxTab, setInboxTab] = useState<'primary' | 'general' | 'requests'>('primary');
  const [inboxSearch, setInboxSearch] = useState('');

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
            const threadsArr = (data.threads ?? data) || [];
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
          const me = (currentAccount as any)?.id ?? mockUsers[0].id;
          const mapped = mockThreads
            .filter((t) => t.userId === me)
            .map((t) => {
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
          setThreads(mapped);
          setPinnedIds(mockThreads.filter((t) => t.isPinned).map((t) => t.otherUserId));
        }
      } catch (e: any) {
        if (!cancelled) {
          setThreadsError(e.message || 'Failed to load messages.');
          const me = (currentAccount as any)?.id ?? mockUsers[0].id;
          const mapped = mockThreads
            .filter((t) => t.userId === me)
            .map((t) => {
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
          setThreads(mapped);
        }
      } finally {
        if (!cancelled) setLoadingThreads(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [currentAccount]);

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
        setGroups(data.groups ?? data ?? []);
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
        if (token && !groupId) {
          const qs = `userId=${encodeURIComponent(userId as string)}`;
          const res = await fetch(`${getApiBase()}/messages?${qs}&limit=50`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && !cancelled) {
            const items = data.items ?? data.messages ?? data ?? [];
            if (items.length > 0) {
              setMessages(items);
              setLoadingMessages(false);
              if (userId) {
                fetch(`${getApiBase()}/messages/thread-read`, {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId }),
                }).catch(() => {});
              }
              return;
            }
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
  }, [userId, groupId, currentAccount]);

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
        } else {
          setBlocked(false);
        }
      } catch {
        // ignore
      }
    }
    checkBlock();
  }, [userId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content && !mediaFile) return;
    if (!userId && !groupId) return;
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
      let messageType: 'TEXT' | 'MEDIA' | 'VOICE' | 'GIF' = 'TEXT';
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
          media: mediaPayload,
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
      setMessagesError(e.message || 'Failed to send message.');
    }
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
        <ThemedHeader
          title="Messages"
          className="border-b border-[#262626] bg-black"
        />
        {/* Search bar */}
        <div className="px-4 py-2 border-b border-[#262626]">
          <input
            type="search"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
            placeholder="Search"
            className="w-full px-3 py-2 rounded-lg bg-[#262626] border border-[#363636] text-white placeholder:text-[#737373] text-sm"
          />
        </div>
        {/* Tabs: Primary | General | Requests */}
        <div className="flex border-b border-[#262626]">
          {[
            { key: 'primary' as const, label: 'Primary' },
            { key: 'general' as const, label: 'General' },
            { key: 'requests' as const, label: `Requests${requests.length > 0 ? ` (${requests.length})` : ''}` },
          ].map(({ key, label }) => {
            const isActive = key === 'requests' ? showRequests : inboxTab === key && !showRequests;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setInboxTab(key);
                  setShowRequests(key === 'requests');
                }}
                className={`flex-1 py-3 text-sm font-semibold ${
                  isActive ? 'text-[#0095f6] border-b-2 border-[#0095f6]' : 'text-[#737373] border-b-2 border-transparent'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-auto px-4 py-3 space-y-0">
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
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar uri={avatarUri} size={44} />
                    <div className="flex flex-col min-w-0">
                      <ThemedText className="font-semibold text-moxe-body truncate">
                        {name}
                      </ThemedText>
                      <ThemedText secondary className="text-moxe-caption truncate">
                        {t.lastMessage || 'No messages yet'}
                      </ThemedText>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {t.mutedUntil && (
                      <span className="inline-flex px-1.5 py-0.5 rounded-full bg-moxe-background text-[9px] text-moxe-textSecondary">
                        Muted
                      </span>
                    )}
                    {pinnedIds.includes(t.otherId) && (
                      <span className="inline-flex px-1.5 py-0.5 rounded-full bg-moxe-primary/10 text-[9px] text-moxe-primary">
                        📌
                      </span>
                    )}
                    {t.unread > 0 && (
                      <span className="inline-flex min-w-[20px] h-5 px-1 rounded-full bg-moxe-primary text-[10px] text-white items-center justify-center">
                        {t.unread}
                      </span>
                    )}
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
        <div className="border-t border-moxe-border mt-2 pt-2">
          <ThemedText secondary className="text-moxe-caption mb-1">
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
      </ThemedView>
    );
  }

  const peer = threads.find((t) => t.peer?.id === userId || t.otherId === userId)?.other ||
    requests.find((t) => t.peer?.id === userId || t.otherId === userId)?.other;
  const group = groups.find((g) => g.id === groupId);

  return (
    <ThemedView className="min-h-screen flex flex-col">
      <ThemedHeader
        title={groupId ? group?.name || 'Group' : peer?.username || 'Conversation'}
        left={
          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="text-moxe-text text-2xl leading-none"
            aria-label="Back"
          >
            ←
          </button>
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
          <label className="px-3 py-1 rounded-moxe-md bg-moxe-surface border border-moxe-border text-xs cursor-pointer">
            {isRecordingVoice ? 'Voice selected' : 'Add voice note'}
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
          <ThemedButton
            type="submit"
            label="Send"
            className="px-3 py-1 text-xs"
            disabled={!newMessage.trim() && !mediaFile}
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
      </form>
    </ThemedView>
  );
}
