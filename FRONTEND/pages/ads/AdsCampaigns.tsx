import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccountCapabilities } from '../../hooks/useAccountCapabilities';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type CampaignMetrics = {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
};

type Campaign = {
  id: string;
  name: string;
  objective: string;
  status: string;
  type: string;
  dailyBudget: number | null;
  totalBudget: number | null;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  destinationUrl?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  metrics: CampaignMetrics;
  attachedAudiences?: { id: string; name: string }[];
};

type Audience = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  definition?: any;
};

type BillingSummary = {
  accountId: string;
  currency: string;
  creditBalance: number;
  monthlySpend: number;
  monthlySpendLimit?: number | null;
  hardLimit: boolean;
};

export default function AdsCampaigns() {
  const cap = useAccountCapabilities();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDailyBudget, setNewDailyBudget] = useState('');
  const [newTotalBudget, setNewTotalBudget] = useState('');
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
  const [newUtmSource, setNewUtmSource] = useState('');
  const [newUtmMedium, setNewUtmMedium] = useState('');
  const [newUtmCampaign, setNewUtmCampaign] = useState('');
  const [newUtmTerm, setNewUtmTerm] = useState('');
  const [newUtmContent, setNewUtmContent] = useState('');

  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audName, setAudName] = useState('');
  const [audDescription, setAudDescription] = useState('');
  const [audDefinition, setAudDefinition] = useState('');
  const [creatingAudience, setCreatingAudience] = useState(false);
  const [attachAudienceByCampaign, setAttachAudienceByCampaign] = useState<Record<string, string>>({});
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [savingCampaignId, setSavingCampaignId] = useState<string | null>(null);
  const [editDrafts, setEditDrafts] = useState<
    Record<
      string,
      {
        destinationUrl: string;
        utmSource: string;
        utmMedium: string;
        utmCampaign: string;
        utmTerm: string;
        utmContent: string;
      }
    >
  >({});

  const canAdvertise = cap.label === 'BUSINESS' || cap.label === 'CREATOR';

  if (!canAdvertise) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Promotions & Ads</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-2">
          Promotions and ad campaigns are available for Business and Creator accounts.
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Switch to a Business or Creator account in settings to unlock ad tools, audience targeting, and billing.
        </p>
        <Link
          to="/settings/account"
          className="inline-flex items-center mt-3 px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-semibold"
        >
          Go to account settings
        </Link>
      </div>
    );
  }

  useEffect(() => {
    if (!canAdvertise) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [campaignRes, audienceRes, billingRes] = await Promise.all([
          fetch(`${API_BASE}/ads/campaigns`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/ads/audiences`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/ads/billing/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const campaignsJson = await campaignRes.json().catch(() => ({}));
        const audiencesJson = await audienceRes.json().catch(() => ({}));
        const billingJson = await billingRes.json().catch(() => ({}));
        if (!campaignRes.ok) {
          throw new Error(campaignsJson.error || 'Failed to load campaigns');
        }
        if (!audienceRes.ok) {
          throw new Error(audiencesJson.error || 'Failed to load audiences');
        }
        if (billingRes.ok) {
          setBilling(billingJson);
        }
        setCampaigns(campaignsJson.campaigns ?? []);
        setAudiences(audiencesJson.audiences ?? []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [canAdvertise]);

  const topUpCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpAmount.trim()) return;
    const amount = Number(topUpAmount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid positive amount');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in');
      return;
    }
    try {
      setBillingLoading(true);
      const res = await fetch(`${API_BASE}/ads/billing/top-up`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to top up credits');
      }
      const summaryRes = await fetch(`${API_BASE}/ads/billing/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summaryJson = await summaryRes.json().catch(() => ({}));
      if (summaryRes.ok) {
        setBilling(summaryJson);
      }
      setTopUpAmount('');
    } catch (e: any) {
      setError(e?.message || 'Failed to top up credits');
    } finally {
      setBillingLoading(false);
    }
  };

  const createAudience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audName.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in');
      return;
    }
    try {
      setCreatingAudience(true);
      let parsedDefinition: any | undefined;
      if (audDefinition.trim()) {
        try {
          parsedDefinition = JSON.parse(audDefinition);
        } catch {
          setError('Audience definition must be valid JSON');
          setCreatingAudience(false);
          return;
        }
      }
      const res = await fetch(`${API_BASE}/ads/audiences`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: audName.trim(),
          description: audDescription.trim() || undefined,
          definition: parsedDefinition,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create audience');
      }
      setAudiences((prev) => [data, ...prev]);
      setAudName('');
      setAudDescription('');
      setAudDefinition('');
    } catch (e: any) {
      setError(e?.message || 'Failed to create audience');
    } finally {
      setCreatingAudience(false);
    }
  };

  const attachAudience = async (campaignId: string) => {
    const audienceId = attachAudienceByCampaign[campaignId];
    if (!audienceId) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/ads/campaigns/${campaignId}/audiences/${audienceId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to attach audience');
      }
      setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? data : c)));
    } catch (e: any) {
      setError(e?.message || 'Failed to attach audience');
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in');
      return;
    }
    try {
      setCreating(true);
      const body: any = { name: newName.trim(), objective: 'AWARENESS', type: 'STANDARD' };
      if (newDailyBudget.trim()) body.dailyBudget = Number(newDailyBudget);
      if (newTotalBudget.trim()) body.totalBudget = Number(newTotalBudget);
      if (newDestinationUrl.trim()) body.destinationUrl = newDestinationUrl.trim();
      if (newUtmSource.trim()) body.utmSource = newUtmSource.trim();
      if (newUtmMedium.trim()) body.utmMedium = newUtmMedium.trim();
      if (newUtmCampaign.trim()) body.utmCampaign = newUtmCampaign.trim();
      if (newUtmTerm.trim()) body.utmTerm = newUtmTerm.trim();
      if (newUtmContent.trim()) body.utmContent = newUtmContent.trim();
      const res = await fetch(`${API_BASE}/ads/campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }
      setCampaigns((prev) => [data, ...prev]);
      setNewName('');
      setNewDailyBudget('');
      setNewTotalBudget('');
      setNewDestinationUrl('');
      setNewUtmSource('');
      setNewUtmMedium('');
      setNewUtmCampaign('');
      setNewUtmTerm('');
      setNewUtmContent('');
    } catch (e: any) {
      setError(e?.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const startInlineEdit = (campaign: Campaign) => {
    setEditingCampaignId(campaign.id);
    setEditDrafts((prev) => ({
      ...prev,
      [campaign.id]: {
        destinationUrl: campaign.destinationUrl ?? '',
        utmSource: campaign.utmSource ?? '',
        utmMedium: campaign.utmMedium ?? '',
        utmCampaign: campaign.utmCampaign ?? '',
        utmTerm: campaign.utmTerm ?? '',
        utmContent: campaign.utmContent ?? '',
      },
    }));
  };

  const cancelInlineEdit = () => {
    setEditingCampaignId(null);
  };

  const updateInlineField = (
    campaignId: string,
    field: 'destinationUrl' | 'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmTerm' | 'utmContent',
    value: string,
  ) => {
    setEditDrafts((prev) => ({
      ...prev,
      [campaignId]: {
        destinationUrl: prev[campaignId]?.destinationUrl ?? '',
        utmSource: prev[campaignId]?.utmSource ?? '',
        utmMedium: prev[campaignId]?.utmMedium ?? '',
        utmCampaign: prev[campaignId]?.utmCampaign ?? '',
        utmTerm: prev[campaignId]?.utmTerm ?? '',
        utmContent: prev[campaignId]?.utmContent ?? '',
        [field]: value,
      },
    }));
  };

  const saveInlineEdit = async (campaignId: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not logged in');
      return;
    }
    const draft = editDrafts[campaignId];
    if (!draft) return;
    try {
      setSavingCampaignId(campaignId);
      setError(null);
      const res = await fetch(`${API_BASE}/ads/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          destinationUrl: draft.destinationUrl.trim() || null,
          utmSource: draft.utmSource.trim() || null,
          utmMedium: draft.utmMedium.trim() || null,
          utmCampaign: draft.utmCampaign.trim() || null,
          utmTerm: draft.utmTerm.trim() || null,
          utmContent: draft.utmContent.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update campaign');
      }
      setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? data : c)));
      setEditingCampaignId(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to update campaign');
    } finally {
      setSavingCampaignId(null);
    }
  };

  if (!canAdvertise) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Promotions & Ads</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Ads and promotions are available for Business and Creator accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-2">Promotions & Ads</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Create and monitor ad campaigns and boosted posts.
      </p>

      {billing && (
        <form
          onSubmit={topUpCredits}
          className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <div>
            <h2 className="font-medium text-slate-800 dark:text-white">Billing & ad credits</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Balance:{' '}
              <span className="font-semibold">
                {billing.currency} {billing.creditBalance.toFixed(2)}
              </span>{' '}
              · This month&apos;s ad spend:{' '}
              <span className="font-semibold">
                {billing.currency} {billing.monthlySpend.toFixed(2)}
              </span>
            </p>
            {billing.monthlySpendLimit != null && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Monthly spend limit: {billing.currency} {billing.monthlySpendLimit.toFixed(2)}{' '}
                {billing.hardLimit ? '(hard stop)' : '(soft)'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.01"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Top up amount"
              className="w-32 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={billingLoading || !topUpAmount.trim()}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {billingLoading ? 'Updating…' : 'Add credits'}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={createCampaign} className="mb-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
        <h2 className="font-medium text-slate-800 dark:text-white">Create campaign</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Q3 launch awareness"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Daily budget</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newDailyBudget}
              onChange={(e) => setNewDailyBudget(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Total budget</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={newTotalBudget}
              onChange={(e) => setNewTotalBudget(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Destination URL</label>
            <input
              type="url"
              value={newDestinationUrl}
              onChange={(e) => setNewDestinationUrl(e.target.value)}
              placeholder="https://example.com/product"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">UTM source</label>
            <input
              type="text"
              value={newUtmSource}
              onChange={(e) => setNewUtmSource(e.target.value)}
              placeholder="instagram"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">UTM medium</label>
            <input
              type="text"
              value={newUtmMedium}
              onChange={(e) => setNewUtmMedium(e.target.value)}
              placeholder="social"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">UTM campaign</label>
            <input
              type="text"
              value={newUtmCampaign}
              onChange={(e) => setNewUtmCampaign(e.target.value)}
              placeholder="spring_launch"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">UTM term</label>
            <input
              type="text"
              value={newUtmTerm}
              onChange={(e) => setNewUtmTerm(e.target.value)}
              placeholder="lookalike_audience"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">UTM content</label>
            <input
              type="text"
              value={newUtmContent}
              onChange={(e) => setNewUtmContent(e.target.value)}
              placeholder="hero_video_v1"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create campaign'}
        </button>
      </form>

      <form
        onSubmit={createAudience}
        className="mb-6 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-3"
      >
        <h2 className="font-medium text-slate-800 dark:text-white">Saved audiences</h2>
        <p className="text-xs text-slate-500">
          Define simple saved audiences (for example, &quot;US · 25–34 · marketing&quot;). These will be used by the delivery
          engine when ad targeting is enabled.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Audience name</label>
            <input
              type="text"
              value={audName}
              onChange={(e) => setAudName(e.target.value)}
              placeholder="e.g. US · 25–34 · marketing"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={audDescription}
              onChange={(e) => setAudDescription(e.target.value)}
              placeholder="e.g. US, English, interests: marketing, SaaS"
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-sm text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1">Advanced rules JSON (optional)</label>
            <textarea
              value={audDefinition}
              onChange={(e) => setAudDefinition(e.target.value)}
              placeholder='e.g. { "any": [ { "type": "relationship", "follower": true } ] }'
              rows={3}
              className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Supported rules: relationship (follower/nonFollower), engagement (minLikesLast30d, minCommentsLast30d),
              purchaser (required). Use any/all/exclude arrays for complex logic.
            </p>
          </div>
        </div>
        <button
          type="submit"
          disabled={creatingAudience || !audName.trim()}
          className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-800 text-white text-sm font-semibold disabled:opacity-60"
        >
          {creatingAudience ? 'Saving…' : 'Save audience'}
        </button>
        {audiences.length > 0 && (
          <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <p className="font-medium text-slate-700 dark:text-slate-200">Your audiences</p>
            <ul className="space-y-1">
              {audiences.map((a) => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>
                    {a.name}
                    {a.description ? <span className="text-slate-500 ml-1">· {a.description}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>

      {loading && <p className="text-slate-500">Loading campaigns…</p>}
      {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

      {!loading && !campaigns.length && !error && (
        <p className="text-slate-500 text-sm">You don&apos;t have any campaigns yet. Create one above or boost a post from your feed.</p>
      )}

      {!loading && campaigns.length > 0 && (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800 dark:text-white">{c.name}</span>
                  <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {c.type === 'BOOST' ? 'Boost' : 'Standard'}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Objective: {c.objective}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Budget:{' '}
                  {c.totalBudget != null
                    ? `${c.currency} ${c.totalBudget.toFixed(2)}`
                    : c.dailyBudget != null
                    ? `${c.currency} ${c.dailyBudget.toFixed(2)} / day`
                    : 'Not set'}
                </p>
                {c.destinationUrl && (
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[420px]">
                    Destination: {c.destinationUrl}
                  </p>
                )}
                {(c.utmSource || c.utmMedium || c.utmCampaign || c.utmTerm || c.utmContent) && (
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[420px]">
                    UTM: {[
                      c.utmSource ? `source=${c.utmSource}` : null,
                      c.utmMedium ? `medium=${c.utmMedium}` : null,
                      c.utmCampaign ? `campaign=${c.utmCampaign}` : null,
                      c.utmTerm ? `term=${c.utmTerm}` : null,
                      c.utmContent ? `content=${c.utmContent}` : null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="mt-2">
                  {editingCampaignId === c.id ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3 space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Edit destination & UTM
                      </p>
                      <input
                        type="url"
                        value={editDrafts[c.id]?.destinationUrl ?? ''}
                        onChange={(e) => updateInlineField(c.id, 'destinationUrl', e.target.value)}
                        placeholder="https://example.com/product"
                        className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editDrafts[c.id]?.utmSource ?? ''}
                          onChange={(e) => updateInlineField(c.id, 'utmSource', e.target.value)}
                          placeholder="utm_source"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={editDrafts[c.id]?.utmMedium ?? ''}
                          onChange={(e) => updateInlineField(c.id, 'utmMedium', e.target.value)}
                          placeholder="utm_medium"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={editDrafts[c.id]?.utmCampaign ?? ''}
                          onChange={(e) => updateInlineField(c.id, 'utmCampaign', e.target.value)}
                          placeholder="utm_campaign"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={editDrafts[c.id]?.utmTerm ?? ''}
                          onChange={(e) => updateInlineField(c.id, 'utmTerm', e.target.value)}
                          placeholder="utm_term"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                        />
                        <input
                          type="text"
                          value={editDrafts[c.id]?.utmContent ?? ''}
                          onChange={(e) => updateInlineField(c.id, 'utmContent', e.target.value)}
                          placeholder="utm_content"
                          className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 sm:col-span-2"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => saveInlineEdit(c.id)}
                          disabled={savingCampaignId === c.id}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold disabled:opacity-60"
                        >
                          {savingCampaignId === c.id ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelInlineEdit}
                          className="inline-flex items-center px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startInlineEdit(c)}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                    >
                      Edit link & UTM
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Impressions</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{c.metrics.impressions}</p>
                </div>
                <div>
                  <p className="text-slate-500">Clicks</p>
                  <p className="font-semibold text-slate-800 dark:text-white">{c.metrics.clicks}</p>
                </div>
                <div>
                  <p className="text-slate-500">Spend</p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {c.currency} {c.metrics.spend.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">CTR</p>
                  <p className="font-semibold text-slate-800 dark:text-white">
                    {c.metrics.ctr.toFixed(1)}%
                  </p>
                </div>
                {audiences.length > 0 && (
                  <div className="sm:col-span-2 flex flex-col gap-1">
                    <p className="text-slate-500">Target audiences</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={attachAudienceByCampaign[c.id] ?? ''}
                        onChange={(e) =>
                          setAttachAudienceByCampaign((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        className="rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
                      >
                        <option value="">Choose audience…</option>
                        {audiences.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => attachAudience(c.id)}
                        disabled={!attachAudienceByCampaign[c.id]}
                        className="inline-flex items-center px-3 py-1 rounded-full bg-slate-800 text-white text-xs font-semibold disabled:opacity-60"
                      >
                        Attach
                      </button>
                    </div>
                    {c.attachedAudiences && c.attachedAudiences.length > 0 && (
                      <p className="text-[11px] text-slate-500">
                        Attached:{' '}
                        {c.attachedAudiences.map((a) => a.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

