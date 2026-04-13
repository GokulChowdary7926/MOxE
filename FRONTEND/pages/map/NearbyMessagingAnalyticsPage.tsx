import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, Eye, MessageSquare, AtSign, ImageIcon } from 'lucide-react';
import { ThemedView, ThemedText } from '../../components/ui/Themed';
import { MobileShell } from '../../components/layout/MobileShell';
import { fetchApi, getToken } from '../../services/api';

type NearbyAnalyticsApi = {
  periodDays?: number;
  nearbyImpressions?: number;
  nearbyMessagesSent?: number;
  usage?: {
    textRemaining?: number;
    textFreeLimit?: number;
    mediaRemaining?: number;
    mediaFreeLimit?: number;
    chargesThisMonth?: number;
  };
};

/**
 * Nearby messaging — metrics from `GET /api/location/nearby-analytics` (usage + analytics events).
 */
export default function NearbyMessagingAnalyticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<NearbyAnalyticsApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchApi('location/nearby-analytics?days=7')
      .then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((body as { error?: string }).error || 'Could not load analytics');
        if (!cancelled) setData(body as NearbyAnalyticsApi);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load analytics');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const days = data?.periodDays ?? 7;
  const impressions = data?.nearbyImpressions ?? 0;
  const sent = data?.nearbyMessagesSent ?? 0;
  const textLeft = data?.usage?.textRemaining ?? '—';
  const photoLeft = data?.usage?.mediaRemaining ?? '—';
  const charges = data?.usage?.chargesThisMonth;

  return (
    <ThemedView className="min-h-screen flex flex-col bg-black pb-20">
      <MobileShell>
        <header className="sticky top-0 z-10 flex items-center h-12 px-3 border-b border-[#262626] bg-black safe-area-pt">
          <button type="button" onClick={() => navigate(-1)} className="p-2 -m-2 text-white" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center justify-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1d9bf0]" />
            <span className="text-white font-semibold text-base">Analytics</span>
          </div>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
          <ThemedText secondary className="text-sm">
            Live counts for Nearby in the last {days} days (plus today&apos;s free message quotas).
          </ThemedText>

          {loading && <p className="text-sm text-[#737373]">Loading…</p>}
          {error && <p className="text-sm text-[#f4212e]">{error}</p>}

          {!loading && !error && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[#2f2f2f] bg-[#16181c] p-4">
                <Eye className="w-5 h-5 text-[#1d9bf0] mb-2" />
                <div className="text-2xl font-bold text-white">{impressions.toLocaleString()}</div>
                <div className="text-[11px] text-[#a8a8a8] mt-0.5">Impressions ({days}d)</div>
                <div className="text-[10px] text-[#71767b] mt-1">How often others received your non-anonymous Nearby posts</div>
              </div>
              <div className="rounded-2xl border border-[#2f2f2f] bg-[#16181c] p-4">
                <MessageSquare className="w-5 h-5 text-[#1d9bf0] mb-2" />
                <div className="text-2xl font-bold text-white">{sent.toLocaleString()}</div>
                <div className="text-[11px] text-[#a8a8a8] mt-0.5">Messages sent ({days}d)</div>
                <div className="text-[10px] text-[#71767b] mt-1">Text and photo posts you sent to Nearby</div>
              </div>
              <div className="rounded-2xl border border-[#2f2f2f] bg-[#16181c] p-4">
                <AtSign className="w-5 h-5 text-[#1d9bf0] mb-2" />
                <div className="text-2xl font-bold text-white">{textLeft}</div>
                <div className="text-[11px] text-[#a8a8a8] mt-0.5">Text messages left today</div>
                <div className="text-[10px] text-[#71767b] mt-1">Free tier daily limit</div>
              </div>
              <div className="rounded-2xl border border-[#2f2f2f] bg-[#16181c] p-4">
                <ImageIcon className="w-5 h-5 text-[#1d9bf0] mb-2" />
                <div className="text-2xl font-bold text-white">{photoLeft}</div>
                <div className="text-[11px] text-[#a8a8a8] mt-0.5">Photo posts left today</div>
                <div className="text-[10px] text-[#71767b] mt-1">Free tier daily limit</div>
              </div>
            </div>
          )}

          {charges != null && charges > 0 ? (
            <p className="text-[#a8a8a8] text-xs text-center">
              Approximate extra Nearby charges this month: ${Number(charges).toFixed(2)}
            </p>
          ) : null}

          <p className="text-[#71767b] text-xs text-center pt-2">
            Impressions accrue when other signed-in users receive your non-anonymous Nearby posts.
          </p>
        </div>
      </MobileShell>
    </ThemedView>
  );
}
