import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAccountCapabilities, useCurrentAccount } from '../../hooks/useAccountCapabilities';
import { ACCOUNT_TYPE_LABELS } from '../../constants/accountTypes';
import { ThemedView, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { Avatar } from '../../components/ui/Avatar';
import { FollowButton } from '../../components/atoms/FollowButton';
import { VerifiedBadge } from '../../components/atoms/VerifiedBadge';
import { Grid3X3, User2, ChevronDown, Plus, Menu, Film, Bookmark } from 'lucide-react';
import QR from 'qrcode';
import { getApiBase, getToken } from '../../services/api';
import { mockUsers } from '../../mocks/users';
import { mockPosts } from '../../mocks/posts';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const cap = useAccountCapabilities();
  const currentAccount = useCurrentAccount();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isOwn = !username || (currentAccount as any)?.username === username;
  const accountType = (profile?.accountType || (currentAccount as any)?.accountType || 'PERSONAL').toLowerCase();
  const label = profile?.accountType ? ACCOUNT_TYPE_LABELS[profile.accountType as keyof typeof ACCOUNT_TYPE_LABELS] : 'Personal';
  const [highlights, setHighlights] = useState<any[]>([]);
  const [showQr, setShowQr] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [streakBadge, setStreakBadge] = useState<string | null>(null);
  const [qrReady, setQrReady] = useState(false);
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [profileTab, setProfileTab] = useState<'grid' | 'reels' | 'tagged' | 'saved'>('grid');
  const [isFollowing, setFollowing] = useState(false);
  const [creatorTiers, setCreatorTiers] = useState<{ key: string; name?: string; price?: number; perks?: string[] }[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [selectedTierKey, setSelectedTierKey] = useState('');

  useEffect(() => {
    const token = getToken();
    const API_BASE = getApiBase();
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
          // No API data: fallback to mock so profile is always populated.
          const mockProfile = username
            ? mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())
            : mockUsers[0];
          if (mockProfile) {
            setProfile({
              id: mockProfile.id,
              username: mockProfile.username,
              displayName: mockProfile.displayName,
              profilePhoto: mockProfile.avatarUrl,
              avatarUri: mockProfile.avatarUrl,
              bio: mockProfile.bio,
              website: mockProfile.website,
              postsCount: mockPosts.filter((p) => p.authorId === mockProfile.id).length,
              followersCount: 0,
              followingCount: 0,
              accountType: mockProfile.accountType ?? 'PERSONAL',
            });
          } else {
            setProfile(null);
          }
        }
      })
      .catch(() => {
        const mockProfile = username
          ? mockUsers.find((u) => u.username.toLowerCase() === username.toLowerCase())
          : mockUsers[0];
        if (mockProfile) {
          setProfile({
            id: mockProfile.id,
            username: mockProfile.username,
            displayName: mockProfile.displayName,
            profilePhoto: mockProfile.avatarUrl,
            avatarUri: mockProfile.avatarUrl,
            bio: mockProfile.bio,
            website: mockProfile.website,
            postsCount: mockPosts.filter((p) => p.authorId === mockProfile.id).length,
            followersCount: 0,
            followingCount: 0,
            accountType: mockProfile.accountType ?? 'PERSONAL',
          });
        } else {
          setProfile(null);
        }
      })
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    const token = getToken();
    if (!token || !isOwn) return;
    fetch(`${getApiBase()}/highlights`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.highlights) setHighlights(data.highlights);
      })
      .catch(() => {});
  }, [isOwn]);

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

  useEffect(() => {
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
        if (Array.isArray(items) && items.length > 0) {
          setProfilePosts(items);
          return;
        }
        // Empty or no API: use mocks for this profile.
        const mockUserPosts = mockPosts
          .filter((p) => p.authorId === profile.id)
          .map((p) => ({
            id: p.id,
            media: p.media,
            mediaUrl: p.media[0]?.url,
            caption: p.caption,
            location: p.location,
            account: mockUsers.find((u) => u.id === p.authorId),
            _count: { likes: p.likeCount, comments: p.commentCount },
          }));
        setProfilePosts(mockUserPosts);
      })
      .catch(() => {
        const mockUserPosts = mockPosts
          .filter((p) => p.authorId === profile.id)
          .map((p) => ({
            id: p.id,
            media: p.media,
            mediaUrl: p.media[0]?.url,
            caption: p.caption,
            location: p.location,
            account: mockUsers.find((u) => u.id === p.authorId),
            _count: { likes: p.likeCount, comments: p.commentCount },
          }));
        setProfilePosts(mockUserPosts);
      });
  }, [profile?.id]);

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

  return (
    <ThemedView className="min-h-screen flex flex-col bg-white">
      {/* Username + status dot + chevron (left); + and menu (right) – same for all accounts */}
      <header className="sticky top-0 z-10 flex items-center justify-between h-12 px-3 border-b border-[#DBDBDB] bg-white safe-area-pt">
        {isOwn ? (
          <Link to="/settings/accounts" className="flex items-center gap-1.5 text-black font-semibold text-sm active:opacity-80">
            {uname}
            <span className="w-2 h-2 rounded-full bg-[#ed4956] shrink-0" aria-hidden />
            <ChevronDown className="w-4 h-4 text-[#a8a8a8]" />
          </Link>
        ) : (
          <button type="button" className="flex items-center gap-1.5 text-black font-semibold text-sm">
            {uname}
            <span className="w-2 h-2 rounded-full bg-[#ed4956] shrink-0" aria-hidden />
            <ChevronDown className="w-4 h-4 text-[#a8a8a8]" />
          </button>
        )}
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
          <Link to="/create" className="p-2 -m-2 text-black" aria-label="Create">
            <Plus className="w-6 h-6" />
          </Link>
          <Link to="/settings" className="p-2 -m-2 text-black" aria-label="Menu">
            <Menu className="w-6 h-6" />
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-auto pb-20">
        <div className="w-full max-w-[935px] mx-auto px-4">
        <div className="flex items-center gap-6 mb-3">
          <Avatar
            uri={profile.profilePhoto || profile.avatarUri}
            size={80}
          />
          <div className="flex-1 flex items-center justify-around gap-1">
            <div className="flex flex-col items-center">
              <ThemedText className="font-bold text-black mb-0.5">{profile.postsCount ?? 21}</ThemedText>
              <ThemedText secondary className="text-[#8e8e8e] text-xs">Posts</ThemedText>
            </div>
            <span className="text-[#8e8e8e] text-[10px] leading-tight self-center" aria-hidden>⋯</span>
            <Link
              to={`/profile/${uname}/followers`}
              className="flex flex-col items-center"
            >
              <ThemedText className="font-bold text-black mb-0.5">{profile.followersCount ?? 563}</ThemedText>
              <ThemedText secondary className="text-[#8e8e8e] text-xs">Followers</ThemedText>
            </Link>
            <span className="text-[#8e8e8e] text-[10px] leading-tight self-center" aria-hidden>⋯</span>
            <Link
              to={`/profile/${uname}/following`}
              className="flex flex-col items-center"
            >
              <ThemedText className="font-bold text-black mb-0.5">{profile.followingCount ?? 172}</ThemedText>
              <ThemedText secondary className="text-[#8e8e8e] text-xs">Following</ThemedText>
            </Link>
          </div>
        </div>

        {/* Username with verified badge */}
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <ThemedText className="font-semibold text-moxe-body text-black">{displayName}</ThemedText>
          {(profile.isVerified ?? (mockUsers.find((u) => u.username === uname) as any)?.isVerified) && (
            <VerifiedBadge size={14} />
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {(profile.businessCategory || (profile.accountType && profile.accountType !== 'PERSONAL')) && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[#8e8e8e] shrink-0" aria-hidden />
              <ThemedText secondary className="text-moxe-caption">
                {profile.businessCategory || ACCOUNT_TYPE_LABELS[profile.accountType as keyof typeof ACCOUNT_TYPE_LABELS]}
              </ThemedText>
            </>
          )}
        </div>
        {profile.bio && <ThemedText secondary className="mb-1.5 block text-[#262626]">{profile.bio}</ThemedText>}
        {profile.location && (
          <ThemedText secondary className="mb-1 block text-moxe-caption">{profile.location}</ThemedText>
        )}
        {profile.link && (
          <a
            href={profile.link}
            target="_blank"
            rel="noreferrer"
            className="mb-1 block text-moxe-caption text-moxe-accent underline underline-offset-2"
          >
            {profile.link}
          </a>
        )}
        {profile.pronouns && (
          <ThemedText secondary className="mb-3 block text-moxe-caption">{profile.pronouns}</ThemedText>
        )}
        {streakBadge && (
          <div className="mb-1.5 inline-flex items-center px-2 py-0.5 rounded-full bg-[#fafafa] border border-[#dbdbdb]">
            <ThemedText secondary className="text-[11px]">{streakBadge}</ThemedText>
              </div>
        )}

        {/* Action buttons by account type: Personal = Edit only; Business = Edit, MOxE E, Insights, Promotions; Creator = Edit, Insights, Promotions */}
        {isOwn ? (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => navigate('/profile/edit')}
              className="flex-1 min-w-[100px] py-2.5 rounded-lg bg-[#efefef] border border-[#dbdbdb] text-black font-semibold text-sm"
            >
              Edit Profile
            </button>
            {accountType === 'business' && (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/business-dashboard')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-white font-semibold text-sm"
                >
                  MOxE E
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/insights')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-white font-semibold text-sm"
                >
                  Insights
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ads')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-white font-semibold text-sm"
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
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-white font-semibold text-sm"
                >
                  Insights
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/ads')}
                  className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-white font-semibold text-sm"
                >
                  Promotions
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            <FollowButton isFollowing={isFollowing} onClick={() => setFollowing((f) => !f)} className="flex-1 min-w-0" />
            {creatorTiers.length > 0 && (
              <>
                {!isSubscribed ? (
                  <button
                    type="button"
                    onClick={() => setShowSubscribeModal(true)}
                    className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#a855f7] border-0 text-white font-semibold text-sm"
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
                    className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-moxe-body font-semibold text-sm"
                  >
                    {subscribing ? '…' : 'Subscribed'}
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              className="flex-1 min-w-[100px] py-2.5 rounded-xl bg-[#363636] border-0 text-moxe-body font-semibold text-white"
              onClick={() => navigate(`/messages/${profile.id}`)}
            >
              Message
            </button>
          </div>
        )}

        {/* Highlights: New + existing (same for all accounts) */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-3 no-scrollbar">
          <Link
            to="/highlights/manage"
            className="flex flex-col items-center flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-[#262626] flex items-center justify-center font-semibold border-2 border-[#363636] mb-1 text-white text-xl">
              +
            </div>
            <span className="text-[#a8a8a8] text-xs">New</span>
          </Link>
          {highlights.map((h: any) => (
            <Link
              key={h.id}
              to={`/highlights/${h.id}`}
              className="flex flex-col items-center flex-shrink-0"
            >
              <div className="w-14 h-14 rounded-full border-2 border-[#363636] overflow-hidden mb-1 bg-[#262626]">
                {h.coverImage ? (
                  <img src={h.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                    {(h.name || 'Highlight').charAt(0)}
                  </div>
              )}
            </div>
              <span className="text-[#a8a8a8] text-xs truncate max-w-[64px]">{h.name || 'Highlight'}</span>
            </Link>
          ))}
        </div>

        {/* Tabs: Posts / Reels / Tagged / Saved – Instagram style */}
        <div className="flex border-b border-[#262626] mb-2 text-xs">
          {[
            { key: 'grid' as const, Icon: Grid3X3, label: 'Posts' },
            { key: 'reels' as const, Icon: Film, label: 'Reels' },
            { key: 'tagged' as const, Icon: User2, label: 'Tagged' },
            { key: 'saved' as const, Icon: Bookmark, label: 'Saved' },
          ].map(({ key, Icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setProfileTab(key)}
              className={`flex-1 text-center py-2 border-b-2 font-semibold ${
                profileTab === key ? 'border-[#0095f6] text-[#0095f6]' : 'border-transparent text-[#737373]'
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
                  // Instagram-style: tap thumbnail to open post detail (to be implemented)
                  onClick={() => {
                    navigate(`/post/${p.id}`);
                  }}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
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
          {profileTab === 'tagged' && (
            <div className="col-span-3 py-8 text-center">
              <ThemedText secondary className="text-moxe-caption">Tagged posts appear here</ThemedText>
            </div>
          )}
        </div>
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
    </ThemedView>
  );
}
