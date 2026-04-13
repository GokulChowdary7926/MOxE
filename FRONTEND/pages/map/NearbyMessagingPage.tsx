import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import {
  Image,
  MessageCircle,
  MapPin,
  UserPlus,
  Globe,
  ChevronDown,
  MoreHorizontal,
  MessageSquare,
  Repeat2,
  Heart,
  BarChart3,
  Bookmark,
  Share2,
  Plus,
  Lock,
  AtSign,
  CircleSlash,
  Users,
  BadgeCheck,
  Video,
  Play,
  List,
} from 'lucide-react';
import { getSocket } from '../../services/socket';
import { fetchApi, getToken, getUploadUrl } from '../../services/api';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { Avatar } from '../../components/ui/Avatar';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { SocialCommentsSheet, SocialCommentsEmpty } from '../../components/comments/SocialCommentsSheet';
import toast from 'react-hot-toast';

const MESSAGE_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

type NearbyUsageApi = {
  textRemaining?: number;
  textFreeLimit?: number;
  mediaRemaining?: number;
  mediaFreeLimit?: number;
  textUsedToday?: number;
  mediaUsedToday?: number;
};

type NearbyMessage = {
  messageId?: string;
  text: string;
  fromUserId: string | null;
  fromAccountId?: string | null;
  fromUsername?: string | null;
  fromDisplayName?: string | null;
  sentAt: string;
  imageUrl?: string | null;
  replyCount?: number;
  likeCount?: number;
};

type PendingPost = {
  file: File;
  previewUrl: string;
};

function toSecondBucket(iso?: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
}

function nearbyFingerprint(m: {
  messageId?: string | null;
  fromUserId?: string | null;
  fromAccountId?: string | null;
  fromUsername?: string | null;
  text?: string | null;
  imageUrl?: string | null;
  sentAt?: string | null;
}): string {
  if (m.messageId) return `id:${m.messageId}`;
  const author = (m.fromAccountId || m.fromUserId || m.fromUsername || 'unknown').toLowerCase();
  const text = (m.text || '').trim().toLowerCase();
  const image = (m.imageUrl || '').trim();
  const ts = toSecondBucket(m.sentAt);
  return `${author}|${text}|${image}|${ts}`;
}

function formatTimeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
}

export default function NearbyMessagingPage() {
  const navigate = useNavigate();
  const accountIdFromStore = useSelector((s: RootState) => s.account.currentAccount?.id);
  const currentAccount = useCurrentAccount() as { username?: string; displayName?: string; profilePhoto?: string | null; id?: string } | null;
  const [message, setMessage] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('Requesting location…');
  const [messages, setMessages] = useState<NearbyMessage[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [pendingPost, setPendingPost] = useState<PendingPost | null>(null);
  const [composeCaption, setComposeCaption] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'followers' | 'mentioned'>('public');
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  /** Who can reply: everyone | following | mentioned | verified | anonymous */
  const [whoCanReply, setWhoCanReply] = useState<'everyone' | 'following' | 'mentioned' | 'verified' | 'anonymous'>('everyone');
  const [showWhoCanReplySheet, setShowWhoCanReplySheet] = useState(false);
  /** Anonymous Mode: when true, post is sent with anonymous: true (toolbar icon + option in Who can reply). */
  const [anonymousMode, setAnonymousMode] = useState(false);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [commentsSheetKey, setCommentsSheetKey] = useState<string | null>(null);
  const nearbyCommentFooterRef = useRef<HTMLDivElement>(null);
  const [likedKeys, setLikedKeys] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const composeFileInputRef = useRef<HTMLInputElement>(null);
  const lastLocationPost = useRef<number>(0);
  const lastSentRef = useRef<{ text: string; imageUrl?: string; at: number }>({ text: '', at: 0 });
  const pendingOptimisticSentAt = useRef<string | null>(null);
  const [usage, setUsage] = useState<NearbyUsageApi | null>({
    textFreeLimit: 10,
    mediaFreeLimit: 1,
    textRemaining: 10,
    mediaRemaining: 1,
  });
  const [nearbyError, setNearbyError] = useState<string | null>(null);
  const sendLockUntilRef = useRef<number>(0);
  const myAccountId =
    typeof accountIdFromStore === 'string'
      ? accountIdFromStore
      : typeof currentAccount?.id === 'string'
        ? currentAccount.id
        : null;

  useEffect(() => {
    if (!getToken()) return;
    fetchApi('location/nearby-post/usage')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setUsage(data);
      })
      .catch(() => {});
  }, [accountIdFromStore]);

  useEffect(() => {
    let cancelled = false;
    let socketRef: ReturnType<typeof getSocket> = null;

    const joinNearby = () => {
      const s = getSocket();
      if (s?.connected) s.emit('nearby:join');
    };

    const attach = (socket: NonNullable<ReturnType<typeof getSocket>>) => {
      socketRef = socket;
      joinNearby();
      socket.on('connect', joinNearby);

      const onUsage = (u: NearbyUsageApi) => {
        setUsage((prev) => ({ ...prev, ...u }));
        pendingOptimisticSentAt.current = null;
      };
      const onNearbyError = (e: { message?: string }) => {
        if (pendingOptimisticSentAt.current) {
          const at = pendingOptimisticSentAt.current;
          pendingOptimisticSentAt.current = null;
          setMessages((prev) => prev.filter((m) => m.sentAt !== at));
        }
        setNearbyError(e?.message || 'Could not send to Nearby.');
      };

      socket.on('nearby:usage', onUsage);
      socket.on('nearby:message:error', onNearbyError);

      socket.on('nearby:message', (payload: any) => {
        const text = (payload?.text ?? '').toString();
        const imageUrl = payload?.imageUrl ?? null;
        if (!text && !imageUrl) return;
        const posterAccountId = payload?.from?.accountId as string | undefined;
        const myAccountId =
          typeof accountIdFromStore === 'string'
            ? accountIdFromStore
            : typeof currentAccount?.id === 'string'
              ? currentAccount.id
              : undefined;
        if (
          posterAccountId &&
          myAccountId &&
          posterAccountId !== myAccountId &&
          getToken()
        ) {
          void fetchApi('analytics/record-event', {
            method: 'POST',
            body: JSON.stringify({
              targetAccountId: posterAccountId,
              eventType: 'nearby_message_impression',
              metadata: { source: 'nearby_feed' },
            }),
          }).catch(() => {});
        }
        const fromUserId = (payload?.from?.userId ?? null) as string | null;
        const fromAccountId = (payload?.from?.accountId ?? null) as string | null;
        const messageId = (payload?.messageId ?? null) as string | null;
        const sentAt = (payload?.sentAt as string) ?? new Date().toISOString();
        const fromUsername = (payload?.from?.username ?? null) as string | null;
        const fromDisplayName = (payload?.from?.displayName ?? null) as string | null;
        const last = lastSentRef.current;
        const isOwnEcho = last.text === text && last.imageUrl === imageUrl && Date.now() - last.at < 5000;
        setMessages((prev) => {
          const now = Date.now();
          let kept = prev.filter((m) => now - new Date(m.sentAt).getTime() < MESSAGE_RETENTION_MS);
          const isFromMe = !!myAccountId && !!fromAccountId && fromAccountId === myAccountId;
          if (isFromMe && pendingOptimisticSentAt.current) {
            const optimisticAt = new Date(pendingOptimisticSentAt.current).getTime();
            pendingOptimisticSentAt.current = null;
            kept = kept.filter((m) => {
              const mAt = new Date(m.sentAt).getTime();
              const sameContent = (m.text || '') === (text || '[Photo]') && (m.imageUrl || null) === (imageUrl || null);
              return !(sameContent && Math.abs(mAt - optimisticAt) < 10000);
            });
          }
          const incomingFp = nearbyFingerprint({
            messageId,
            fromUserId,
            fromAccountId,
            fromUsername: fromUsername ?? undefined,
            text: text || '[Photo]',
            imageUrl: imageUrl || null,
            sentAt,
          });
          const dupIdx = kept.findIndex((m) => nearbyFingerprint(m) === incomingFp);
          if (dupIdx >= 0) {
            const next = [...kept];
            next[dupIdx] = {
              ...next[dupIdx],
              fromUserId: fromUserId ?? next[dupIdx].fromUserId,
              fromAccountId: fromAccountId ?? next[dupIdx].fromAccountId,
              fromUsername: fromUsername ?? next[dupIdx].fromUsername,
              fromDisplayName: fromDisplayName ?? next[dupIdx].fromDisplayName,
              messageId: messageId ?? next[dupIdx].messageId,
            };
            return next.slice(0, 200);
          }
          if (isOwnEcho) {
            const idx = kept.findIndex((m) => m.text === (text || '[Photo]') && (m.imageUrl || null) === (imageUrl || null) && Math.abs(new Date(m.sentAt).getTime() - new Date(sentAt).getTime()) < 2000);
            if (idx >= 0) {
              const next = [...kept];
              next[idx] = { ...next[idx], fromUsername: fromUsername ?? undefined, fromDisplayName: fromDisplayName ?? undefined, fromUserId, fromAccountId, messageId: messageId ?? next[idx].messageId };
              return next.slice(0, 200);
            }
            return kept.slice(0, 200);
          }
          const newMsg: NearbyMessage = {
            text: text || '[Photo]',
            messageId: messageId ?? undefined,
            fromUserId,
            fromAccountId,
            fromUsername: fromUsername ?? undefined,
            fromDisplayName: fromDisplayName ?? undefined,
            sentAt,
            imageUrl: imageUrl || null,
            replyCount: 0,
            likeCount: 0,
          };
          return [newMsg, ...kept].slice(0, 200);
        });
      });

      return () => {
        socket.off('connect', joinNearby);
        socket.emit('nearby:leave');
        socket.off('nearby:message');
        socket.off('nearby:usage', onUsage);
        socket.off('nearby:message:error', onNearbyError);
      };
    };

    let cleanup: (() => void) | undefined;
    let attempts = 0;
    const maxAttempts = 40;
    const tryAttach = () => {
      if (cancelled) return;
      const socket = getSocket();
      if (socket) {
        cleanup = attach(socket);
        return;
      }
      if (++attempts < maxAttempts) window.setTimeout(tryAttach, 150);
    };
    tryAttach();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [accountIdFromStore, currentAccount?.id]);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Location not supported.');
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLocationStatus('Live · sharing location');
        const s = getSocket();
        if (s?.connected) s.emit('nearby:location', { latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        const token = getToken();
        if (token && Date.now() - lastLocationPost.current > 30000) {
          lastLocationPost.current = Date.now();
          void fetchApi('location', {
            method: 'POST',
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          }).catch(() => {});
        }
      },
      () => setLocationStatus('Location error. Check permissions.'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessages((prev) => {
        const cutoff = Date.now() - MESSAGE_RETENTION_MS;
        const next = prev.filter((m) => new Date(m.sentAt).getTime() > cutoff);
        return next.length === prev.length ? prev : next;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = () => {
    if (Date.now() < sendLockUntilRef.current) return;
    const text = message.trim();
    if (!text) return;
    const socket = getSocket();
    if (!socket) return;
    sendLockUntilRef.current = Date.now() + 700;
    setNearbyError(null);
    const sentAt = new Date().toISOString();
    pendingOptimisticSentAt.current = sentAt;
    lastSentRef.current = { text, at: Date.now() };
    const fromDisplayName = anonymousMode ? 'Anonymous' : (currentAccount?.displayName ?? 'You');
    const fromUsername = anonymousMode ? 'anonymous' : (currentAccount?.username ?? 'you');
    setMessages((prev) => {
      const now = Date.now();
      const kept = prev.filter((m) => now - new Date(m.sentAt).getTime() < MESSAGE_RETENTION_MS);
      const optimistic: NearbyMessage = {
        text,
        fromUserId: null,
        fromAccountId: myAccountId,
        fromDisplayName,
        fromUsername,
        sentAt,
        replyCount: 0,
        likeCount: 0,
      };
      const fp = nearbyFingerprint(optimistic);
      if (kept.some((m) => nearbyFingerprint(m) === fp)) return kept.slice(0, 200);
      return [optimistic, ...kept].slice(0, 200);
    });
    setMessage('');
    socket.emit('nearby:message', { text, anonymous: anonymousMode });
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setPendingPost({ file, previewUrl: URL.createObjectURL(file) });
    setComposeCaption(message.trim());
    setMessage('');
    setShowCompose(true);
  };

  const handleCancelCompose = () => {
    if (pendingPost?.previewUrl) URL.revokeObjectURL(pendingPost.previewUrl);
    setPendingPost(null);
    setComposeCaption('');
    setShowCompose(false);
  };

  const handleShareFromCompose = async () => {
    if (pendingPost) {
      if (Date.now() < sendLockUntilRef.current) return;
      const token = getToken();
      const socket = getSocket();
      if (!token || !socket) return;
      sendLockUntilRef.current = Date.now() + 900;
      setUploadingPhoto(true);
      try {
        const form = new FormData();
        form.append('file', pendingPost.file);
        const res = await fetch(getUploadUrl(), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
        const imageUrl = data.url as string;
        const caption = composeCaption.trim() || '[Photo]';
        lastSentRef.current = { text: caption, imageUrl, at: Date.now() };
        const sentAt = new Date().toISOString();
        pendingOptimisticSentAt.current = sentAt;
        setNearbyError(null);
        const fromDisplayName = anonymousMode ? 'Anonymous' : (currentAccount?.displayName ?? 'You');
        const fromUsername = anonymousMode ? 'anonymous' : (currentAccount?.username ?? 'you');
        setMessages((prev) => {
          const now = Date.now();
          const kept = prev.filter((m) => now - new Date(m.sentAt).getTime() < MESSAGE_RETENTION_MS);
          const optimistic: NearbyMessage = {
            text: caption,
            fromUserId: null,
            fromAccountId: myAccountId,
            fromDisplayName,
            fromUsername,
            sentAt,
            imageUrl,
            replyCount: 0,
            likeCount: 0,
          };
          const fp = nearbyFingerprint(optimistic);
          if (kept.some((m) => nearbyFingerprint(m) === fp)) return kept.slice(0, 200);
          return [optimistic, ...kept].slice(0, 200);
        });
        socket.emit('nearby:message', { text: caption, imageUrl, anonymous: anonymousMode });
        handleCancelCompose();
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      handleSend();
      setShowCompose(false);
    }
  };

  const isOwnMessage = (m: NearbyMessage) =>
    (!!m.fromAccountId && m.fromAccountId === myAccountId) ||
    (currentAccount != null && m.fromUsername === currentAccount.username && m.fromUsername !== 'anonymous');

  const displayNameFor = (m: NearbyMessage) =>
    m.fromUsername === 'anonymous' || m.fromDisplayName === 'Anonymous' ? 'Anonymous' : isOwnMessage(m) ? 'You' : (m.fromDisplayName || m.fromUsername || 'Anonymous');
  const handleFor = (m: NearbyMessage) =>
    m.fromUsername === 'anonymous' ? 'anonymous' : isOwnMessage(m) ? (currentAccount?.username ?? 'you') : (m.fromUsername || 'anonymous');

  const messageKey = (m: NearbyMessage, idx: number) =>
    m.messageId || `${m.sentAt}-${idx}-${(m.text + (m.imageUrl || '')).slice(0, 40)}`;
  const visibleMessages = useMemo(() => {
    const fresh = messages.filter((m) => Date.now() - new Date(m.sentAt).getTime() < MESSAGE_RETENTION_MS);
    const seen = new Set<string>();
    const out: NearbyMessage[] = [];
    for (const m of fresh) {
      const key = `${(m.fromAccountId || m.fromUserId || m.fromUsername || 'unknown').toLowerCase()}|${(m.text || '').trim().toLowerCase()}|${(m.imageUrl || '').trim()}|${toSecondBucket(m.sentAt)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    return out;
  }, [messages]);

  if (showCompose) {
    return (
      <ThemedView className="min-h-screen flex flex-col bg-black">
        <MobileShell>
          <MoxePageHeader
            title="Nearby"
            left={
              <button type="button" onClick={handleCancelCompose} className="text-white text-[15px] font-medium">
                Cancel
              </button>
            }
            right={
              <button
                type="button"
                onClick={() => {
                  if (pendingPost) handleShareFromCompose();
                  else if (message.trim()) { handleSend(); setShowCompose(false); }
                }}
                disabled={uploadingPhoto || (!pendingPost && !message.trim())}
                className="rounded-full bg-[#1d9bf0] px-5 py-2 text-white font-bold text-[15px] disabled:opacity-50"
              >
                {uploadingPhoto ? 'Posting…' : 'Post'}
              </button>
            }
          />
          <input
            ref={composeFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoSelect}
          />
          <div className="flex-1 overflow-auto px-4 pt-4 pb-32">
            {/* What's on your mind? card - mobile template */}
            <div className="rounded-xl bg-[#262626] border border-[#363636] p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="w-5 h-5 text-[#a855f7]" />
                <h2 className="text-white font-bold text-base">What&apos;s on your mind?</h2>
              </div>
              <p className="text-[#71767b] text-sm mb-4">Share with people in your immediate area</p>

              <p className="text-[#71767b] text-xs mb-2">Post Visibility:</p>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowVisibilityDropdown(true); }}
                onPointerDown={(e) => { e.stopPropagation(); setShowVisibilityDropdown(true); }}
                className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-lg bg-[#16181c] border border-[#2f2f2f] text-white text-sm min-h-[44px]"
                aria-expanded={showVisibilityDropdown}
                aria-haspopup="dialog"
              >
                <span className="flex items-center gap-2">
                  {postVisibility === 'public' && <Globe className="w-4 h-4 text-[#1d9bf0]" />}
                  {postVisibility === 'followers' && <Lock className="w-4 h-4 text-[#71767b]" />}
                  {postVisibility === 'mentioned' && <AtSign className="w-4 h-4 text-[#71767b]" />}
                  {postVisibility === 'public' ? 'Public' : postVisibility === 'followers' ? 'Followers' : 'People you mention'}
                </span>
                <ChevronDown className="w-4 h-4 text-[#71767b]" />
              </button>

              <label className="block mt-4 mb-2 text-[#71767b] text-xs">Your message</label>
              <textarea
                value={pendingPost ? composeCaption : message}
                onChange={(e) => (pendingPost ? setComposeCaption(e.target.value) : setMessage(e.target.value))}
                placeholder="What's on your mind? Share with nearby users..."
                className="w-full min-h-[120px] px-4 py-3 rounded-lg bg-[#16181c] border border-[#2f2f2f] text-white text-[15px] placeholder:text-[#71767b] resize-none outline-none focus:border-[#1d9bf0]"
                rows={4}
                disabled={false}
                autoComplete="off"
              />
            </div>

            <div className="flex gap-3 mb-4">
              <Avatar uri={currentAccount?.profilePhoto ?? null} size={48} />
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowWhoCanReplySheet(true)}
                  className="flex items-center gap-1.5 mt-2 text-[#1d9bf0] text-[13px]"
                >
                  <Globe className="w-4 h-4" />
                  {whoCanReply === 'everyone' && 'Everyone can reply'}
                  {whoCanReply === 'following' && 'Accounts you follow can reply'}
                  {whoCanReply === 'mentioned' && 'Only accounts you mention can reply'}
                  {whoCanReply === 'verified' && 'Verified accounts can reply'}
                  {whoCanReply === 'anonymous' && 'Posting anonymously'}
                </button>
              </div>
            </div>

            {/* Who can reply? bottom sheet */}
            {showWhoCanReplySheet && (
              <>
                <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowWhoCanReplySheet(false)} aria-hidden />
                <div className="fixed left-0 right-0 bottom-0 z-50 rounded-t-2xl bg-[#16181c] border border-[#2f2f2f] border-b-0 max-h-[70vh] overflow-hidden safe-area-pb">
                  <div className="p-4 border-b border-[#2f2f2f]">
                    <h3 className="text-white font-bold text-lg">Who can reply?</h3>
                    <p className="text-[#71767b] text-sm mt-1">Pick who can reply to this post. Anyone mentioned can always reply.</p>
                  </div>
                  <div className="divide-y divide-[#2f2f2f]">
                    {[
                      { value: 'everyone' as const, label: 'Everyone', Icon: Globe },
                      { value: 'following' as const, label: 'Accounts you follow', Icon: Users },
                      { value: 'mentioned' as const, label: 'Only accounts you mention', Icon: AtSign },
                      { value: 'verified' as const, label: 'Verified accounts', Icon: BadgeCheck },
                      { value: 'anonymous' as const, label: 'Anonymous', Icon: CircleSlash, desc: 'Post without showing your username' },
                    ].map(({ value, label, Icon, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => {
                          setWhoCanReply(value);
                          if (value === 'anonymous') setAnonymousMode(true);
                          else setAnonymousMode(false);
                          setShowWhoCanReplySheet(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2f2f2f]"
                      >
                        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2f2f2f] text-[#1d9bf0]">
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-white font-medium">{label}</span>
                          {desc && <p className="text-[#71767b] text-xs mt-0.5">{desc}</p>}
                        </div>
                        {whoCanReply === value && (
                          <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

                {/* Post Visibility bottom sheet */}
                {showVisibilityDropdown && (
                  <>
                    <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setShowVisibilityDropdown(false)} aria-hidden />
                    <div className="fixed left-0 right-0 bottom-0 z-[101] rounded-t-2xl bg-[#16181c] border border-[#2f2f2f] border-b-0 max-h-[50vh] overflow-hidden safe-area-pb">
                      <div className="p-4 border-b border-[#2f2f2f]">
                        <h3 className="text-white font-bold text-lg">Post Visibility</h3>
                        <p className="text-[#71767b] text-sm mt-1">Choose who can see this post.</p>
                      </div>
                      <div className="divide-y divide-[#2f2f2f]">
                        {[
                          { value: 'public' as const, label: 'Public', Icon: Globe },
                          { value: 'followers' as const, label: 'Followers', Icon: Lock },
                          { value: 'mentioned' as const, label: 'Only people you mention', Icon: AtSign },
                        ].map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setPostVisibility(value);
                              setShowVisibilityDropdown(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#2f2f2f]"
                          >
                            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#2f2f2f] text-[#1d9bf0]">
                              <Icon className="w-5 h-5" />
                            </span>
                            <span className="text-white font-medium flex-1">{label}</span>
                            {postVisibility === value && (
                              <span className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                {/* Toolbar: Media, Camera, Anonymous, Live, GIF, Poll, Location, Add */}
                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-[#2f2f2f] overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => composeFileInputRef.current?.click()}
                    className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 flex-shrink-0"
                    title="Media"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 flex-shrink-0"
                    title="Camera"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !anonymousMode;
                      setAnonymousMode(next);
                      setWhoCanReply(next ? 'anonymous' : 'everyone');
                    }}
                    className={`p-2 rounded-full flex-shrink-0 ${anonymousMode ? 'text-[#1d9bf0] bg-[#1d9bf0]/20' : 'text-[#71767b] hover:bg-white/10'}`}
                    title={anonymousMode ? 'Anonymous on' : 'Post anonymously'}
                  >
                    <CircleSlash className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 flex-shrink-0 opacity-70" title="Live">
                    <Play className="w-5 h-5" />
                  </button>
                  <span className="px-2 py-1.5 rounded text-[10px] font-medium text-[#71767b] border border-[#2f2f2f] flex-shrink-0">GIF</span>
                  <button type="button" className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 flex-shrink-0" title="Poll">
                    <List className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 flex-shrink-0" title="Location">
                    <MapPin className="w-5 h-5" />
                  </button>
                  <button type="button" className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 flex-shrink-0" title="Add">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
        </MobileShell>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <MoxePageHeader
          title="Nearby"
          backTo="/map"
          right={
            <Link to="/map/nearby-messaging/settings" className="text-[#1d9bf0] text-[15px] font-medium">
              Settings
            </Link>
          }
        />

        <div className="flex items-center justify-between px-4 py-2 text-[13px] text-[#71767b] border-b border-[#2f2f2f]">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{locationStatus}</span>
          </div>
          <div className="flex flex-col items-end text-right gap-0.5 flex-shrink-0 pl-2">
            <span>
              Messages: <span className="text-white font-medium">{usage?.textRemaining ?? '—'}</span>/{usage?.textFreeLimit ?? 10} left
            </span>
            <span className="text-[11px] text-[#8b98a5]">
              Photos: <span className="text-white font-medium">{usage?.mediaRemaining ?? '—'}</span>/{usage?.mediaFreeLimit ?? 1} left
            </span>
          </div>
        </div>
        {nearbyError && (
          <div className="px-4 py-2 bg-[#3d1818] border-b border-[#5c2828] text-[13px] text-[#ffb4b4]">
            {nearbyError}
          </div>
        )}

        <div className="flex-1 overflow-auto pb-24">
          {visibleMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <MessageCircle className="w-14 h-14 text-[#71767b] mb-4 opacity-60" />
              <p className="text-white font-bold text-xl mb-1">No nearby posts yet</p>
              <p className="text-[#71767b] text-[15px] text-center">
                Post what's happening to chat with people near you.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#2f2f2f]">
              {visibleMessages.map((m, idx) => {
                const key = messageKey(m, idx);
                const isLiked = likedKeys.has(key);
                const menuOpen = openMenuKey === key;
                return (
                  <article key={key} className="px-4 py-3">
                    <div className="flex gap-3">
                      <Avatar
                        uri={m.fromUsername === 'anonymous' ? undefined : (isOwnMessage(m) ? (currentAccount?.profilePhoto ?? null) : undefined)}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1 min-w-0">
                            <span className="font-bold text-white text-[15px] truncate">
                              {displayNameFor(m)}
                            </span>
                            <span className="text-[#71767b] text-[15px] truncate">
                              @{handleFor(m)}
                            </span>
                            <span className="text-[#71767b] text-[15px]">· {formatTimeAgo(m.sentAt)}</span>
                          </div>
                          <div className="relative flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setOpenMenuKey(menuOpen ? null : key)}
                              className="p-1 -m-1 text-[#71767b] hover:text-white rounded-full"
                              aria-label="More options"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                            {menuOpen && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setOpenMenuKey(null)} aria-hidden />
                                <div className="absolute right-0 top-full mt-1 py-1 rounded-xl bg-[#16181c] border border-[#2f2f2f] shadow-xl z-20 min-w-[160px]">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard?.writeText(m.text || '');
                                        toast.success('Text copied.');
                                      } catch {
                                        toast.error('Could not copy text.');
                                      }
                                      setOpenMenuKey(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-white text-sm hover:bg-[#2f2f2f]"
                                  >
                                    Copy text
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      toast.success('Report submitted.');
                                      setOpenMenuKey(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-white text-sm hover:bg-[#2f2f2f]"
                                  >
                                    Report
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        {m.text && m.text !== '[Photo]' && (
                          <p className="text-white text-[15px] mt-0.5 whitespace-pre-wrap break-words">{m.text}</p>
                        )}
                        {m.imageUrl && (
                          <div className="mt-2 rounded-2xl overflow-hidden border border-[#2f2f2f]">
                            <div className="relative w-full aspect-[4/3] max-h-80 bg-[#16181c]">
                              <img
                                src={ensureAbsoluteMediaUrl(m.imageUrl) ?? m.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  const ph = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
                                  if (ph) ph.classList.remove('hidden');
                                }}
                              />
                              <div className="nearby-img-placeholder hidden absolute inset-0 flex items-center justify-center bg-[#2f2f2f] text-[#71767b] text-2xl">
                                ?
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2 max-w-[320px] text-[#71767b]">
                          <button
                            type="button"
                            className="flex items-center gap-1.5 p-1 -m-1 hover:text-[#1d9bf0]"
                            onClick={() => {
                              setOpenMenuKey(null);
                              setCommentsSheetKey(key);
                            }}
                            aria-label="Comment"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-[13px]">{m.replyCount ?? 0}</span>
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 p-1 -m-1 hover:text-[#1d9bf0]"
                            aria-label="Repost"
                            onClick={() => toast.success('Reposted')}
                          >
                            <Repeat2 className="w-4 h-4" />
                            <span className="text-[13px]">0</span>
                          </button>
                          <button
                            type="button"
                            className={`flex items-center gap-1.5 p-1 -m-1 ${isLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'}`}
                            onClick={() => setLikedKeys((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; })}
                            aria-label={isLiked ? 'Unlike' : 'Like'}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                            <span className="text-[13px]">{(m.likeCount ?? 0) + (isLiked ? 1 : 0)}</span>
                          </button>
                          <button
                            type="button"
                            className="p-1 -m-1 hover:text-[#1d9bf0]"
                            aria-label="Analytics"
                            onClick={() => navigate('/map/nearby-messaging/analytics')}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 -m-1 hover:text-[#1d9bf0]"
                            aria-label="Bookmark"
                            onClick={() => toast.success('Bookmarked')}
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-1 -m-1 hover:text-[#1d9bf0]"
                            onClick={async () => {
                              const text = [m.text, m.imageUrl ? '[Photo]' : ''].filter(Boolean).join(' ');
                              if (navigator.share) {
                                try { await navigator.share({ title: 'MOxE Nearby', text: text || 'Post from nearby' }); } catch (_) {}
                              } else {
                                try { await navigator.clipboard.writeText(text || 'Post from nearby'); window.alert('Copied'); } catch (_) {}
                              }
                            }}
                            aria-label="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelect}
        />

        <div className="fixed bottom-[5.5rem] left-1/2 -translate-x-1/2 w-full max-w-[428px] px-4 flex justify-end pointer-events-none z-20 md:bottom-20">
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="pointer-events-auto w-14 h-14 rounded-full bg-[#1d9bf0] flex items-center justify-center text-white shadow-lg hover:bg-[#1a8cd8] active:scale-95"
            aria-label="New post"
          >
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </button>
        </div>

        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 w-full max-w-[428px] z-10 px-4 py-3 border-t border-[#2f2f2f] bg-black/95 backdrop-blur md:bottom-0 md:safe-area-pb">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="p-2 rounded-full text-[#1d9bf0] hover:bg-white/10 disabled:opacity-50"
              aria-label="Gallery"
            >
              <Image className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (message.trim()) { handleSend(); } } }}
              placeholder="What's happening?"
              className="flex-1 px-4 py-2.5 rounded-full bg-[#16181c] border border-[#2f2f2f] text-white placeholder:text-[#71767b] text-[15px] outline-none focus:border-[#1d9bf0]"
            />
            <button
              type="button"
              onClick={() => { if (message.trim()) handleSend(); }}
              disabled={!message.trim()}
              className="p-2 rounded-full text-[#1d9bf0] disabled:opacity-40"
              aria-label="Send"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </MobileShell>

      {commentsSheetKey && (
        <SocialCommentsSheet
          open={!!commentsSheetKey}
          onClose={() => setCommentsSheetKey(null)}
          totalCount={(() => {
            const idx = visibleMessages.findIndex((m, i) => messageKey(m, i) === commentsSheetKey);
            return idx >= 0 ? visibleMessages[idx]?.replyCount ?? 0 : 0;
          })()}
          footer={
            <div
              ref={nearbyCommentFooterRef}
              className="border-t border-[#2f2f2f] bg-[#0f0f10] px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] text-center text-[13px] text-[#8b98a5]"
            >
              Replies use the same layout as feed comments.
            </div>
          }
        >
          <SocialCommentsEmpty />
        </SocialCommentsSheet>
      )}
    </ThemedView>
  );
}
