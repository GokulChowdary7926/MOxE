import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedInput } from '../../components/ui/Themed';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5007/api';

type BlockedRow = { id: string; username: string; displayName?: string | null; expiresAt?: string | null };
type MutedRow = { id: string; username: string; displayName?: string | null; mutePosts?: boolean; muteStories?: boolean };
type RestrictedRow = { id: string; username: string; displayName?: string | null };

export default function SafetyCenter() {
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [muted, setMuted] = useState<MutedRow[]>([]);
  const [restricted, setRestricted] = useState<RestrictedRow[]>([]);
  const [hiddenWords, setHiddenWords] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingHidden, setSavingHidden] = useState(false);
  const [blockDurationDays, setBlockDurationDays] = useState<'1' | '7' | '30' | 'forever'>('forever');
  const [blockUsernameOrId, setBlockUsernameOrId] = useState('');
  const [blockFutureAccounts, setBlockFutureAccounts] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to manage safety settings.');
      setLoading(false);
      return;
    }
    async function loadAll() {
      try {
        setLoading(true);
        setError(null);
        const headers = { Authorization: `Bearer ${token}` };

        const [blockedRes, mutedRes, restrictedRes, accountRes] = await Promise.all([
          fetch(`${API_BASE}/privacy/blocked`, { headers }),
          fetch(`${API_BASE}/privacy/muted`, { headers }),
          fetch(`${API_BASE}/privacy/restricted`, { headers }),
          fetch(`${API_BASE}/accounts/me`, { headers }),
        ]);
        const blockedData = (await blockedRes.json().catch(() => [])) || [];
        const mutedData = (await mutedRes.json().catch(() => [])) || [];
        const restrictedData = (await restrictedRes.json().catch(() => [])) || [];
        const accountData = await accountRes.json().catch(() => ({}));

        if (!blockedRes.ok || !mutedRes.ok || !restrictedRes.ok) {
          throw new Error('Failed to load safety lists.');
        }

        setBlocked(
          blockedData.map((a: any) => ({
            id: a.id,
            username: a.username,
            displayName: a.displayName,
            expiresAt: a.expiresAt ?? null,
          })),
        );
        setMuted(
          mutedData.map((a: any) => ({
            id: a.id,
            username: a.username,
            displayName: a.displayName,
            mutePosts: a.mutePosts,
            muteStories: a.muteStories,
          })),
        );
        setRestricted(
          restrictedData.map((a: any) => ({
            id: a.id,
            username: a.username,
            displayName: a.displayName,
          })),
        );

        const words = accountData?.account?.hiddenWords ?? [];
        if (Array.isArray(words)) {
          setHiddenWords(words.join(', '));
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load safety center.');
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  async function unblock(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_BASE}/privacy/block/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setBlocked((prev) => prev.filter((a) => a.id !== id));
  }

  async function unmute(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_BASE}/privacy/mute/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setMuted((prev) => prev.filter((a) => a.id !== id));
  }

  async function updateMute(id: string, next: { mutePosts?: boolean; muteStories?: boolean }) {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/privacy/mute`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: id,
          mutePosts: next.mutePosts,
          muteStories: next.muteStories,
        }),
      });
      setMuted((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                mutePosts: next.mutePosts ?? m.mutePosts,
                muteStories: next.muteStories ?? m.muteStories,
              }
            : m,
        ),
      );
    } catch {
      // ignore for now
    }
  }

  async function unrestrict(id: string) {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch(`${API_BASE}/privacy/restrict/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    setRestricted((prev) => prev.filter((a) => a.id !== id));
  }

  async function saveHiddenWords(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return;
    setSavingHidden(true);
    try {
      const words = hiddenWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);
      await fetch(`${API_BASE}/accounts/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hiddenWords: words,
          hiddenWordsCommentFilter: true,
          hiddenWordsDMFilter: true,
        }),
      });
    } catch {
      // ignore errors for now
    } finally {
      setSavingHidden(false);
    }
  }

  return (
    <ThemedView className="min-h-screen flex flex-col pb-20">
      <ThemedHeader
        title="Safety center"
        left={
          <Link to="/settings/safety" className="text-moxe-text text-2xl leading-none" aria-label="Back">
            ←
          </Link>
        }
      />

      <div className="flex-1 overflow-auto px-moxe-md py-moxe-md space-y-6">
        {loading && (
          <ThemedText secondary className="text-moxe-caption">
            Loading safety data…
          </ThemedText>
        )}
        {error && (
          <ThemedText className="text-moxe-caption text-moxe-danger">
            {error}
          </ThemedText>
        )}

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Blocked accounts
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-2 space-y-1">
            {blocked.length === 0 && (
              <ThemedText secondary className="text-moxe-caption">
                You haven&apos;t blocked anyone.
              </ThemedText>
            )}
            {blocked.map((a) => {
              let badge: string | null = null;
              if (a.expiresAt) {
                const end = new Date(a.expiresAt);
                const now = new Date();
                const ms = end.getTime() - now.getTime();
                if (ms > 0) {
                  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
                  if (days >= 1) {
                    badge = `Temporary block · ${days} day${days > 1 ? 's' : ''} left`;
                  } else {
                    const hours = Math.max(1, Math.floor(ms / (60 * 60 * 1000)));
                    badge = `Temporary block · ${hours}h left`;
                  }
                } else {
                  badge = 'Temporary block · expired soon';
                }
              } else {
                badge = 'Permanent block';
              }
              return (
                <div key={a.id} className="flex items-center justify-between py-1">
                  <div className="flex flex-col">
                    <ThemedText className="text-moxe-body">
                      @{a.username}
                      {a.displayName ? ` · ${a.displayName}` : ''}
                    </ThemedText>
                    {badge && (
                      <ThemedText secondary className="text-[11px] text-moxe-caption">
                        {badge}
                      </ThemedText>
                    )}
                  </div>
                  <ThemedButton
                    label="Unblock"
                    variant="secondary"
                    onClick={() => unblock(a.id)}
                    className="px-3 py-1 text-xs"
                  />
                </div>
              );
            })}
            <div className="mt-2 pt-2 border-t border-moxe-border/60 space-y-2">
              <ThemedText secondary className="text-moxe-caption">
                Temporarily block someone for 24 hours, 7 days, or 30 days. Their likes, comments, and messages will be limited during this time. You can also choose to block any new accounts created by this person on the same phone number.
              </ThemedText>
              <div className="flex gap-2 items-center">
                <ThemedInput
                  value={blockUsernameOrId}
                  onChange={(e) => setBlockUsernameOrId(e.target.value)}
                  placeholder="Username to block temporarily"
                />
              </div>
              <label className="flex items-center gap-2 text-[11px] text-moxe-caption">
                <input
                  type="checkbox"
                  checked={blockFutureAccounts}
                  onChange={(e) => setBlockFutureAccounts(e.target.checked)}
                  className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
                />
                Also block future accounts they create on this phone
              </label>
              <div className="flex gap-2">
                {[
                  { key: '1', label: '24 hours' },
                  { key: '7', label: '7 days' },
                  { key: '30', label: '30 days' },
                  { key: 'forever', label: 'Until I unblock' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setBlockDurationDays(opt.key as '1' | '7' | '30' | 'forever')}
                    className={`px-2 py-1 rounded-full text-[11px] border ${
                      blockDurationDays === opt.key
                        ? 'bg-moxe-primary border-moxe-primary text-white'
                        : 'bg-moxe-surface border-moxe-border text-moxe-textSecondary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <ThemedButton
                label="Apply temporary block"
                variant="secondary"
                className="px-3 py-1 text-xs"
                onClick={async () => {
                  const token = localStorage.getItem('token');
                  if (!token || !blockUsernameOrId.trim()) return;
                  try {
                    // Resolve username → account via /accounts/username/:username
                    const uRes = await fetch(
                      `${API_BASE}/accounts/username/${encodeURIComponent(blockUsernameOrId.trim())}`,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    const uData = await uRes.json().catch(() => ({}));
                    if (!uRes.ok || !uData.id) {
                      setError('Could not find that account to block.');
                      return;
                    }
                    const durationDays =
                      blockDurationDays === 'forever' ? undefined : Number(blockDurationDays);
                    await fetch(`${API_BASE}/privacy/block`, {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        accountId: uData.id,
                        durationDays,
                        blockFutureAccounts,
                      }),
                    });
                    setBlocked((prev) => [
                      ...prev,
                      { id: uData.id, username: uData.username, displayName: uData.displayName },
                    ]);
                    setBlockUsernameOrId('');
                  } catch (e: any) {
                    setError(e.message || 'Failed to apply temporary block.');
                  }
                }}
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Muted accounts
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-2 space-y-1">
            {muted.length === 0 && (
              <ThemedText secondary className="text-moxe-caption">
                You haven&apos;t muted anyone.
              </ThemedText>
            )}
            {muted.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1 gap-2">
                <div className="flex flex-col">
                  <ThemedText className="text-moxe-body">
                    @{a.username}
                    {a.displayName ? ` · ${a.displayName}` : ''}
                  </ThemedText>
                  <div className="flex items-center gap-2 text-[11px] text-moxe-caption mt-0.5">
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={a.mutePosts ?? true}
                        onChange={(e) =>
                          updateMute(a.id, { mutePosts: e.target.checked, muteStories: a.muteStories })
                        }
                        className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
                      />
                      Posts
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={a.muteStories ?? true}
                        onChange={(e) =>
                          updateMute(a.id, { mutePosts: a.mutePosts, muteStories: e.target.checked })
                        }
                        className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
                      />
                      Stories
                    </label>
                  </div>
                </div>
                <ThemedButton
                  label="Unmute"
                  variant="secondary"
                  onClick={() => unmute(a.id)}
                  className="px-3 py-1 text-xs"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Restricted accounts
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-2 space-y-1">
            {restricted.length === 0 && (
              <ThemedText secondary className="text-moxe-caption">
                You haven&apos;t restricted anyone.
              </ThemedText>
            )}
            {restricted.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-1">
                <ThemedText className="text-moxe-body">
                  @{a.username}
                  {a.displayName ? ` · ${a.displayName}` : ''}
                </ThemedText>
                <ThemedButton
                  label="Unrestrict"
                  variant="secondary"
                  onClick={() => unrestrict(a.id)}
                  className="px-3 py-1 text-xs"
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Hidden words
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-3 space-y-2">
            <ThemedText secondary className="text-moxe-caption">
              Comments and DMs containing these words will be filtered. Separate words or phrases with commas.
            </ThemedText>
            <form onSubmit={saveHiddenWords} className="space-y-2">
              <ThemedInput
                value={hiddenWords}
                onChange={(e) => setHiddenWords(e.target.value)}
                placeholder="e.g. spam, rude word, another phrase"
              />
              <ThemedButton
                type="submit"
                label={savingHidden ? 'Saving…' : 'Save hidden words'}
                className="w-full justify-center"
                disabled={savingHidden}
              />
            </form>
            <Link
              to="/settings/hidden-comments"
              className="text-moxe-primary text-[11px] font-medium mt-1 inline-block"
            >
              Review hidden comments
            </Link>
          </div>
        </section>
      </div>
    </ThemedView>
  );
}

