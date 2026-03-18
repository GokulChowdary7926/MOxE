import React, { useEffect, useState } from 'react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { getApiBase, getToken } from '../../services/api';

type Topic = { topic: string; score: number };

export default function AlgorithmPreferencesPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    fetch(`${getApiBase()}/ranking/preferences`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const raw = data?.topics ?? [];
        if (Array.isArray(raw)) {
          setTopics(
            raw
              .filter((t: any) => t && typeof t.topic === 'string')
              .map((t: any) => ({ topic: t.topic, score: Number(t.score ?? 1) })),
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleScoreChange = (index: number, delta: number) => {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, score: Math.min(Math.max(t.score + delta, 0), 5) } : t,
      ),
    );
  };

  const handleRemove = (index: number) => {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const name = prompt('Add a topic or interest (e.g. "travel photography")');
    if (!name) return;
    setTopics((prev) => [...prev, { topic: name.trim(), score: 1 }]);
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      await fetch(`${getApiBase()}/ranking/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topics }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPageShell
      title="Your algorithm"
      backTo="/settings"
      right={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-[#0095f6] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      }
    >
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-[#a8a8a8]">
          Tune what you see on MOxE by telling us which topics you want more or less of.
          Changes apply across feed, reels, explore, and job recommendations.
        </p>

        {loading && <p className="text-sm text-[#a8a8a8]">Loading your topics…</p>}

        {!loading && topics.length === 0 && (
          <p className="text-sm text-[#a8a8a8]">
            We&apos;ll start learning from your activity. You can also add topics manually.
          </p>
        )}

        <div className="divide-y divide-[#262626] border border-[#262626] rounded-lg overflow-hidden">
          {topics.map((t, i) => (
            <div key={t.topic + i} className="flex items-center justify-between px-3 py-2 bg-black">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{t.topic}</p>
                <p className="text-xs text-[#a8a8a8]">Preference strength: {t.score.toFixed(1)}</p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <button
                  type="button"
                  onClick={() => handleScoreChange(i, -0.5)}
                  className="w-7 h-7 rounded-full border border-[#363636] text-[#a8a8a8] text-lg leading-none flex items-center justify-center active:bg-white/5"
                  aria-label="See less of this topic"
                >
                  –
                </button>
                <button
                  type="button"
                  onClick={() => handleScoreChange(i, 0.5)}
                  className="w-7 h-7 rounded-full border border-[#363636] text-[#a8a8a8] text-lg leading-none flex items-center justify-center active:bg-white/5"
                  aria-label="See more of this topic"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="text-xs text-[#ff4d4d] ml-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#363636] text-sm text-white active:bg-white/5"
        >
          Add topic
        </button>
      </div>
    </SettingsPageShell>
  );
}

