import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader } from '../../components/ui/Themed';
import { ACCENT } from '../../constants/designSystem';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type SubscriberRow = {
  id: string;
  tier: string;
  price: number;
  status: string;
  subscriber?: { id: string; username: string | null; displayName: string | null };
};

type BonusRow = {
  id: string;
  month: string;
  targetViews: number;
  actualViews: number;
  bonusAmount: number;
  status: string;
};

type Template = { id: string; shortcut: string; body: string; category?: string | null };
type AutoRule = { id: string; type: string; trigger: string | null; message: string; isActive: boolean; priority: number };
type CalendarItem = { id: string; type: string; at: string; isScheduled?: boolean };
type Connection = { id: string; status: string; incoming: boolean; other: { id: string; username: string; displayName: string | null }; createdAt: string };
type CampaignApp = { id: string; campaign?: { id: string; title: string; status: string }; createdAt: string };
type ContentIdea = { format: string; topic: string; description: string };
type TrendingItem = { id: string; title?: string; artist?: string; genre?: string; usageCount?: number };

export default function CreatorStudio() {
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [tiers, setTiers] = useState<{ key: string; name?: string; price?: number }[]>([]);
  const [quickReplies, setQuickReplies] = useState<Template[]>([]);
  const [autoResponses, setAutoResponses] = useState<AutoRule[]>([]);
  const [calendar, setCalendar] = useState<{ month: string; posts: CalendarItem[]; reels: CalendarItem[]; drafts: CalendarItem[] } | null>(null);
  const [bestTime, setBestTime] = useState<{ recommended: { hour: number; label: string }[] } | null>(null);
  const [contentIdeas, setContentIdeas] = useState<{ ideas: ContentIdea[]; category: string } | null>(null);
  const [trendingAudio, setTrendingAudio] = useState<TrendingItem[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [campaignApps, setCampaignApps] = useState<CampaignApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'subscriptions' | 'content' | 'collab' | 'inbox'>('overview');
  const [badgesEnabled, setBadgesEnabled] = useState(false);
  const [giftsEnabled, setGiftsEnabled] = useState(false);
  const [liveMonetizationSaving, setLiveMonetizationSaving] = useState(false);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    const h = headers();
    Promise.all([
      fetch(`${API_BASE}/accounts/me`, { headers: h }).then((r) => r.ok ? r.json() : null),
      fetch(`${API_BASE}/accounts/me/subscribers`, { headers: h }).then((r) => r.json()),
      fetch(`${API_BASE}/creator/bonuses`, { headers: h }).then((r) => r.json()),
      fetch(`${API_BASE}/accounts/me/subscription-tiers`, { headers: h }).then((r) => r.ok ? r.json() : { tiers: [] }).catch(() => ({ tiers: [] })),
      fetch(`${API_BASE}/creator/quick-replies`, { headers: h }).then((r) => r.ok ? r.json() : { templates: [] }).catch(() => ({ templates: [] })),
      fetch(`${API_BASE}/creator/auto-responses`, { headers: h }).then((r) => r.ok ? r.json() : { rules: [] }).catch(() => ({ rules: [] })),
      fetch(`${API_BASE}/creator/content-calendar`, { headers: h }).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/creator/best-time`, { headers: h }).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/creator/content-ideas`, { headers: h }).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/creator/trending-audio?limit=5`, { headers: h }).then((r) => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/creator/network`, { headers: h }).then((r) => r.ok ? r.json() : { connections: [] }).catch(() => ({ connections: [] })),
      fetch(`${API_BASE}/creator/campaign-applications`, { headers: h }).then((r) => r.ok ? r.json() : { applications: [] }).catch(() => ({ applications: [] })),
    ])
      .then(([meData, subData, bonusData, tierData, qrData, arData, calData, btData, ideasData, audioData, netData, appData]) => {
        const acc = meData?.account ?? meData;
        if (acc) {
          setBadgesEnabled(!!acc.badgesEnabled);
          setGiftsEnabled(!!acc.giftsEnabled);
        }
        setSubscribers(Array.isArray(subData?.subscribers) ? subData.subscribers : []);
        setBonuses(Array.isArray(bonusData?.bonuses) ? bonusData.bonuses : []);
        setTiers(Array.isArray(tierData?.tiers) ? tierData.tiers : []);
        setQuickReplies(Array.isArray(qrData?.templates) ? qrData.templates : []);
        setAutoResponses(Array.isArray(arData?.rules) ? arData.rules : []);
        setCalendar(calData && calData.month != null ? calData : null);
        setBestTime(btData && btData.recommended ? btData : null);
        setContentIdeas(ideasData && ideasData.ideas ? ideasData : null);
        setTrendingAudio(Array.isArray(audioData?.items) ? audioData.items : []);
        setConnections(Array.isArray(netData?.connections) ? netData.connections : []);
        setCampaignApps(Array.isArray(appData?.applications) ? appData.applications : []);
        setError(null);
      })
      .catch((e) => {
        setError(e?.message ?? 'Failed to load');
      })
      .finally(() => setLoading(false));
  }, []);

  const subscriptionRevenue = subscribers.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const totalBonuses = bonuses.reduce((sum, b) => sum + (Number(b.bonusAmount) || 0), 0);

  const sectionNav = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'subscriptions' as const, label: 'Supporters' },
    { id: 'content' as const, label: 'Content tools' },
    { id: 'collab' as const, label: 'Collaboration' },
    { id: 'inbox' as const, label: 'Inbox tools' },
  ];

  const creatorAccent = ACCENT.creator; // #FFD700 gold

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader title="Creator Studio" className="border-b border-[#262626]" />
      <div className="flex-1 overflow-auto px-4 py-4 space-y-4">
        {/* Creator: Supporters + Analytics (all free) */}
        <section className="rounded-xl border border-[#363636] p-4 bg-[#262626]" style={{ borderLeftColor: creatorAccent, borderLeftWidth: 4 }}>
          <ThemedText className="font-semibold mb-2" style={{ color: creatorAccent }}>Creator</ThemedText>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-2 rounded-lg text-sm font-medium text-black" style={{ backgroundColor: creatorAccent }}>
              Supporters
            </span>
            <Link to="/analytics" className="px-3 py-2 rounded-lg text-sm font-medium bg-[#363636] border border-[#363636] text-white">
              Analytics
            </Link>
            <Link to="/ads/tools" className="px-3 py-2 rounded-lg text-sm font-medium bg-[#363636] border border-[#363636] text-white">
              Ad tools
            </Link>
          </div>
        </section>

        <nav className="flex flex-wrap gap-2 border-b border-[#262626] pb-2">
          {sectionNav.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                activeSection === s.id
                  ? 'text-black'
                  : 'bg-[#262626] border border-[#363636] text-white'
              }`}
              style={activeSection === s.id ? { backgroundColor: creatorAccent } : undefined}
            >
              {s.label}
            </button>
          ))}
        </nav>

        {loading && <ThemedText secondary>Loading…</ThemedText>}
        {error && <ThemedText className="text-red-500">{error}</ThemedText>}

        {!loading && !error && (
          <>
            {(activeSection === 'overview' || activeSection === 'subscriptions') && (
              <section className="space-y-4">
                <ThemedText className="font-semibold text-moxe-body">Earnings &amp; subscribers</ThemedText>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-moxe-md border border-moxe-border bg-moxe-surface">
                    <ThemedText secondary className="text-sm">Subscribers</ThemedText>
                    <ThemedText className="text-xl font-semibold mt-1">{subscribers.length}</ThemedText>
                  </div>
                  <div className="p-4 rounded-moxe-md border border-moxe-border bg-moxe-surface">
                    <ThemedText secondary className="text-sm">Monthly supporter revenue</ThemedText>
                    <ThemedText className="text-xl font-semibold mt-1">${subscriptionRevenue.toFixed(2)}</ThemedText>
                  </div>
                  <div className="p-4 rounded-moxe-md border border-moxe-border bg-moxe-surface">
                    <ThemedText secondary className="text-sm">Reel bonuses (total)</ThemedText>
                    <ThemedText className="text-xl font-semibold mt-1">${totalBonuses.toFixed(2)}</ThemedText>
                  </div>
                </div>
                {activeSection === 'overview' && (
                  <div className="rounded-moxe-md border border-moxe-border p-4 bg-moxe-surface space-y-3">
                    <ThemedText className="font-medium">Live monetization</ThemedText>
                    <p className="text-sm text-moxe-caption">Badge and gift analytics are available per live on the Live page.</p>
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span>Allow badges during Live</span>
                      <input
                        type="checkbox"
                        checked={badgesEnabled}
                        disabled={liveMonetizationSaving}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setBadgesEnabled(v);
                          setLiveMonetizationSaving(true);
                          fetch(`${API_BASE}/accounts/me`, {
                            method: 'PATCH',
                            headers: { ...headers(), 'Content-Type': 'application/json' },
                            body: JSON.stringify({ badgesEnabled: v }),
                          })
                            .then((r) => r.ok ? r.json() : null)
                            .finally(() => setLiveMonetizationSaving(false));
                        }}
                        className="w-4 h-4 rounded border-moxe-border"
                      />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span>Allow gifts during Live</span>
                      <input
                        type="checkbox"
                        checked={giftsEnabled}
                        disabled={liveMonetizationSaving}
                        onChange={(e) => {
                          const v = e.target.checked;
                          setGiftsEnabled(v);
                          setLiveMonetizationSaving(true);
                          fetch(`${API_BASE}/accounts/me`, {
                            method: 'PATCH',
                            headers: { ...headers(), 'Content-Type': 'application/json' },
                            body: JSON.stringify({ giftsEnabled: v }),
                          })
                            .then((r) => r.ok ? r.json() : null)
                            .finally(() => setLiveMonetizationSaving(false));
                        }}
                        className="w-4 h-4 rounded border-moxe-border"
                      />
                    </label>
                    <Link to="/live" className="text-sm font-medium" style={{ color: creatorAccent }}>Go to Live →</Link>
                  </div>
                )}
                {activeSection === 'subscriptions' && (
                  <>
                    {tiers.length > 0 && (
                      <div>
                        <ThemedText className="font-medium mb-2">Support tiers</ThemedText>
                        <ul className="space-y-1">
                          {tiers.map((t) => (
                            <li key={t.key} className="text-sm">
                              {t.name || t.key} · ${Number(t.price || 0).toFixed(2)}/mo
                            </li>
                          ))}
                        </ul>
                        <Link to="/creator-studio/subscription-tiers" className="text-sm mt-2 inline-block font-medium" style={{ color: creatorAccent }}>Manage support tiers</Link>
                      </div>
                    )}
                    <p className="text-sm text-moxe-caption">
                      <button
                        type="button"
                        onClick={() => {
                          fetch(`${API_BASE}/accounts/me/subscribers/export`, { headers: headers() })
                            .then((r) => r.text())
                            .then((csv) => {
                              const a = document.createElement('a');
                              a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                              a.download = 'subscribers.csv';
                              a.click();
                              URL.revokeObjectURL(a.href);
                            })
                            .catch(() => {});
                        }}
                        className="text-moxe-primary underline"
                      >
                        Export subscribers (CSV)
                      </button>
                    </p>
                    {subscribers.length > 0 && (
                      <div>
                        <ThemedText className="font-medium mb-2">Active subscribers ({subscribers.length})</ThemedText>
                        <ul className="space-y-1.5">
                          {subscribers.slice(0, 10).map((s) => (
                            <li key={s.id} className="flex justify-between items-center py-1.5 px-2 rounded bg-moxe-surface border border-moxe-border">
                              <ThemedText>{s.subscriber?.displayName ?? s.subscriber?.username ?? 'Subscriber'}</ThemedText>
                              <ThemedText secondary>${Number(s.price).toFixed(2)}/mo · {s.tier}</ThemedText>
                            </li>
                          ))}
                        </ul>
                        {subscribers.length > 10 && <ThemedText secondary className="text-sm">+{subscribers.length - 10} more</ThemedText>}
                      </div>
                    )}
                  </>
                )}
                {bonuses.length > 0 && activeSection === 'overview' && (
                  <div>
                    <ThemedText className="font-medium mb-2">Reel bonuses</ThemedText>
                    <div className="rounded-moxe-md border border-moxe-border overflow-hidden text-sm">
                      <table className="w-full">
                        <thead className="bg-moxe-surface border-b border-moxe-border">
                          <tr>
                            <th className="p-2 text-left text-moxe-caption">Month</th>
                            <th className="p-2 text-left text-moxe-caption">Views</th>
                            <th className="p-2 text-left text-moxe-caption">Amount</th>
                            <th className="p-2 text-left text-moxe-caption">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bonuses.slice(0, 5).map((b) => (
                            <tr key={b.id} className="border-b border-moxe-border/60">
                              <td className="p-2">{b.month}</td>
                              <td className="p-2">{b.actualViews} / {b.targetViews}</td>
                              <td className="p-2">${Number(b.bonusAmount).toFixed(2)}</td>
                              <td className="p-2">{b.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeSection === 'content' && (
              <section className="space-y-4">
                <ThemedText className="font-semibold text-moxe-body">Content tools</ThemedText>
                {contentIdeas && (
                  <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                    <ThemedText className="font-medium mb-2">Content ideas ({contentIdeas.category})</ThemedText>
                    <ul className="space-y-1.5 text-sm">
                      {contentIdeas.ideas.map((i, idx) => (
                        <li key={idx}><span className="text-moxe-caption">{i.format}:</span> {i.topic} — {i.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {bestTime && bestTime.recommended?.length > 0 && (
                  <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                    <ThemedText className="font-medium mb-2">Best time to post</ThemedText>
                    <p className="text-sm text-moxe-caption">Peak hours (UTC): {bestTime.recommended.map((r) => r.label).join(', ')}</p>
                  </div>
                )}
                {calendar && (
                  <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                    <ThemedText className="font-medium mb-2">Content calendar ({calendar.month || 'This month'})</ThemedText>
                    <p className="text-sm">Posts: {calendar.posts?.length ?? 0}, Reels: {calendar.reels?.length ?? 0}, Drafts: {calendar.drafts?.length ?? 0}</p>
                  </div>
                )}
                {trendingAudio.length > 0 && (
                  <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                    <ThemedText className="font-medium mb-2">Trending audio</ThemedText>
                    <ul className="space-y-1 text-sm">
                      {trendingAudio.map((a) => (
                        <li key={a.id}>{a.title ?? a.artist ?? a.id} {a.usageCount != null && `(${a.usageCount} uses)`}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm text-moxe-caption">Use these when creating posts, reels, and stories. Schedule from Create Post / Create Reel.</p>
              </section>
            )}

            {activeSection === 'collab' && (
              <section className="space-y-4">
                <ThemedText className="font-semibold text-moxe-body">Collaboration</ThemedText>
                <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                  <ThemedText className="font-medium mb-2">Creator network</ThemedText>
                  {connections.length === 0 ? (
                    <ThemedText secondary className="text-sm">No connections yet. Browse and send requests from Explore or creator search.</ThemedText>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {connections.slice(0, 10).map((c) => (
                        <li key={c.id}>
                          {c.other?.displayName ?? c.other?.username} — {c.status}
                          {c.incoming && ' (incoming)'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                  <ThemedText className="font-medium mb-2">Brand campaign applications</ThemedText>
                  {campaignApps.length === 0 ? (
                    <ThemedText secondary className="text-sm">No applications yet. Browse campaigns and apply from Creator Studio or Explore.</ThemedText>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {campaignApps.slice(0, 10).map((a) => (
                        <li key={a.id}>{a.campaign?.title ?? 'Campaign'} — {a.campaign?.status ?? '—'} ({new Date(a.createdAt).toLocaleDateString()})</li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-sm text-moxe-caption">Apply to brand campaigns via GET /creator/campaigns; connect with other creators via /creator/network.</p>
              </section>
            )}

            {activeSection === 'inbox' && (
              <section className="space-y-4">
                <ThemedText className="font-semibold text-moxe-body">Inbox tools</ThemedText>
                <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                  <ThemedText className="font-medium mb-2">Quick replies</ThemedText>
                  {quickReplies.length === 0 ? (
                    <ThemedText secondary className="text-sm">No templates yet. Add shortcuts like /rates in Messages to reply faster.</ThemedText>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {quickReplies.map((t) => (
                        <li key={t.id}><code className="bg-moxe-background px-1 rounded">/{t.shortcut}</code> — {t.body.slice(0, 60)}{t.body.length > 60 ? '…' : ''}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-moxe-md border border-moxe-border p-3 bg-moxe-surface">
                  <ThemedText className="font-medium mb-2">Auto-responses</ThemedText>
                  {autoResponses.length === 0 ? (
                    <ThemedText secondary className="text-sm">No rules yet. Set keyword, first-message, after-hours, or vacation rules.</ThemedText>
                  ) : (
                    <ul className="space-y-1.5 text-sm">
                      {autoResponses.map((r) => (
                        <li key={r.id}>{r.type}{r.trigger ? ` "${r.trigger}"` : ''} — {r.isActive ? 'On' : 'Off'}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-sm text-moxe-caption">Manage quick replies and auto-responses via Creator API; full UI can be added in Settings or Messages.</p>
              </section>
            )}
          </>
        )}

        <div className="pt-4 border-t border-moxe-border">
          <ThemedText secondary className="text-sm">
            Creator profile (category, contact, action buttons): <Link to="/settings/account" className="text-moxe-primary">Account settings</Link>.
            Insights: <Link to="/analytics" className="text-moxe-primary">Analytics</Link>. Live: <Link to="/live" className="text-moxe-primary">Live</Link>.
          </ThemedText>
        </div>
      </div>
    </ThemedView>
  );
}
