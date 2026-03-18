import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Avatar } from '../../components/ui/Avatar';
import { UI } from '../../constants/uiTheme';
import { getApiBase, getToken } from '../../services/api';
import { useCurrentAccount } from '../../hooks/useAccountCapabilities';

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
  const currentAccount = useCurrentAccount() as any;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followRequestCount, setFollowRequestCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        if (!token) {
          if (!cancelled) setItems([]);
          return;
        }
        const res = await fetch(`${getApiBase()}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error || 'Failed to load notifications.');
          setItems([]);
          return;
        }
        const list = data.items ?? data.notifications ?? data ?? [];
        const mapped: NotificationItem[] = Array.isArray(list)
          ? list.map((n: any) => ({
              id: n.id,
              type: n.type,
              actorId: n.actorId ?? n.accountId,
              actorUsername: n.actor?.username ?? n.account?.username,
              actorAvatar: n.actor?.profilePhoto ?? n.actor?.avatarUrl,
              message: n.message ?? n.text ?? '',
              createdAt: n.createdAt ?? n.timestamp,
              targetPostId: n.targetPostId ?? n.postId,
              postThumbUrl: n.postThumbUrl ?? n.mediaUrl,
            }))
          : [];
        setItems(mapped);
        if (typeof data.followRequestCount === 'number') setFollowRequestCount(data.followRequestCount);
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || 'Failed to load notifications.');
          setItems([]);
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

  const username = currentAccount?.username ?? currentAccount?.handle ?? '';

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black">
      <MobileShell>
        {/* Header – account name with dropdown + heart icon, Instagram-style */}
        <header className="flex items-center justify-between h-12 px-3 border-b border-white/10 bg-black/95 safe-area-pt">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center text-white" aria-label="Back">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <button
              type="button"
              className="flex items-center gap-1 text-white font-semibold text-sm"
            >
              <span>{username}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center text-white"
            aria-label="Activity"
          >
            <Heart className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-auto pb-20">
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
      </MobileShell>
    </ThemedView>
  );
}
