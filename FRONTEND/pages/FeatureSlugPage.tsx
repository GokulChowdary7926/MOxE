import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChevronRight } from 'lucide-react';
import { ThemedView, ThemedText } from '../components/ui/Themed';
import { MobileShell } from '../components/layout/MobileShell';
import { fetchApi } from '../services/api';
import type { RootState } from '../store';
import type { FeatureDefinition, FeatureKey } from '../constants/accountFeatures';

/** Social / product deep links for features we ship in the web app. */
const FEATURE_PATHS: Partial<Record<FeatureKey, string>> = {
  feed: '/',
  posts: '/create',
  stories: '/stories/create',
  reels: '/reels',
  live: '/live',
  dm: '/messages',
  explore: '/explore',
  closeFriends: '/close-friends',
  savedCollections: '/saved',
  scheduledPosts: '/create',
  links: '/profile/edit',
  commerce: '/commerce',
  subscriptions: '/settings/subscription',
  badgesGifts: '/insights/gifts',
  businessHours: '/profile/edit',
  actionButtons: '/profile/edit',
  analytics: '/insights',
  track: '/job/overview/home',
  know: '/job/know',
  flow: '/job/flow',
  dualProfile: '/settings/account-type',
  jobFeed: '/job/overview/home',
  networking: '/explore',
  liveTranslation: '/settings/language',
};

function normalizeSlug(s: string): string {
  return decodeURIComponent(s)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function slugMatchesFeatureKey(slugNorm: string, key: string): boolean {
  const kebab = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2');
  return slugNorm === normalizeSlug(kebab) || slugNorm === normalizeSlug(key);
}

export default function FeatureSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const currentAccount = useSelector((s: RootState) => s.account.currentAccount) as {
    accountType?: string;
  } | null;
  const accountType = String(currentAccount?.accountType || 'PERSONAL').toUpperCase();

  const [basic, setBasic] = useState<FeatureDefinition[]>([]);
  const [extra, setExtra] = useState<FeatureDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchApi('features/basic')
        .then((r) => r.json().catch(() => ({})))
        .then((d: { features?: FeatureDefinition[] }) => (Array.isArray(d.features) ? d.features : [])),
      fetchApi(`features/account/${encodeURIComponent(accountType)}`, { skipAuth: true })
        .then((r) => (r.ok ? r.json().catch(() => ({})) : {}))
        .then((d: { features?: FeatureDefinition[] }) => (Array.isArray(d.features) ? d.features : [])),
    ])
      .then(([b, e]) => {
        if (!cancelled) {
          setBasic(b);
          setExtra(e);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBasic([]);
          setExtra([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountType]);

  const slugNorm = useMemo(() => (slug ? normalizeSlug(slug) : ''), [slug]);

  const match = useMemo(() => {
    const all = [...basic, ...extra];
    return all.find((f) => slugMatchesFeatureKey(slugNorm, f.key)) ?? null;
  }, [basic, extra, slugNorm]);

  if (!slug) {
    return <Navigate to="/coming-soon/feature" replace />;
  }

  if (!loading && !match) {
    return <Navigate to={`/coming-soon/${encodeURIComponent(slug)}`} replace />;
  }

  const openPath = match ? FEATURE_PATHS[match.key as FeatureKey] : undefined;

  return (
    <ThemedView className="min-h-screen bg-black text-white">
      <MobileShell>
        <header className="flex items-center px-4 py-3 border-b border-[#262626] safe-area-pt">
          <Link to="/settings" className="text-[#0095f6] text-sm font-medium">
            Close
          </Link>
          <h1 className="flex-1 text-center font-semibold text-base truncate px-2">
            {loading ? '…' : match?.name ?? 'Feature'}
          </h1>
          <div className="w-14" />
        </header>

        <div className="px-4 py-6 space-y-4">
          {loading ? (
            <ThemedText secondary className="text-sm">
              Loading…
            </ThemedText>
          ) : match ? (
            <>
              <p className="text-[#a8a8a8] text-sm leading-relaxed">{match.description}</p>
              {openPath ? (
                <Link
                  to={openPath}
                  className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#121212] px-4 py-3 text-[#0095f6] font-semibold text-sm"
                >
                  Open in MOxE
                  <ChevronRight className="w-5 h-5" />
                </Link>
              ) : (
                <ThemedText secondary className="text-xs">
                  This capability is available on your account; use the main navigation to reach it.
                </ThemedText>
              )}
              <p className="text-[#71767b] text-xs pt-4">
                Feature key: <span className="font-mono text-[#a8a8a8]">{match.key}</span>
              </p>
            </>
          ) : null}
        </div>
      </MobileShell>
    </ThemedView>
  );
}
