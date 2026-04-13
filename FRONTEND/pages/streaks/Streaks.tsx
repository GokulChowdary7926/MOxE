import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemedView, ThemedHeader, ThemedText, ThemedButton } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type StreakRow = {
  id: string;
  type: string;
  currentCount: number;
  longestCount: number;
  lastCheckIn: string | null;
};

type StreakType = { key: string; label: string; description?: string };

export default function Streaks() {
  const [items, setItems] = useState<StreakRow[]>([]);
  const [types, setTypes] = useState<StreakType[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [shareSummary, setShareSummary] = useState<string | null>(null);
  const [badge, setBadge] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view streaks.');
      setLoading(false);
      return;
    }
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const headers = { Authorization: `Bearer ${token}` };
        const [listRes, typesRes] = await Promise.all([
          fetch(`${API_BASE}/streaks`, { headers }),
          fetch(`${API_BASE}/streaks/types`, { headers }),
        ]);
        const listData = await listRes.json().catch(() => ({}));
        const typesData = await typesRes.json().catch(() => ({}));
        if (!listRes.ok) {
          throw new Error(listData.error || 'Failed to load streaks.');
        }
        if (!typesRes.ok) {
          throw new Error(typesData.error || 'Failed to load streak types.');
        }
        const rows: StreakRow[] = (listData.items ?? []).map((s: any) => ({
          id: s.id,
          type: s.type,
          currentCount: s.currentCount,
          longestCount: s.longestCount,
          lastCheckIn: s.lastCheckIn,
        }));
        const tList: StreakType[] = (typesData.types ?? []).map((t: any) => ({
          key: t.key ?? t.type ?? '',
          label: t.label ?? t.name ?? t.key ?? '',
          description: t.description,
        }));
        setItems(rows);
        setTypes(tList);
        const best = rows.reduce(
          (acc, s) => (s.longestCount > (acc?.longestCount ?? 0) ? s : acc),
          null as StreakRow | null,
        );
        if (best && best.longestCount >= 7) {
          setBadge(best.longestCount >= 30 ? '🔥 Streak master' : '⭐ Consistent');
        }
        if (tList.length > 0) setActiveType(tList[0].key);
      } catch (e: any) {
        setError(e.message || 'Failed to load streaks.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function checkIn() {
    const token = localStorage.getItem('token');
    if (!token || !activeType) return;
    setCheckingIn(true);
    try {
      const res = await fetch(`${API_BASE}/streaks/check-in`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: activeType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check in.');
      }
      // refresh list
      const listRes = await fetch(`${API_BASE}/streaks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const listData = await listRes.json().catch(() => ({}));
      if (listRes.ok) {
        const rows: StreakRow[] = (listData.items ?? []).map((s: any) => ({
          id: s.id,
          type: s.type,
          currentCount: s.currentCount,
          longestCount: s.longestCount,
          lastCheckIn: s.lastCheckIn,
        }));
        setItems(rows);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to check in.');
    } finally {
      setCheckingIn(false);
    }
  }

  async function loadSharePreview() {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/streaks/share-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load share preview.');
      }
      setShareSummary(data.summary ?? null);
      if (data.summary) {
        const text = `My MOxE streaks: ${data.summary}`;
        navigator.clipboard?.writeText(text).catch(() => {});
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load share preview.');
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Streaks"
        left={
          <Link to="/" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />
      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-4">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading streaks…
          </ThemedText>
        )}
        {error && !loading && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Pick a streak type to check in for today.
          </ThemedText>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {types.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveType(t.key)}
                className={`px-3 py-1.5 rounded-full border text-xs ${
                  activeType === t.key
                    ? 'bg-moxe-primary border-moxe-primary text-white'
                    : 'bg-moxe-surface border-moxe-border text-moxe-textSecondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <ThemedButton
            label={checkingIn ? 'Checking in…' : 'Check in for today'}
            onClick={checkIn}
            disabled={checkingIn || !activeType}
            className="mt-3 w-full justify-center text-xs"
          />
        </section>

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Your streaks
          </ThemedText>
          {!loading && items.length === 0 && (
            <ThemedText secondary className="text-moxe-caption">
              You don&apos;t have any streaks yet. Choose a type and check in to start.
            </ThemedText>
          )}
          <div className="space-y-2">
            {items.map((s) => (
              <div
                key={s.id}
                className="rounded-moxe-md bg-moxe-surface border border-moxe-border px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <ThemedText className="text-moxe-body font-semibold">
                    {s.type}
                  </ThemedText>
                  <ThemedText secondary className="text-moxe-caption">
                    Current: {s.currentCount} · Longest: {s.longestCount}
                  </ThemedText>
                </div>
                {s.lastCheckIn && (
                  <ThemedText secondary className="text-moxe-caption">
                    Last: {new Date(s.lastCheckIn).toLocaleDateString()}
                  </ThemedText>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <ThemedText secondary className="text-moxe-caption mb-2 block">
            Share your streaks
          </ThemedText>
          <ThemedButton
            label="Copy share text"
            variant="secondary"
            onClick={loadSharePreview}
            className="w-full justify-center text-xs"
          />
          <ThemedButton
            label="Share streaks to story"
            onClick={async () => {
              const token = localStorage.getItem('token');
              if (!token) {
                setError('You must be logged in to share streaks.');
                return;
              }
              try {
                const res = await fetch(`${API_BASE}/streaks/share-preview`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  throw new Error(data.error || 'Failed to load share preview.');
                }
                const summary = data.summary as string | undefined;
                const text =
                  summary && typeof summary === 'string'
                    ? `My MOxE streaks: ${summary}`
                    : 'Keeping my MOxE streaks going 🔥';
                navigate('/stories/create', {
                  state: { prefillQuestionAnswer: text },
                } as any);
              } catch (e: any) {
                setError(e.message || 'Failed to prepare streak story.');
              }
            }}
            className="mt-2 w-full justify-center text-xs"
          />
          {shareSummary && (
            <ThemedText secondary className="text-moxe-caption mt-2">
              {shareSummary}
            </ThemedText>
          )}
          {badge && (
            <ThemedText secondary className="text-moxe-caption mt-2">
              Profile badge unlocked: {badge}
            </ThemedText>
          )}
        </section>
      </div>
    </ThemedView>
  );
}

