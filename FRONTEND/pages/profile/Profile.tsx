import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { useIsOwnProfile } from '../../hooks/useIsOwnProfile';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { FollowButton } from '../../components/atoms/FollowButton';
import { VerifiedBadge } from '../../components/atoms/VerifiedBadge';
import { Grid3X3, User2, ChevronDown, Plus, Menu, Film, Bookmark, Star } from 'lucide-react';
import QR from 'qrcode';
import { getApiBase, getToken } from '../../services/api';
import { getFirstMediaUrl, ensureAbsoluteMediaUrl } from '../../utils/mediaUtils';
import { MobileShell } from '../../components/layout/MobileShell';
import { MoxePageHeader } from '../../components/layout/MoxePageHeader';
import { getSocket } from '../../services/socket';
export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const cap = useAccountCapabilities();
  const currentAccount = useCurrentAccount();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isOwn = useIsOwnProfile();
  const accountType = (profile?.accountType || (currentAccount as any)?.accountType || 'PERSONAL').toLowerCase();
  const effectiveAccountType = (profile?.accountType || (currentAccount as any)?.accountType || 'PERSONAL') as keyof typeof ACCOUNT_TYPE_LABELS;
  const label = ACCOUNT_TYPE_LABELS[effectiveAccountType] ?? 'Personal';
  const [highlights, setHighlights] = useState<any[]>([]);
  const [showQr, setShowQr] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [streakBadge, setStreakBadge] = useState<string | null>(null);
  const [qrReady, setQrReady] = useState(false);
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [taggedPosts, setTaggedPosts] = useState<any[]>([]);
  const [profileTab, setProfileTab] = useState<'grid' | 'reels' | 'tagged' | 'saved'>('grid');
  const [isFollowing, setFollowing] = useState(false);
  const [isFollowRequested, setFollowRequested] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriting, setFavoriting] = useState(false);
  const [creatorTiers, setCreatorTiers] = useState<{ key: string; name?: string; price?: number; perks?: string[] }[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedTierKey, setSelectedTierKey] = useState('');

  useEffect(() => {
    const token = getToken();
    const API_BASE = getApiBase();
    const ownProfile = isOwn;
    const url = username ? `${API_BASE}/accounts/username/${username}` : `${API_BASE}/accounts/me`;
    const opts: RequestInit = {};
    if (token) opts.headers = { Authorization: `Bearer ${token}` };
    fetch(url, opts)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.account) {
          setProfile(data.account);
          if (data.account.isBlockedByMe) setIsBlocked(true);
        } else if (data?.username) {
          setProfile(data);
          if (data.isBlockedByMe) setIsBlocked(true);
        } else {
          if (ownProfile && currentAccount) {
            const acc = currentAccount as any;
            setProfile({
              id: acc.id,
              username: acc.username,
              displayName: acc.displayName ?? acc.username,
              profilePhoto: acc.profilePhoto ?? acc.avatarUri,
              avatarUri: acc.avatarUri ?? acc.profilePhoto,
              bio: acc.bio,
              website: acc.website,
              link: acc.website ?? acc.link,
              postsCount: acc.postsCount ?? acc.postCount ?? 0,
              followersCount: acc.followersCount ?? acc.followerCount ?? 0,
              followingCount: acc.followingCount ?? 0,
              accountType: acc.accountType ?? 'PERSONAL',
            });
          } else {
            setProfile(null);
          }
        }
      })
      .catch(() => {
        if (ownProfile && currentAccount) {
          const acc = currentAccount as any;
          setProfile({
            id: acc.id,
            username: acc.username,
            displayName: acc.displayName ?? acc.username,
            profilePhoto: acc.profilePhoto ?? acc.avatarUri,
            avatarUri: acc.avatarUri ?? acc.profilePhoto,
            bio: acc.bio,
            website: acc.website,
            link: acc.website ?? acc.link,
            postsCount: acc.postsCount ?? acc.postCount ?? 0,
            followersCount: acc.followersCount ?? acc.followerCount ?? 0,
            followingCount: acc.followingCount ?? 0,
            accountType: acc.accountType ?? 'PERSONAL',
          });
        } else {
          setProfile(null);
        }
      })
      .finally(() => setLoading(false));
  }, [username, currentAccount?.id, (currentAccount as any)?.username, isOwn]);

  useEffect(() => {
    const token = getToken();
    if (!profile?.id) return;
    if (isOwn) {
      if (!token) return;
      fetch(`${getApiBase()}/highlights`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.highlights) setHighlights(data.highlights);
        })
        .catch(() => {});
      return;
    }
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${getApiBase()}/accounts/${encodeURIComponent(profile.id)}/highlights`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.highlights) setHighlights(data.highlights);
        else setHighlights([]);
      })
      .catch(() => setHighlights([]));
  }, [isOwn, profile?.id]);

  useEffect(() => {
    if (isOwn || !profile?.id) return;
    const token = getToken();
    if (!token) return;
    fetch(`${getApiBase()}/follow/status/${profile.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.isFollowing === 'boolean') setFollowing(data.isFollowing);
        if (data && typeof data.isRequested === 'boolean') setFollowRequested(data.isRequested);
        else if (data && typeof data.followRequested === 'boolean') setFollowRequested(data.followRequested);
        if (data && typeof data.isFavorite === 'boolean') setIsFavorite(data.isFavorite);
      })
      .catch(() => {});
  }, [isOwn, profile?.id]);

  useEffect(() => {
    if (isOwn || !profile?.id) return;
    const token = getToken();
    const API_BASE = getApiBase();
    fetch(`${API_BASE}/accounts/${profile.id}/subscription-tiers`, token ? { headers: { Authorization: `Bearer ${token}` } } : {})
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCreatorTiers(Array.isArray(data?.tiers) ? data.tiers : []))
      .catch(() => setCreatorTiers([]));
    if (token) {
      fetch(`${API_BASE}/accounts/me/subscriptions`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const subs = data?.subscriptions ?? [];
          setIsSubscribed(subs.some((s: any) => s.creatorId === profile.id));
        })
        .catch(() => {});
    }
  }, [isOwn, profile?.id]);

  useEffect(() => {
    if (!showQr || !profile) return;
    try {
      const unameForQr = profile.username || 'username';
      const url = `${window.location.origin}/profile/${encodeURIComponent(unameForQr)}`;
      const canvas = document.getElementById('moxe-profile-qr') as HTMLCanvasElement | null;
      if (canvas && typeof QR?.toCanvas === 'function') {
        QR.toCanvas(canvas, url, { width: 128 }, (err: any) => {
          if (err) {
            console.error('QR error', err);
            setQrReady(false);
          } else {
            setQrReady(true);
          }
        });
      }
    } catch {
      setQrReady(false);
    }
  }, [showQr, profile]);

  useEffect(() => {
    const token = getToken();
    if (!token || !isOwn) return;
    async function loadStreakBadge() {
      try {
        const res = await fetch(`${getApiBase()}/streaks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return;
        const items = (data.items ?? []) as any[];
        if (!items.length) return;
        const best = items.reduce(
          (acc, s) => (s.longestCount > (acc?.longestCount ?? 0) ? s : acc),
          null as any,
        );
        if (!best) return;
        const label =
          best.longestCount >= 30
            ? `🔥 ${best.type} · ${best.longestCount}-day streak`
            : best.longestCount >= 7
            ? `⭐ ${best.type} · ${best.longestCount}-day streak`
            : null;
        if (label) setStreakBadge(label);
      } catch {
        // ignore
      }
    }
    loadStreakBadge();
  }, [isOwn]);

  const loadProfilePosts = useCallback(() => {
    if (!profile?.id) {
      setProfilePosts([]);
      return;
    }
    const token = getToken();
    const opts: RequestInit = {};
    if (token) opts.headers = { Authorization: `Bearer ${token}` };
    fetch(`${getApiBase()}/posts?accountId=${encodeURIComponent(profile.id)}&limit=30`, opts)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const items = data?.items ?? data?.posts ?? [];
        setProfilePosts(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        setProfilePosts([]);
      });
  }, [profile?.id]);

  useEffect(() => {
    if (profileTab !== 'tagged' || !profile?.id) {
      if (profileTab !== 'tagged') setTaggedPosts([]);
      return;
    }
    const token = getToken();
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    fetch(`${getApiBase()}/posts/tagged/by/${encodeURIComponent(profile.id)}?limit=30`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setTaggedPosts(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => setTaggedPosts([]));
  }, [profileTab, profile?.id]);

  useEffect(() => {
    loadProfilePosts();
  }, [loadProfilePosts]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNewPost = () => loadProfilePosts();
    socket.on('feed:new-post', onNewPost);
    return () => {
      socket.off('feed:new-post', onNewPost);
    };
  }, [loadProfilePosts]);

  useEffect(() => {
    if (!isOwn && profileTab === 'saved') {
      setProfileTab('grid');
    }
  }, [isOwn, profileTab]);

  if (loading) {
    return (
      <ThemedView className="min-h-screen flex items-center justify-center p-moxe-md">
        <ThemedText secondary>Loading profile…</ThemedText>
      </ThemedView>
    );
  }
  if (!profile) {
  return (
      <ThemedView className="min-h-screen flex flex-col items-center justify-center p-moxe-md">
        <ThemedText className="text-moxe-body font-medium text-moxe-text mb-1">
          {isOwn ? "Profile not set up yet" : "This account doesn't exist"}
        </ThemedText>
        <ThemedText secondary className="text-moxe-caption text-center mb-4">
          {isOwn
            ? "Complete your profile in Settings so others can find you."
            : "The link may be broken or the account may have been removed."}
        </ThemedText>
        {isOwn ? (
          <Link
            to="/settings/account"
            className="px-4 py-2 rounded-moxe-md bg-moxe-primary text-white text-sm font-medium"
          >
            Go to Account settings
          </Link>
        ) : (
          <Link
            to="/"
            className="px-4 py-2 rounded-moxe-md bg-moxe-surface border border-moxe-border text-moxe-text text-sm font-medium"
          >
            Back to Home
          </Link>
        )}
      </ThemedView>
    );
  }

  const displayName = profile.displayName || profile.username || 'User';
  const uname = profile.username || 'username';
  const targetId = profile.id;
  const canViewProfileContent = isOwn || !profile?.isPrivate || isFollowing;

  async function toggleBlock() {
    if (!targetId || isOwn) return;
    const token = getToken();
    if (!token) return;
    setBlocking(true);
    try {
      if (isBlocked) {
        await fetch(`${getApiBase()}/privacy/block/${encodeURIComponent(targetId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsBlocked(false);
      } else {
        await fetch(`${getApiBase()}/privacy/block`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accountId: targetId }),
        });
        setIsBlocked(true);
      }
    } catch {
      // ignore for now
    } finally {
      setBlocking(false);
    }
  }

  async function toggleFavorite() {
    if (!targetId || isOwn || !getToken()) return;
    setFavoriting(true);
    try {
      const next = !isFavorite;
      const r = await fetch(`${getApiBase()}/follow/${encodeURIComponent(targetId)}/favorite`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: next }),
      });
      if (r.ok) setIsFavorite(next);
    } finally {
      setFavoriting(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col bg-moxe-background">
      <MobileShell>
      {/* Header: username shown on left, actions on the right */}
      <MoxePageHeader
        title=""
        className="!bg-black border-b border-[#262626]"
        left={<span className="text-white font-semibold text-base truncate max-w-[180px]">{uname}</span>}
        right={
          <div className="flex items-center gap-2">
            {!isOwn && (
              <button
                type="button"
                onClick={toggleBlock}
                className="text-[11px] px-2 py-1 rounded-moxe-md border border-moxe-border bg-moxe-surface text-moxe-text"
              >
                {blocking ? '…' : isBlocked ? 'Unblock' : 'Block'}
              </button>
            )}
            {isOwn && (
              <>
                <Link to="/create" className="p-2 -m-2 text-white active:opacity-70" aria-label="Create">
                  <Plus className="w-6 h-6" />
                </Link>
                <Link to="/settings" className="p-2 -m-2 text-white active:opacity-70" aria-label="Menu">
                  <Menu className="w-6 h-6" />
                </Link>
              </>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-auto pb-20">
        <div className="w-full max-w-[935px] mx-auto px-4">
        <div className="flex items-center gap-6 mb-3">
          <Avatar
            uri={profile.profilePhoto || profile.avatarUri}
            size={80}
          />
          <div className="flex-1 flex items-center justify-around gap-1">
            <div className="flex flex-col items-center">
              <ThemedText className="font-bold text-moxe-text mb-0.5">{profile.postsCount ?? profile.postCount ?? 0}</ThemedText>
              <ThemedText secondary className="text-moxe-textSecondary text-xs">Posts</ThemedText>
            </div>
            <span className="text-[#8e8e8e] text-[10px] leading-tight self-center" aria-hidden>⋯</span>
            <Link
              to={`/profile/${uname}/followers`}
              className="flex flex-col items-center"
            >
              <ThemedText className="font-bold text-moxe-text mb-0.5">{profile.followersCount ?? profile.followerCount ?? 0}</ThemedText>
              <ThemedText secondary className="text-moxe-textSecondary text-xs">Followers</ThemedText>
            </Link>
            <span className="text-[#8e8e8e] text-[10px] leading-tight self-center" aria-hidden>⋯</span>
            <Link
              to={`/profile/${uname}/following`}
              className="flex flex-col items-center"
            >
              <ThemedText className="font-bold text-moxe-text mb-0.5">{profile.followingCount ?? 0}</ThemedText>
              <ThemedText secondary className="text-moxe-textSecondary text-xs">Following</ThemedText>
            </Link>
          </div>
        </div>

        {/* Username with verified badge */}
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <ThemedText className="font-semibold text-moxe-body text-moxe-text">{displayName}</ThemedText>
          {(profile.isVerified ?? (profile as any).user?.isVerified) && (
            <VerifiedBadge size={14} />
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {(profile.businessCategory || (effectiveAccountType && effectiveAccountType !== 'PERSONAL')) && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-moxe-textSecondary shrink-0" aria-hidden />
              <ThemedText secondary className="text-moxe-caption">
                {profile.businessCategory || label}
              </ThemedText>
            </>
          )}
        </div>
        {profile.bio && <ThemedText secondary className="mb-1.5 block text-moxe-textSecondary">{profile.bio}</ThemedText>}
        {profile.location && (
          <ThemedText secondary className="mb-1 block text-moxe-caption">{profile.location}</ThemedText>
        )}
        {(profile.link || profile.website) && (
          <a
            href={profile.link || profile.website}
            target="_blank"
            rel="noreferrer"
            className="mb-1 block text-moxe-caption text-moxe-accent underline underline-offset-2"
          >
            {profile.link || profile.website}
          </a>
        )}
        {profile.pronouns && (
          <ThemedText secondary className="mb-3 block text-moxe-caption">{profile.pronouns}</ThemedText>
        )}
        {streakBadge && (
          <div className="mb-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-moxe-surface border border-moxe-border">
            <ThemedText secondary className="text-[11px]">{streakBadge}</ThemedText>
              </div>
        )}

        {/* Action buttons by account type: Personal = Edit only; Business = Edit, MOxE E, Insights, Promotions; Creator = Edit, Insights, Promotions */}
        {isOwn ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-moxe-surface border border-moxe-border text-moxe-text font-semibold text-sm"
            >
              Edit Profile
            </button>
            {accountType === 'business' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/business-dashboard')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-white font-semibold text-sm"
                >
                  MOxE E
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/insights')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-white font-semibold text-sm"
                >
                  Insights
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ads')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-white font-semibold text-sm"
                >
                  Promotions
                </button>
              </>
            )}
            {accountType === 'creator' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/insights')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-white font-semibold text-sm"
                >
                  Insights
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ads')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-white font-semibold text-sm"
                >
                  Promotions
                </button>
              </>
            )}
            {accountType === 'job' && (
              <button
                type="button"
                onClick={() => navigate('/job')}
                className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-white font-semibold text-sm"
              >
                Job tools
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            <FollowButton
              isFollowing={isFollowing}
              isRequested={isFollowRequested}
              showRequestLabel={!!profile?.isPrivate}
              onClick={async () => {
                if (!targetId || !getToken()) return;
                try {
                  if (isFollowing || isFollowRequested) {
                    const r = await fetch(`${getApiBase()}/follow/${targetId}`, {
                      method: 'DELETE',
                      headers: { Authorization: `Bearer ${getToken()}` },
                    });
                    if (r.ok) {
                      setFollowing(false);
                      setFollowRequested(false);
                    }
                  } else {
                    const r = await fetch(`${getApiBase()}/follow`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accountId: targetId }),
                    });
                    if (r.ok) {
                      const data = await r.json().catch(() => null);
                      if (data?.pending) {
                        setFollowRequested(true);
                        setFollowing(false);
                      } else {
                        setFollowing(true);
                        setFollowRequested(false);
                      }
                    }
                  }
                } catch {
                  // ignore
                }
              }}
              className="flex-1 min-w-0"
            />
            {creatorTiers.length > 0 && (
              <>
                {!isSubscribed ? (
                  <button
                    type="button"
                    onClick={() => setShowSubscribeModal(true)}
                    className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-accent border-0 text-white font-semibold text-sm"
                  >
                    Subscribe
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={subscribing}
                    onClick={async () => {
                      if (!targetId || !getToken()) return;
                      setSubscribing(true);
                      try {
                        const r = await fetch(`${getApiBase()}/accounts/${targetId}/unsubscribe`, {
                          method: 'POST',
                          headers: { Authorization: `Bearer ${getToken()}` },
                        });
                        if (r.ok) setIsSubscribed(false);
                      } finally {
                        setSubscribing(false);
                      }
                    }}
                    className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-surface border-0 text-moxe-body font-semibold text-sm"
                  >
                    {subscribing ? '…' : 'Subscribed'}
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-moxe-primary border-0 text-moxe-body font-semibold text-white"
              onClick={() => navigate(`/messages/${profile.id}`)}
            >
              Message
            </button>
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={favoriting}
              className={`px-3 py-2.5 rounded-xl border font-semibold text-sm inline-flex items-center justify-center ${
                isFavorite
                  ? 'bg-[#facc15]/20 border-[#facc15] text-[#facc15]'
                  : 'bg-moxe-surface border-moxe-border text-moxe-text'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}

        {/* Highlights: New + existing (own profile only); others see only their highlights */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-3 no-scrollbar">
          {isOwn && (
            <Link
              to="/highlights/manage"
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full bg-moxe-surface flex items-center justify-center font-semibold border-2 border-moxe-border mb-1 text-moxe-text text-xl">
                +
              </div>
              <span className="text-moxe-textSecondary text-xs">New</span>
            </Link>
          )}
          {highlights.map((h: any) => (
            <Link
              key={h.id}
              to={`/highlights/${h.id}`}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full border-2 border-moxe-border overflow-hidden mb-1 bg-moxe-surface">
                {h.coverImage ? (
                  <img src={h.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                          <div className="w-full h-full flex items-center justify-center text-moxe-text text-sm font-semibold">
                    {(h.name || 'Highlight').charAt(0)}
                  </div>
              )}
            </div>
              <span className="text-moxe-textSecondary text-xs truncate max-w-[64px]">{h.name || 'Highlight'}</span>
            </Link>
          ))}
        </div>

        {/* Tabs: Posts / Reels / Tagged / Saved – MOxE profile */}
        {!canViewProfileContent && (
          <div className="mb-4 rounded-xl border border-moxe-border bg-moxe-surface p-4 text-center">
            <ThemedText className="text-moxe-text font-semibold">This account is private</ThemedText>
            <ThemedText secondary className="text-moxe-caption mt-1">
              Follow this account to see posts and reels.
            </ThemedText>
          </div>
        )}
        {canViewProfileContent && (
          <>
        <div className="flex border-b border-[#262626] mb-2 text-xs">
          {[
            { key: 'grid' as const, Icon: Grid3X3, label: 'Posts' },
            { key: 'reels' as const, Icon: Film, label: 'Reels' },
            { key: 'tagged' as const, Icon: User2, label: 'Tagged' },
            ...(isOwn ? [{ key: 'saved' as const, Icon: Bookmark, label: 'Saved' }] : []),
          ].map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setProfileTab(key)}
              className={`flex-1 text-center py-2.5 border-b-2 font-semibold transition-colors ${
                profileTab === key ? 'border-white text-white' : 'border-transparent text-[#8e8e8e]'
              }`}
            >
              <span className="inline-flex items-center justify-center gap-1">
                <Icon className="w-4 h-4" />
                <span className="sr-only">{label}</span>
              </span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-[2px] mb-4">
          {profileTab === 'grid' &&
            profilePosts.map((p) => {
              const thumb = p.media?.[0]?.url ?? p.mediaUrl ?? p.media_uri;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="aspect-square bg-moxe-surface overflow-hidden"
                  // MOxE profile grid: tap thumbnail to open post detail (to be implemented)
                  onClick={() => {
                    navigate(`/post/${p.id}`);
                  }}
                >
                  {thumb ? (
                    <img src={ensureAbsoluteMediaUrl(thumb)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-moxe-textSecondary" />
                  )}
                </button>
              );
            })}
          {(profileTab === 'reels' || profileTab === 'saved') && (
            <div className="col-span-3 py-8 text-center">
              <ThemedText secondary className="text-moxe-caption">
                {profileTab === 'reels' ? 'Reels appear here' : 'Saved posts appear here'}
              </ThemedText>
              {profileTab === 'saved' && isOwn && (
                <Link to="/saved" className="block mt-2 text-[#0095f6] text-sm font-semibold">View saved</Link>
              )}
            </div>
          )}
          {profileTab === 'grid' && profilePosts.length === 0 && !loading && (
            <div className="col-span-3 py-8 text-center">
              <ThemedText secondary className="text-moxe-caption">No posts yet</ThemedText>
            </div>
          )}
          {profileTab === 'tagged' &&
            taggedPosts.map((p) => {
              const thumb = p.media?.[0]?.url ?? p.mediaUrl ?? p.media_uri;
              return (
                <button
                  key={p.id}
                  type="button"
                  className="aspect-square bg-moxe-surface overflow-hidden"
                  onClick={() => navigate(`/post/${p.id}`)}
                >
                  {thumb ? (
                    <img src={ensureAbsoluteMediaUrl(thumb)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-moxe-textSecondary" />
                  )}
                </button>
              );
            })}
          {profileTab === 'tagged' && taggedPosts.length === 0 && !loading && (
            <div className="col-span-3 py-8 text-center">
              <ThemedText secondary className="text-moxe-caption">
                {isOwn ? 'No approved tagged posts yet. Review pending tags in Settings → Tags and mentions.' : 'No tagged posts.'}
              </ThemedText>
            </div>
          )}
        </div>
          </>
        )}
      </div>
      </div>
      {showQr && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center">
          <div className="bg-moxe-surface rounded-moxe-lg border border-moxe-border px-5 py-4 w-[280px] space-y-3 text-center">
            <ThemedText className="text-moxe-body font-semibold">Share profile</ThemedText>
            <div className="mx-auto w-40 h-40 bg-white flex items-center justify-center rounded overflow-hidden">
              <canvas
                id="moxe-profile-qr"
                className="w-32 h-32"
              />
            </div>
            <button
              type="button"
              className="w-full py-1.5 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-moxe-text"
              onClick={() => {
                const url = `${window.location.origin}/profile/${encodeURIComponent(
                  uname,
                )}`;
                navigator.clipboard.writeText(url).catch(() => {});
              }}
            >
              Copy link
            </button>
            <button
              type="button"
              className="w-full py-1.5 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-moxe-textSecondary"
              onClick={() => setShowQr(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {showSubscribeModal && !isOwn && targetId && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-moxe-surface rounded-xl border border-moxe-border px-4 py-4 w-full max-w-sm space-y-3">
            <ThemedText className="font-semibold text-moxe-text block">Choose a tier</ThemedText>
            <div className="space-y-2 max-h-48 overflow-auto">
              {creatorTiers.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTierKey(t.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm ${selectedTierKey === t.key ? 'border-[#a855f7] bg-[#a855f7]/10 text-white' : 'border-moxe-border bg-moxe-background text-moxe-text'}`}
                >
                  <span className="font-medium">{t.name || t.key}</span>
                  {t.price != null && <span className="text-moxe-textSecondary ml-2">${Number(t.price).toFixed(2)}/mo</span>}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-lg border border-moxe-border text-moxe-text text-sm font-medium"
                onClick={() => { setShowSubscribeModal(false); setSelectedTierKey(''); }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedTierKey || subscribing}
                className="flex-1 py-2 rounded-lg bg-[#a855f7] text-white text-sm font-semibold disabled:opacity-50"
                onClick={async () => {
                  if (!selectedTierKey || !targetId || !getToken()) return;
                  setSubscribing(true);
                  try {
                    const r = await fetch(`${getApiBase()}/accounts/${targetId}/subscribe`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ tierKey: selectedTierKey }),
                    });
                    if (r.ok) {
                      setIsSubscribed(true);
                      setShowSubscribeModal(false);
                      setSelectedTierKey('');
                    }
                  } finally {
                    setSubscribing(false);
                  }
                }}
              >
                {subscribing ? 'Subscribing…' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
      </MobileShell>
    </ThemedView>
  );
}
