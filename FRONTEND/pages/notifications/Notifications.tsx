import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, ChevronRight } from 'lucide-react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Avatar } from '../../components/ui/Avatar';
import { UI } from '../../constants/uiTheme';
import { getApiBase, getToken } from '../../services/api';
import { mockNotifications } from '../../mocks/notifications';
import { mockUsers } from '../../mocks/users';

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

export default function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followRequestCount] = useState(4); // mock: "ramnaidu365 + 3 others"

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (token) {
          const res = await fetch(`${getApiBase()}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && !cancelled) {
            const list = data.items ?? data.notifications ?? data ?? [];
            if (list.length > 0) {
              const mapped: NotificationItem[] = list.map((n: any) => ({
                id: n.id,
                type: n.type,
                actorId: n.actorId ?? n.accountId,
                actorUsername: n.actor?.username ?? n.account?.username,
                actorAvatar: n.actor?.profilePhoto ?? n.actor?.avatarUrl,
                message: n.message ?? n.text ?? '',
                createdAt: n.createdAt ?? n.timestamp,
                targetPostId: n.targetPostId ?? n.postId,
                postThumbUrl: n.postThumbUrl ?? n.mediaUrl,
              }));
              setItems(mapped);
              setLoading(false);
              return;
            }
          }
        }
        if (!cancelled) {
          const mapped: NotificationItem[] = mockNotifications.map((n) => {
            const actor = mockUsers.find((u) => u.id === n.actorId) ?? mockUsers[0];
            return {
              id: n.id,
              type: n.type,
              actorId: actor.id,
              actorUsername: actor.username,
              actorAvatar: actor.avatarUrl,
              message: n.message,
              createdAt: n.createdAt,
              targetPostId: n.targetPostId,
            };
          });
          setItems(mapped);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load notifications.');
          const mapped: NotificationItem[] = mockNotifications.map((n) => {
            const actor = mockUsers.find((u) => u.id === n.actorId) ?? mockUsers[0];
            return {
              id: n.id,
              type: n.type,
              actorId: actor.id,
              actorUsername: actor.username,
              actorAvatar: actor.avatarUrl,
              message: n.message,
              createdAt: n.createdAt,
              targetPostId: n.targetPostId,
            };
          });
          setItems(mapped);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    <PageLayout title="Notifications" backTo="/">
      <div className="py-0">
        {followRequestCount > 0 && (
          <Link
            to="/follow/requests"
            className={`${UI.listRow} flex items-center gap-3 border-b border-[#262626]`}
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden bg-[#262626]">
                  <div className="w-full h-full bg-[#363636]" />
                </div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">Follow requests</p>
              <p className="text-[#a8a8a8] text-sm">
                ramnaidu365 + {followRequestCount - 1} others
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
                  <Link
                    key={n.id}
                    to={n.targetPostId ? `/post/${n.targetPostId}` : `/profile/${n.actorUsername ?? n.actorId}`}
                    className={UI.listRow}
                  >
                    <div className={`${UI.listAvatar} relative`}>
                      <Avatar uri={n.actorAvatar} size={44} className="w-full h-full" />
                      {n.type === 'like' && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                          <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                        </span>
                      )}
                      {n.type === 'comment' && (
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
                        <img src={n.postThumbUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className={UI.listThumb} />
                    )}
                  </Link>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageLayout>
  );
}
