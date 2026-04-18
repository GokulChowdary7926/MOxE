import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Avatar } from '../../components/ui/Avatar';
import { UI } from '../../constants/uiTheme';
import { getApiBase, getToken } from '../../services/api';
import { readApiError } from '../../utils/readApiError';
import { ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { getSocket } from '../../services/socket';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import toast from 'react-hot-toast';

type NotificationItem = {
  id: string;
  type: string;
  actorId: string;
  actorUsername?: string;
  actorAvatar?: string | null;
  message: string;
  createdAt: string;
  targetPostId?: string;
  postThumbUrl?: string | null;
  blockedMessageId?: string;
  blockedSenderId?: string;
  read?: boolean;
};

function relativeTime(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffM < 60) return `${diffM}m`;
  if (diffH < 24) return `${diffH}h`;
  return `${diffD}d`;
}

function sectionLabel(date: string): 'Today' | 'Yesterday' | 'Last 7 days' | null {
  const d = new Date(date);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  if (d >= startOfToday) return 'Today';
  if (d >= startOfYesterday) return 'Yesterday';
  if (d >= startOfWeek) return 'Last 7 days';
  return null;
}

type FollowRequestRow = {
  id: string;
  username: string;
  displayName: string;
  profilePhoto: string | null;
};

export default function Notifications() {
  const currentAccount = useCurrentAccount() as any;
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followRequestCount, setFollowRequestCount] = useState(0);
  const [followPreview, setFollowPreview] = useState<FollowRequestRow[]>([]);

  const mapNotification = React.useCallback((n: Record<string, unknown>): NotificationItem => {
    const sender = n.sender as Record<string, unknown> | null | undefined;
    const data = (typeof n.data === 'object' && n.data !== null ? n.data : {}) as Record<string, unknown>;
    const actorUsername =
      (sender?.username as string | undefined) ||
      (n.actor as Record<string, unknown> | undefined)?.username as string | undefined ||
      (n.account as Record<string, unknown> | undefined)?.username as string | undefined;
    const actorAvatar =
      (sender?.profilePhoto as string | null | undefined) ??
      (sender?.avatarUrl as string | null | undefined) ??
      (n.actor as Record<string, unknown> | undefined)?.profilePhoto as string | null | undefined;
    const targetPostId =
      (data.postId as string | undefined) ||
      (data.targetPostId as string | undefined) ||
      (n.targetPostId as string | undefined) ||
      (n.postId as string | undefined);
    const postThumbUrl =
      (data.postThumbUrl as string | undefined) ||
      (data.thumbnailUrl as string | undefined) ||
      (n.postThumbUrl as string | undefined) ||
      (n.mediaUrl as string | undefined);
    return {
      id: String(n.id),
      type: String(n.type || ''),
      actorId: String((sender?.id as string | undefined) ?? n.actorId ?? n.accountId ?? ''),
      actorUsername,
      actorAvatar: actorAvatar ? ensureAbsoluteMediaUrl(actorAvatar) : null,
      message: String(n.message ?? n.text ?? n.content ?? ''),
      createdAt: String(n.createdAt ?? n.timestamp ?? new Date().toISOString()),
      targetPostId,
      postThumbUrl: postThumbUrl ? ensureAbsoluteMediaUrl(postThumbUrl) : null,
      blockedMessageId: (data.messageId as string | undefined) ?? undefined,
      blockedSenderId: (data.senderId as string | undefined) ?? undefined,
      read: Boolean(n.read),
    };
  }, []);

  const loadNotifications = React.useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      const token = getToken();
      if (!token) {
        setItems([]);
        setNextCursor(null);
        setLoading(false);
        return;
      }
      const append = opts?.append ?? false;
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setError(null);
      }
      try {
        const cursor = append ? opts?.cursor : undefined;
        const qs = new URLSearchParams();
        qs.set('tab', 'all');
        qs.set('limit', '30');
        if (cursor) qs.set('cursor', cursor);
        const [notifRes, reqRes] = await Promise.all([
          fetch(`${getApiBase()}/notifications?${qs.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          append
            ? Promise.resolve(null as Response | null)
            : fetch(`${getApiBase()}/follow/requests`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
        ]);

        if (!notifRes.ok) {
          const msg = await readApiError(notifRes).catch(() => 'Failed to load notifications.');
          setError(msg);
          if (!append) setItems([]);
          setNextCursor(null);
          return;
        }
        const data = (await notifRes.json()) as { items?: unknown[]; nextCursor?: string | null };
        const list = data.items ?? [];
        const mapped: NotificationItem[] = Array.isArray(list) ? list.map((n) => mapNotification(n as Record<string, unknown>)) : [];
        setItems((prev) => (append ? [...prev, ...mapped] : mapped));
        setNextCursor(data.nextCursor ?? null);

        if (reqRes) {
          if (reqRes.ok) {
            const raw = await reqRes.json().catch(() => []);
            const rows = Array.isArray(raw) ? (raw as FollowRequestRow[]) : [];
            setFollowRequestCount(rows.length);
            setFollowPreview(rows.slice(0, 3));
          } else {
            setFollowRequestCount(0);
            setFollowPreview([]);
          }
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load notifications.');
        if (!append) setItems([]);
        setNextCursor(null);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [mapNotification],
  );

  const markOneRead = async (id: string) => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/notifications/${encodeURIComponent(id)}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems((prev) => prev.map((x) => (x.id === id ? { ...x, read: true } : x)));
      else toast.error(await readApiError(res).catch(() => 'Could not mark read'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not mark read');
    }
  };

  const markAllRead = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${getApiBase()}/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setItems((prev) => prev.map((x) => ({ ...x, read: true })));
      else toast.error(await readApiError(res).catch(() => 'Could not mark all read'));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not mark all read');
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNotification = () => {
      loadNotifications();
    };
    socket.on('notification', onNotification);
    return () => {
      socket.off('notification', onNotification);
    };
  }, [loadNotifications]);

  const handlePremiumBlockedAction = async (n: NotificationItem, action: 'viewed' | 'reblocked' | 'reported') => {
    if (!n.blockedMessageId || !n.blockedSenderId) return;
    const token = getToken();
    if (!token) return;

    if (action === 'reported') {
      const reason = window.prompt('Why are you reporting this message?')?.trim();
      if (!reason) return;
      const details = window.prompt('Optional details (helps us review)')?.trim() || reason;
      const res = await fetch(`${getApiBase()}/premium/blocked-messages/${encodeURIComponent(n.blockedMessageId)}/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, details }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.reason || 'Failed to report.');
    } else {
      const res = await fetch(`${getApiBase()}/premium/blocked-messages/${encodeURIComponent(n.blockedMessageId)}/action`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || data?.reason || 'Failed to perform action.');
    }

    if (action === 'viewed') {
      // View should open normal chat: remove the privacy block for this peer.
      await fetch(`${getApiBase()}/privacy/block/${encodeURIComponent(n.blockedSenderId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
      navigate(`/messages/${encodeURIComponent(n.blockedSenderId)}`);
    } else {
      await loadNotifications();
    }
  };

  const grouped = React.useMemo(() => {
    const groups: { label: 'Today' | 'Yesterday' | 'Last 7 days'; items: NotificationItem[] }[] = [];
    const bySection: Record<string, NotificationItem[]> = { Today: [], Yesterday: [], 'Last 7 days': [] };
    items.forEach((n) => {
      const section = sectionLabel(n.createdAt);
      if (section && bySection[section]) bySection[section].push(n);
    });
    (['Today', 'Yesterday', 'Last 7 days'] as const).forEach((label) => {
      if (bySection[label].length > 0) {
        groups.push({ label, items: bySection[label] });
      }
    });
    return groups;
  }, [items]);

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        <MoxePageHeader
          title="Notifications"
          backTo="/"
          right={
            <button
              type="button"
              className="text-[12px] font-semibold text-moxe-primary px-2 py-1 disabled:opacity-40"
              aria-label="Mark all notifications read"
              disabled={loading || items.length === 0}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </button>
          }
        />

        <div className="flex-1 overflow-auto pb-20">
        {followRequestCount > 0 && (
          <Link
            to="/follow/requests"
            className={`${UI.listRow} flex items-center gap-3 border-b border-[#262626]`}
          >
            <div className="flex -space-x-2">
              {followPreview.slice(0, 3).map((r) => (
                <div key={r.id} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-[#262626]">
                  {r.profilePhoto ? (
                    <img src={ensureAbsoluteMediaUrl(r.profilePhoto)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#363636] flex items-center justify-center text-[10px] text-white">
                      {r.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              {followPreview.length === 0 &&
                [1, 2, 3].map((i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-[#262626]">
                    <div className="w-full h-full bg-[#363636]" />
                  </div>
                ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">Follow requests</p>
              <p className="text-[#a8a8a8] text-sm">
                {followRequestCount <= 0
                  ? 'Pending requests'
                  : followRequestCount === 1
                    ? `${followPreview[0]?.username ?? 'Someone'} wants to follow you`
                    : `${followPreview[0]?.username ?? 'Someone'} + ${followRequestCount - 1} others`}
              </p>
            </div>
            <span className="text-[#0095f6] flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full bg-[#0095f6]" />
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        )}

          {loading && (
            <ThemedText secondary className="text-[#737373] px-4 py-3">
              Loading…
            </ThemedText>
          )}
          {error && !loading && (
            <div className="px-4 py-2">
              <ErrorState message={error} onRetry={() => window.location.reload()} />
            </div>
          )}
          {!loading && items.length === 0 && !error && (
            <EmptyState
              icon={
                <div className="w-16 h-16 rounded-full bg-[#262626] border border-[#363636] flex items-center justify-center">
                  <Bell className="w-8 h-8 text-[#737373]" />
                </div>
              }
              title="No notifications yet"
              message="When you get likes, comments, or new followers, you'll see them here."
            />
          )}
          {!loading && items.length > 0 && (
            <ul className="divide-y divide-[#262626]">
              {grouped.map(({ label, items: sectionItems }) => (
                <li key={label}>
                  <h2 className={UI.sectionTitle}>{label}</h2>
                  {sectionItems.map((n) => (
                    n.type === 'PREMIUM_BLOCKED_MESSAGE' && n.blockedMessageId && n.blockedSenderId ? (
                      <div key={n.id} className={UI.listRow}>
                        <div className={`${UI.listAvatar} relative`}>
                          <Avatar uri={n.actorAvatar} size={44} className="w-full h-full" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                            <ChevronRight className="w-3 h-3 text-[#0095f6]" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <ThemedText className="text-white text-sm">
                            {n.message}{' '}
                            <span className="text-[#737373] font-normal">{relativeTime(n.createdAt)}</span>
                          </ThemedText>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              className="px-2 py-1 text-[11px] rounded-moxe-md border border-moxe-border text-moxe-textSecondary"
                              onClick={() => {
                                void handlePremiumBlockedAction(n, 'viewed').catch((e) => {
                                  // eslint-disable-next-line no-alert
                                  alert(e?.message || 'Failed to view.');
                                });
                              }}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 text-[11px] rounded-moxe-md border border-moxe-border text-moxe-textSecondary"
                              onClick={() => {
                                void handlePremiumBlockedAction(n, 'reblocked').catch((e) => {
                                  // eslint-disable-next-line no-alert
                                  alert(e?.message || 'Failed to re-block.');
                                });
                              }}
                            >
                              Re-block
                            </button>
                            <button
                              type="button"
                              className="px-2 py-1 text-[11px] rounded-moxe-md border border-moxe-danger/40 text-moxe-danger"
                              onClick={() => {
                                void handlePremiumBlockedAction(n, 'reported').catch((e) => {
                                  // eslint-disable-next-line no-alert
                                  alert(e?.message || 'Failed to report.');
                                });
                              }}
                            >
                              Report Abuse
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        key={n.id}
                        to={n.targetPostId ? `/post/${n.targetPostId}` : `/profile/${n.actorUsername ?? n.actorId}`}
                        className={`${UI.listRow} ${n.read ? '' : 'bg-[#0a0a0a]'}`}
                        onClick={() => void markOneRead(n.id)}
                      >
                        <div className={`${UI.listAvatar} relative`}>
                          <Avatar uri={n.actorAvatar} size={44} className="w-full h-full" />
                          {(n.type || '').toLowerCase() === 'like' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                            </span>
                          )}
                          {(n.type || '').toLowerCase() === 'comment' && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                              <MessageCircle className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <ThemedText className="text-white text-sm">
                            {n.message}{' '}
                            <span className="text-[#737373] font-normal">{relativeTime(n.createdAt)}</span>
                          </ThemedText>
                        </div>
                        {n.postThumbUrl ? (
                          <div className={UI.listThumb}>
                            <img src={ensureAbsoluteMediaUrl(n.postThumbUrl)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={UI.listThumb} />
                        )}
                      </Link>
                    )
                  ))}
                </li>
              ))}
            </ul>
          )}
          {!loading && items.length > 0 && nextCursor && (
            <div className="px-4 py-4 flex justify-center">
              <button
                type="button"
                className="text-sm font-semibold text-moxe-primary disabled:opacity-50"
                disabled={loadingMore}
                onClick={() => void loadNotifications({ append: true, cursor: nextCursor })}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
