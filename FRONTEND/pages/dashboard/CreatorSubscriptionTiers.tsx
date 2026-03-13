import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedInput } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type TierOffer = { key: string; name?: string; price?: number; perks?: string[] };

export default function CreatorSubscriptionTiers() {
  const [tiers, setTiers] = useState<TierOffer[]>([]);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      setError('Not logged in');
      return;
    }
    fetch(`${API_BASE}/accounts/me/subscription-tiers`, { headers: headers() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then((data) => {
        setTiers(Array.isArray(data?.tiers) ? data.tiers : []);
        setWelcomeMessage(typeof data?.welcomeMessage === 'string' ? data.welcomeMessage : '');
        setError(null);
      })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  function updateTier(index: number, field: keyof TierOffer, value: string | number | string[]) {
    setTiers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function addTier() {
    if (tiers.length >= 5) return;
    setTiers((prev) => [...prev, { key: `tier_${prev.length + 1}`, name: '', price: 0 }]);
  }

  function removeTier(index: number) {
    setTiers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    fetch(`${API_BASE}/accounts/me/subscription-tiers`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({
        tiers: tiers.map((t) => ({
          key: (t.key || '').slice(0, 32),
          name: (t.name || '').slice(0, 64),
          price: Number(t.price) >= 0 ? Number(t.price) : 0,
          perks: Array.isArray(t.perks) ? t.perks.slice(0, 10) : undefined,
        })),
        welcomeMessage: welcomeMessage.trim().slice(0, 1000) || null,
      }),
    })
      .then((r) => {
        if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d?.error || 'Failed to save')));
        return r.json();
      })
      .then(() => {
        setMessage('Saved.');
        setError(null);
      })
      .catch((e) => setError(e?.message ?? 'Failed to save'))
      .finally(() => setSaving(false));
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Support tiers"
        left={
          <Link to="/creator-studio" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {loading && <ThemedText secondary>Loading…</ThemedText>}
        {error && <ThemedText className="text-red-500">{error}</ThemedText>}
        {message && <ThemedText className="text-green-600">{message}</ThemedText>}

        {!loading && (
          <>
            <p className="text-sm text-moxe-caption">
              Set up to 5 support tiers for your supporters. All features are free to use.
            </p>

            <div>
              <div className="flex items-center justify-between mb-2">
                <ThemedText className="font-medium">Tiers</ThemedText>
                <ThemedButton
                  label="Add tier"
                  onClick={addTier}
                  disabled={tiers.length >= 5}
                  className="text-xs"
                />
              </div>
              <ul className="space-y-4">
                {tiers.map((tier, index) => (
                  <li
                    key={index}
                    className="p-4 rounded-moxe-md border border-moxe-border bg-moxe-surface space-y-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 grid gap-2">
                        <div>
                          <label className="text-xs text-moxe-caption block mb-0.5">Key (e.g. basic, pro)</label>
                          <ThemedInput
                            value={tier.key}
                            onChange={(e) => updateTier(index, 'key', e.target.value)}
                            placeholder="basic"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-moxe-caption block mb-0.5">Name</label>
                          <ThemedInput
                            value={tier.name ?? ''}
                            onChange={(e) => updateTier(index, 'name', e.target.value)}
                            placeholder="Basic"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-moxe-caption block mb-0.5">Price ($/month)</label>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={tier.price ?? 0}
                            onChange={(e) => updateTier(index, 'price', Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-moxe-caption block mb-0.5">Perks (one per line, optional)</label>
                          <textarea
                            value={Array.isArray(tier.perks) ? tier.perks.join('\n') : ''}
                            onChange={(e) =>
                              updateTier(
                                index,
                                'perks',
                                e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                              )
                            }
                            rows={2}
                            placeholder="Early access
Exclusive DMs"
                            className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm resize-none"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                        aria-label="Remove tier"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              {tiers.length === 0 && (
                <ThemedText secondary className="text-sm">No tiers yet. Add one to get started.</ThemedText>
              )}
            </div>

            <div>
              <label className="text-xs text-moxe-caption block mb-1">Welcome message (for new subscribers)</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                placeholder="Thanks for subscribing! …"
                className="w-full px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body text-sm resize-none"
              />
            </div>

            <ThemedButton
              label={saving ? 'Saving…' : 'Save tiers'}
              onClick={handleSave}
              disabled={saving}
              className="w-full"
            />

            <p className="text-sm text-moxe-caption">
              <Link to="/creator-studio" className="text-moxe-primary">← Back to Creator Studio</Link>
            </p>
          </>
        )}
      </div>
    </ThemedView>
  );
}
