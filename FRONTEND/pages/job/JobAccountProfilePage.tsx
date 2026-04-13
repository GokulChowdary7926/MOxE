import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  MoreHorizontal,
  Play,
  Tag,
  Briefcase,
  Code2,
  Users,
  Presentation,
  Pencil,
  Plus,
  CheckCircle2,
  Quote,
  Globe,
  Github,
  Linkedin,
  Building2,
  Rocket,
  Mail,
} from 'lucide-react';
import { getApiBase, getToken } from '../../services/api';
import { ensureAbsoluteMediaUrl, getFirstMediaUrl } from '../../utils/mediaUtils';

const ACCENT = '#6a11cb';
const JOB_PRIMARY = '#0052CC';

type LinkRow = { id?: string; url: string; title?: string | null; displayText?: string | null };

type ProfExperience = {
  title?: string;
  role?: string;
  company?: string;
  employmentType?: string;
  start?: string;
  end?: string;
  description?: string;
};

type ProfCert = { name?: string };
type ProfRec = { text?: string; author?: string; authorTitle?: string };
type ProfPortfolioItem = { url?: string; thumbnailUrl?: string };

type ProfessionalSection = {
  experience?: ProfExperience[];
  certifications?: ProfCert[];
  recommendations?: ProfRec[];
  portfolio?: ProfPortfolioItem[];
};

type MeAccount = {
  id: string;
  username: string;
  displayName?: string;
  bio?: string | null;
  profilePhoto?: string | null;
  accountType?: string;
  professionalHeadline?: string | null;
  professionalSection?: ProfessionalSection | null;
  skills?: string[];
  openToOpportunities?: boolean;
  workplaceVerified?: boolean;
  verifiedBadge?: boolean;
  website?: string | null;
  contactEmail?: string | null;
  links?: LinkRow[];
  postsCount?: number;
  postCount?: number;
  followersCount?: number;
  followerCount?: number;
  followingCount?: number;
};

type GridPost = { id: string; media?: { url?: string }[] };
type GridReel = { id: string; thumbnail?: string | null; video?: string; likeCount?: number };
type HighlightRow = {
  id: string;
  name?: string;
  coverImage?: string | null;
  items?: { story?: { media?: unknown }; archivedStory?: { media?: unknown } }[];
};

type ActivityRow = { id: string; icon: 'track' | 'know' | 'job'; text: string; time: string };

function authHeaders(): HeadersInit {
  const t = getToken();
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(iso: string | Date): string {
  const t = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime();
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
}

function parseProfessionalSection(raw: unknown): ProfessionalSection {
  if (!raw || typeof raw !== 'object') return {};
  return raw as ProfessionalSection;
}

function highlightCover(h: HighlightRow): string {
  if (h.coverImage) return ensureAbsoluteMediaUrl(h.coverImage);
  const first = h.items?.[0];
  const media = first?.story?.media ?? first?.archivedStory?.media;
  const url = getFirstMediaUrl({ media: media as { url?: string }[] | undefined });
  return ensureAbsoluteMediaUrl(url);
}

function linkIcon(url: string) {
  const u = url.toLowerCase();
  if (u.includes('github')) return Github;
  if (u.includes('linkedin')) return Linkedin;
  return Globe;
}

export default function JobAccountProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<MeAccount | null>(null);
  const [posts, setPosts] = useState<GridPost[]>([]);
  const [reels, setReels] = useState<GridReel[]>([]);
  const [tagged, setTagged] = useState<GridPost[]>([]);
  const [highlights, setHighlights] = useState<HighlightRow[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [viewMode, setViewMode] = useState<'social' | 'recruiters'>('social');
  const [gridTab, setGridTab] = useState<'posts' | 'reels' | 'tagged'>('posts');

  const loadAll = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      toast.error('Sign in to view your Job profile.');
      return;
    }
    const API = getApiBase();
    setLoading(true);
    try {
      const meRes = await fetch(`${API}/accounts/me`, { headers: authHeaders() });
      const meJson = await meRes.json().catch(() => ({}));
      if (!meRes.ok) throw new Error((meJson as { error?: string }).error || 'Failed to load account');
      const acc = ((meJson as { account?: MeAccount }).account || meJson) as MeAccount;
      if (!acc?.id) throw new Error('No account');
      setAccount(acc);
      const id = acc.id;

      const [postsR, reelsR, taggedR, hiR, sugR, knowR] = await Promise.all([
        fetch(`${API}/posts?accountId=${encodeURIComponent(id)}&limit=30`, { headers: authHeaders() }),
        fetch(`${API}/reels?accountId=${encodeURIComponent(id)}&limit=30`, { headers: authHeaders() }),
        fetch(`${API}/posts/tagged?limit=30`, { headers: authHeaders() }),
        fetch(`${API}/highlights`, { headers: authHeaders() }),
        fetch(`${API}/job/assistant/suggestions`, { headers: authHeaders() }),
        fetch(`${API}/job/know/recent?limit=6`, { headers: authHeaders() }),
      ]);

      const postsJ = postsR.ok ? await postsR.json().catch(() => ({})) : {};
      const reelsJ = reelsR.ok ? await reelsR.json().catch(() => ({})) : {};
      const taggedJ = taggedR.ok ? await taggedR.json().catch(() => ({})) : {};
      const hiJ = hiR.ok ? await hiR.json().catch(() => ({})) : {};
      const sugJ = sugR.ok ? await sugR.json().catch(() => ({})) : {};
      const knowList = knowR.ok ? await knowR.json().catch(() => []) : [];

      setPosts(Array.isArray(postsJ.items) ? postsJ.items : []);
      setReels(Array.isArray(reelsJ.items) ? reelsJ.items : []);
      setTagged(Array.isArray(taggedJ.items) ? taggedJ.items : []);
      setHighlights(Array.isArray(hiJ.highlights) ? hiJ.highlights : []);

      const suggestions = sugJ.suggestions || {};
      const today = suggestions.today || {};
      const act: ActivityRow[] = [];
      let k = 0;
      for (const p of today.projects || []) {
        act.push({
          id: `p-${k++}`,
          icon: 'track',
          text: `Active in MOxE TRACK — ${p.name || 'Project'}`,
          time: timeAgo(p.updatedAt),
        });
      }
      for (const j of today.jobs || []) {
        act.push({
          id: `j-${k++}`,
          icon: 'job',
          text: `Open role: ${j.title || 'Role'}${j.companyName ? ` · ${j.companyName}` : ''}`,
          time: timeAgo(j.createdAt),
        });
      }
      const knowArr = Array.isArray(knowList) ? knowList : [];
      for (const page of knowArr.slice(0, 4)) {
        const title = page.title || 'Knowledge page';
        const space = page.space?.name ? ` (${page.space.name})` : '';
        act.push({
          id: `k-${page.id || k++}`,
          icon: 'know',
          text: `Updated “${title}” in KNOW${space}`,
          time: timeAgo(page.updatedAt || page.createdAt),
        });
      }
      act.sort((a, b) => {
        const order = (x: string) => {
          if (x.endsWith('just now')) return 0;
          const m = x.match(/^(\d+)(m|h|d|w)/);
          if (!m) return 999;
          const n = parseInt(m[1], 10);
          const u = m[2];
          if (u === 'm') return n;
          if (u === 'h') return 60 + n;
          if (u === 'd') return 1440 + n * 60;
          return 10000 + n;
        };
        return order(a.time) - order(b.time);
      });
      setActivity(act.slice(0, 8));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to load profile');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const prof = useMemo(() => parseProfessionalSection(account?.professionalSection), [account?.professionalSection]);
  const experience = prof.experience?.length ? prof.experience : [];
  const certifications = prof.certifications?.length ? prof.certifications : [];
  const recommendations = prof.recommendations?.length ? prof.recommendations : [];
  const portfolioItems = prof.portfolio?.filter((p) => p.thumbnailUrl || p.url)?.length
    ? prof.portfolio!
    : [];

  const postsCount = account?.postsCount ?? account?.postCount ?? posts.length;
  const followersCount = account?.followersCount ?? account?.followerCount ?? 0;
  const followingCount = account?.followingCount ?? 0;
  const reelsCount = reels.length;

  const avatarUrl = ensureAbsoluteMediaUrl(account?.profilePhoto || '');
  const publicProfileUrl =
    typeof window !== 'undefined' && account?.username
      ? `${window.location.origin}/profile/${encodeURIComponent(account.username)}`
      : '';

  const shareProfile = async () => {
    try {
      if (publicProfileUrl && navigator.share) {
        await navigator.share({ title: account?.displayName || 'Profile', url: publicProfileUrl });
      } else if (publicProfileUrl) {
        await navigator.clipboard.writeText(publicProfileUrl);
        toast.success('Profile link copied.');
      }
    } catch {
      toast.error('Could not share profile.');
    }
  };

  const contactRecruiter = () => {
    const email = account?.contactEmail?.trim();
    if (email) {
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Opportunity — via MOxE Job profile')}`;
      return;
    }
    toast('Add a contact email in Job profile edit so recruiters can reach you.');
  };

  if (loading) {
    return (
      <div className="-mx-4 -mt-3 flex min-h-[50vh] items-center justify-center bg-black pb-28 text-[#a0a0a0]">
        Loading Job profile…
      </div>
    );
  }

  if (!account) {
    return (
      <div className="-mx-4 -mt-3 flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-black pb-28 px-4 text-center">
        <p className="text-[#e0e0e0]">Could not load your profile.</p>
        <button
          type="button"
          className="rounded-full px-4 py-2 text-sm font-semibold text-white"
          style={{ background: JOB_PRIMARY }}
          onClick={() => void loadAll()}
        >
          Retry
        </button>
      </div>
    );
  }

  const isJob = String(account.accountType || '').toUpperCase() === 'JOB';
  const headline = account.professionalHeadline?.trim() || 'Add your professional headline';
  const displayLinks: { url: string; label: string; Icon: typeof Globe }[] = [];
  function safeLinkLabel(url: string, fallback: string) {
    try {
      const u = url.startsWith('http') ? url : `https://${url}`;
      return new URL(u).hostname.replace(/^www\./, '') || fallback;
    } catch {
      return fallback;
    }
  }
  if (account.website?.trim()) {
    const w = account.website.trim();
    displayLinks.push({ url: w.startsWith('http') ? w : `https://${w}`, label: safeLinkLabel(w, 'Website'), Icon: Globe });
  }
  for (const l of account.links || []) {
    if (!l.url) continue;
    const raw = l.url.trim();
    const href = raw.startsWith('http') ? raw : `https://${raw}`;
    const label = l.displayText || l.title || safeLinkLabel(raw, 'Link');
    displayLinks.push({ url: href, label, Icon: linkIcon(raw) });
  }

  const defaultHighlightPlaceholders = [
    { icon: Briefcase, label: 'Work' },
    { icon: Code2, label: 'Projects' },
    { icon: Users, label: 'Team' },
    { icon: Presentation, label: 'Talks' },
  ];

  return (
    <div className="-mx-4 -mt-3 max-w-[428px] mx-auto min-h-full bg-black pb-28 text-[#e0e0e0] shadow-[0_0_30px_rgba(0,0,0,0.6)]">
      <header className="px-4 pt-5">
        <div className="mb-5 flex items-center justify-between">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#e0e0e0] transition-colors hover:bg-[#1a1a1a]"
            aria-label="Back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <Link
            to="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#e0e0e0] transition-colors hover:bg-[#1a1a1a]"
            aria-label="Menu"
          >
            <MoreHorizontal className="h-6 w-6" />
          </Link>
        </div>

        <div className="mb-5 flex items-center gap-6">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-[88px] w-[88px] shrink-0 rounded-full border-2 object-cover"
              style={{ borderColor: ACCENT }}
            />
          ) : (
            <div
              className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-2 border-dashed text-lg font-bold text-[#666]"
              style={{ borderColor: ACCENT }}
            >
              {(account.displayName || account.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1 text-center">
            <div>
              <div className="text-[1.05rem] font-bold leading-tight">{formatCount(postsCount)}</div>
              <div className="text-[0.65rem] font-normal text-[#a0a0a0]">posts</div>
            </div>
            <div>
              <div className="text-[1.05rem] font-bold leading-tight">{formatCount(followersCount)}</div>
              <div className="text-[0.65rem] font-normal text-[#a0a0a0]">followers</div>
            </div>
            <div>
              <div className="text-[1.05rem] font-bold leading-tight">{formatCount(followingCount)}</div>
              <div className="text-[0.65rem] font-normal text-[#a0a0a0]">following</div>
            </div>
            <div>
              <div className="text-[1.05rem] font-bold leading-tight">{reelsCount >= 30 ? '30+' : formatCount(reelsCount)}</div>
              <div className="text-[0.65rem] font-normal text-[#a0a0a0]">reels</div>
            </div>
          </div>
        </div>

        {!isJob && (
          <div className="mb-3 rounded-xl border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-200">
            Switch to a Job account type for the full recruiter experience. You can still edit your professional fields
            below.
          </div>
        )}

        <div className="mb-1 flex flex-wrap items-center gap-2 text-[1.35rem] font-bold leading-tight">
          <span>{account.displayName || account.username}</span>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-medium text-white"
            style={{ background: ACCENT }}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Job Account
          </span>
        </div>
        <div className="mb-1 text-[0.9rem] text-[#a0a0a0]">@{account.username}</div>
        <div className="mb-2 text-[0.9rem] font-medium text-[#c0c0c0]">{headline}</div>
        {account.bio ? <div className="mb-3 whitespace-pre-line text-[0.9rem]">{account.bio}</div> : null}

        {displayLinks.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-x-3.5 gap-y-2">
            {displayLinks.map((l) => (
              <a
                key={l.url + l.label}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-[#2684FF]"
              >
                <l.Icon className="h-3.5 w-3.5 shrink-0" />
                {l.label}
              </a>
            ))}
          </div>
        )}

        <div className="mb-6 flex gap-3">
          <Link
            to="/job/profile/edit"
            className="flex-1 rounded-[10px] py-2 text-center text-[0.85rem] font-semibold text-white"
            style={{ background: JOB_PRIMARY }}
          >
            Edit profile
          </Link>
          <button
            type="button"
            className="flex-1 rounded-[10px] border border-[#3a3a3a] py-2 text-[0.85rem] font-medium text-[#e0e0e0]"
            onClick={() => void shareProfile()}
          >
            Share profile
          </button>
          <Link
            to="/profile"
            className="flex-1 rounded-[10px] border border-[#3a3a3a] py-2 text-center text-[0.85rem] font-medium text-[#e0e0e0]"
          >
            Social profile
          </Link>
        </div>
      </header>

      <div className="mb-5 flex justify-center gap-3 px-4">
        <button
          type="button"
          className={`rounded-full border px-6 py-2.5 text-[0.85rem] font-semibold transition-colors ${
            viewMode === 'social' ? 'border-transparent text-white' : 'border-[#6a11cb] bg-[#2a2a2a] text-[#e0e0e0]'
          }`}
          style={viewMode === 'social' ? { background: ACCENT, borderColor: ACCENT } : undefined}
          onClick={() => setViewMode('social')}
        >
          Social
        </button>
        <button
          type="button"
          className={`rounded-full border px-6 py-2.5 text-[0.85rem] font-semibold transition-colors ${
            viewMode === 'recruiters' ? 'border-transparent text-white' : 'border-[#6a11cb] bg-[#2a2a2a] text-[#e0e0e0]'
          }`}
          style={viewMode === 'recruiters' ? { background: ACCENT, borderColor: ACCENT } : undefined}
          onClick={() => setViewMode('recruiters')}
        >
          Recruiters
        </button>
      </div>

      {viewMode === 'social' && (
        <div>
          <div className="mb-4 flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-thin">
            {highlights.length === 0
              ? defaultHighlightPlaceholders.map(({ icon: Icon, label }) => (
                  <Link key={label} to="/stories/archive" className="w-[70px] shrink-0 text-center">
                    <div className="mx-auto mb-1.5 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#d62976] to-[#962fbf] p-[3px]">
                      <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#121212] text-[#e0e0e0]">
                        <Icon className="h-6 w-6 opacity-80" />
                      </div>
                    </div>
                    <span className="text-[11px] text-[#a0a0a0]">{label}</span>
                  </Link>
                ))
              : highlights.map((h) => (
                  <Link key={h.id} to={`/highlights/${h.id}`} className="w-[70px] shrink-0 text-center">
                    <div className="mx-auto mb-1.5 flex h-[66px] w-[66px] items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#d62976] to-[#962fbf] p-[3px]">
                      <div className="h-[60px] w-[60px] overflow-hidden rounded-full bg-[#121212]">
                        {highlightCover(h) ? (
                          <img src={highlightCover(h)} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#888]">★</div>
                        )}
                      </div>
                    </div>
                    <span className="line-clamp-2 text-[11px] text-[#e0e0e0]">{h.name || 'Highlight'}</span>
                  </Link>
                ))}
          </div>

          <div className="mt-2 flex border-t border-[#2a2a2a]">
            {(['posts', 'reels', 'tagged'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`flex-1 py-3 text-[0.8rem] font-semibold capitalize transition-colors ${
                  gridTab === tab ? 'border-b-2 text-[#2684FF]' : 'border-b-2 border-transparent text-[#a0a0a0]'
                }`}
                style={gridTab === tab ? { borderBottomColor: '#2684FF' } : undefined}
                onClick={() => setGridTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-0.5 grid grid-cols-3 gap-0.5">
            {gridTab === 'posts' &&
              posts.map((p) => {
                const src = ensureAbsoluteMediaUrl(getFirstMediaUrl(p));
                return (
                  <Link key={p.id} to={`/post/${p.id}`} className="relative aspect-square overflow-hidden bg-[#1e1e1e]">
                    {src ? (
                      <img src={src} className="h-full w-full object-cover transition-transform hover:scale-[1.02]" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#555]">—</div>
                    )}
                  </Link>
                );
              })}
            {gridTab === 'reels' &&
              reels.map((r) => {
                const src = ensureAbsoluteMediaUrl(r.thumbnail || r.video || '');
                return (
                  <Link key={r.id} to="/reels" className="relative aspect-square overflow-hidden bg-[#1e1e1e]">
                    {src ? (
                      <img src={src} className="h-full w-full object-cover transition-transform hover:scale-[1.02]" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#555]">▶</div>
                    )}
                    <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.7rem] text-white">
                      <Play className="h-3 w-3 fill-white" />
                      {r.likeCount != null ? formatCount(r.likeCount) : '—'}
                    </div>
                  </Link>
                );
              })}
            {gridTab === 'tagged' &&
              tagged.map((p) => {
                const src = ensureAbsoluteMediaUrl(getFirstMediaUrl(p));
                return (
                  <Link key={p.id} to={`/post/${p.id}`} className="relative aspect-square overflow-hidden bg-[#1e1e1e]">
                    {src ? (
                      <img src={src} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#555]">—</div>
                    )}
                    <div className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.7rem] text-white">
                      <Tag className="inline h-3 w-3" />
                    </div>
                  </Link>
                );
              })}
          </div>
          {gridTab === 'posts' && posts.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[#737373]">No posts yet.</p>
          )}
          {gridTab === 'reels' && reels.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[#737373]">No reels yet.</p>
          )}
          {gridTab === 'tagged' && tagged.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-[#737373]">No tagged posts yet.</p>
          )}
        </div>
      )}

      {viewMode === 'recruiters' && (
        <div className="space-y-4 px-0 pb-6">
          <section className="mx-4 rounded-[20px] border border-[#2a2a2a] bg-[#121212] p-5">
            <div className="mb-4 flex items-center justify-between border-l-4 pl-3" style={{ borderColor: ACCENT }}>
              <h2 className="text-lg font-semibold">Experience</h2>
              <Link to="/job/profile/edit" className="text-[#a0a0a0]" aria-label="Edit experience">
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
            {experience.length === 0 ? (
              <p className="text-sm text-[#737373]">
                Add roles in <span className="text-[#2684FF]">Job profile → Professional section (JSON)</span> or set your
                headline above.
              </p>
            ) : (
              experience.map((ex, i) => (
                <div key={i} className="mb-5 flex gap-3.5 last:mb-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e1e1e] text-xl" style={{ color: ACCENT }}>
                    {i === 0 ? <Building2 className="h-6 w-6" /> : <Rocket className="h-6 w-6" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[#f0f0f0]">{ex.title || ex.role || 'Role'}</h4>
                    <div className="text-sm text-[#a0a0a0]">{[ex.company, ex.employmentType].filter(Boolean).join(' · ')}</div>
                    <div className="text-xs text-[#888]">{[ex.start, ex.end].filter(Boolean).join(' – ')}</div>
                    {ex.description ? <p className="mt-1 text-sm text-[#c0c0c0]">{ex.description}</p> : null}
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="mx-4 rounded-[20px] border border-[#2a2a2a] bg-[#121212] p-5">
            <div className="mb-4 flex items-center justify-between border-l-4 pl-3" style={{ borderColor: ACCENT }}>
              <h2 className="text-lg font-semibold">Skills</h2>
              <Link to="/job/profile/edit" aria-label="Edit skills">
                <Plus className="h-4 w-4 text-[#a0a0a0]" />
              </Link>
            </div>
            <div className="mb-2 flex flex-wrap gap-2.5">
              {(account.skills || []).length === 0 ? (
                <span className="text-sm text-[#737373]">Add skills in Job profile edit.</span>
              ) : (
                account.skills!.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-2 rounded-full border border-[#3a3a3a] bg-[#1e1e1e] px-3.5 py-1.5 text-[0.8rem]"
                  >
                    {s}
                  </span>
                ))
              )}
            </div>
            <div className="text-[0.7rem] text-[#a0a0a0]">Endorsements can be added when the API is enabled.</div>
          </section>

          <section className="mx-4 rounded-[20px] border border-[#2a2a2a] bg-[#121212] p-5">
            <div className="mb-4 flex items-center justify-between border-l-4 pl-3" style={{ borderColor: ACCENT }}>
              <h2 className="text-lg font-semibold">Certifications</h2>
              <Link to="/job/profile/edit" className="text-[#a0a0a0]">
                <Pencil className="h-4 w-4" />
              </Link>
            </div>
            {certifications.length === 0 ? (
              <p className="text-sm text-[#737373]">List certifications in professional section JSON.</p>
            ) : (
              certifications.map((c, i) => (
                <div key={i} className={i > 0 ? 'mt-2.5' : ''}>
                  <CheckCircle2 className="mr-1 inline h-4 w-4 text-emerald-500" />
                  <span className="text-sm">{c.name || 'Certification'}</span>
                </div>
              ))
            )}
          </section>

          <section className="mx-4 rounded-[20px] border border-[#2a2a2a] bg-[#121212] p-5">
            <div className="mb-4 flex items-center justify-between border-l-4 pl-3" style={{ borderColor: ACCENT }}>
              <h2 className="text-lg font-semibold">Portfolio</h2>
              <Link to="/create/post" className="text-[#a0a0a0]">
                <Plus className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              {portfolioItems.length > 0
                ? portfolioItems.map((item, idx) => {
                    const src = ensureAbsoluteMediaUrl(item.thumbnailUrl || item.url || '');
                    const href = item.url?.trim() || '';
                    const isExternal = href.startsWith('http');
                    const inner = src ? (
                      <img src={src} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#1e1e1e] text-[#555]">+</div>
                    );
                    return isExternal ? (
                      <a
                        key={`pf-${idx}`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square overflow-hidden bg-[#1e1e1e]"
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link key={`pf-${idx}`} to="/create/post" className="relative aspect-square overflow-hidden bg-[#1e1e1e]">
                        {inner}
                      </Link>
                    );
                  })
                : posts.slice(0, 5).map((p) => {
                    const src = ensureAbsoluteMediaUrl(getFirstMediaUrl(p));
                    return (
                      <Link key={p.id} to={`/post/${p.id}`} className="relative aspect-square overflow-hidden bg-[#1e1e1e]">
                        {src ? (
                          <img src={src} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[#555]">—</div>
                        )}
                      </Link>
                    );
                  })}
              <Link
                to="/create/post"
                className="flex aspect-square items-center justify-center bg-[#1e1e1e] text-3xl"
                style={{ color: ACCENT }}
              >
                <Plus className="h-8 w-8" />
              </Link>
            </div>
          </section>

          <section className="mx-4 rounded-[20px] border border-[#2a2a2a] bg-[#121212] p-5">
            <div className="mb-4 border-l-4 pl-3" style={{ borderColor: ACCENT }}>
              <h2 className="text-lg font-semibold">Recent activity (Job tools)</h2>
            </div>
            {activity.length === 0 ? (
              <p className="text-sm text-[#737373]">Complete work in Track, Know, or Recruiter to see activity here.</p>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="flex items-center gap-3 border-b border-[#2a2a2a] py-3 last:border-0">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e1e1e]"
                    style={{ color: ACCENT }}
                  >
                    {a.icon === 'know' ? <Presentation className="h-5 w-5" /> : <Briefcase className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1 text-sm text-[#e0e0e0]">{a.text}</div>
                  <div className="shrink-0 text-[11px] text-[#737373]">{a.time}</div>
                </div>
              ))
            )}
          </section>

          <section className="mx-4 rounded-[20px] border border-[#2a2a2a] bg-[#121212] p-5">
            <div className="mb-4 flex items-center justify-between border-l-4 pl-3" style={{ borderColor: ACCENT }}>
              <h2 className="text-lg font-semibold">Recommendations</h2>
              <Link to="/job/profile/edit" className="text-[#a0a0a0]">
                <Plus className="h-4 w-4" />
              </Link>
            </div>
            {recommendations.length === 0 ? (
              <p className="text-sm text-[#737373]">Add recommendations in professional section JSON.</p>
            ) : (
              recommendations.map((r, i) => (
                <div key={i} className="border-b border-[#2a2a2a] py-3 last:border-0">
                  <p className="text-[0.85rem] italic text-[#d0d0d0]">
                    <Quote className="mr-1 inline h-4 w-4 opacity-60" style={{ color: ACCENT }} />
                    {r.text}
                  </p>
                  <p className="mt-1.5 text-[0.75rem] text-[#a0a0a0]">
                    — {r.author || 'Colleague'}
                    {r.authorTitle ? `, ${r.authorTitle}` : ''}
                  </p>
                </div>
              ))
            )}
          </section>

          <div
            className="mx-4 rounded-[20px] border p-5 text-center"
            style={{ borderColor: ACCENT, background: `${ACCENT}14` }}
          >
            <Briefcase className="mx-auto mb-2 h-8 w-8 opacity-90" style={{ color: ACCENT }} />
            <h3 className="text-base font-semibold text-[#f0f0f0]">Open to opportunities</h3>
            <p className="mt-1 text-sm text-[#a0a0a0]">
              {account.openToOpportunities
                ? 'You are visible as open to new roles. Recruiters can use the button below if you added a contact email.'
                : 'Turn on “Open to opportunities” in Job profile edit to signal availability.'}
            </p>
            <button
              type="button"
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
              style={{ background: JOB_PRIMARY }}
              onClick={contactRecruiter}
            >
              <Mail className="h-4 w-4" />
              Contact (email)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
