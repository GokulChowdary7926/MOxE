import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemedView, ThemedText, ThemedHeader, ThemedButton, ThemedInput } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

type BlockedRow = { id: string; username: string; displayName?: string | null; expiresAt?: string | null };
type MutedRow = { id: string; username: string; displayName?: string | null; mutePosts?: boolean; muteStories?: boolean };
type RestrictedRow = { id: string; username: string; displayName?: string | null };

type HiddenWordModItem = {
  id: string;
  type: string;
  title: string | null;
  description: string | null;
  createdAt: string;
  metadata: unknown;
};

function formatModType(t: string): string {
  switch (t) {
    case 'hidden_word_filter_dm':
      return 'DM filtered';
    case 'hidden_word_filter_comment':
      return 'Comment hidden';
    case 'hidden_word_filter_story':
      return 'Story interaction blocked';
    case 'hidden_word_filter_note':
      return 'Note blocked';
    case 'limit_interaction_dm':
      return 'DM hidden (limit interactions)';
    case 'limit_interaction_comment':
      return 'Comment hidden (limit interactions)';
    default:
      return t;
  }
}

export default function SafetyCenter() {
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [muted, setMuted] = useState<MutedRow[]>([]);
  const [restricted, setRestricted] = useState<RestrictedRow[]>([]);
  const [hiddenWords, setHiddenWords] = useState<string>('');
  /** One JavaScript regex pattern per line (case-insensitive on server). */
  const [hiddenRegexText, setHiddenRegexText] = useState<string>('');
  /** Comma-separated account IDs that bypass your hidden-word rules for inbound content. */
  const [hiddenAllowList, setHiddenAllowList] = useState<string>('');
  const [hiddenCommentFilter, setHiddenCommentFilter] = useState(true);
  const [hiddenDmFilter, setHiddenDmFilter] = useState(true);
  const [showAdvancedHidden, setShowAdvancedHidden] = useState(false);
  const [hiddenWordsError, setHiddenWordsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingHidden, setSavingHidden] = useState(false);
  const [exportingHidden, setExportingHidden] = useState(false);
  const [importingHidden, setImportingHidden] = useState(false);
  const importHiddenFileRef = useRef<HTMLInputElement>(null);

  const applyHiddenWordsFromResponse = useCallback((hiddenCfg: unknown) => {
    if (!hiddenCfg || typeof hiddenCfg !== 'object') return;
    const o = hiddenCfg as Record<string, unknown>;
    const w = Array.isArray(o.words) ? o.words : [];
    const rx = Array.isArray(o.regexPatterns) ? o.regexPatterns : [];
    const al = Array.isArray(o.allowListAccountIds) ? o.allowListAccountIds : [];
    setHiddenWords(w.filter((x: unknown): x is string => typeof x === 'string').join(', '));
    setHiddenRegexText(rx.filter((x: unknown): x is string => typeof x === 'string').join('\n'));
    setHiddenAllowList(al.filter((x: unknown): x is string => typeof x === 'string').join(', '));
    setHiddenCommentFilter(!!o.commentFilterEnabled);
    setHiddenDmFilter(!!o.dmFilterEnabled);
  }, []);
  const [blockDurationDays, setBlockDurationDays] = useState<'1' | '7' | '30' | 'forever'>('forever');
  const [blockUsernameOrId, setBlockUsernameOrId] = useState('');
  const [blockFutureAccounts, setBlockFutureAccounts] = useState(true);
  const [modLog, setModLog] = useState<HiddenWordModItem[]>([]);
  const [modLogCursor, setModLogCursor] = useState<string | null>(null);
  const [modLogLoading, setModLogLoading] = useState(false);
  const [modLogFilter, setModLogFilter] = useState<string | null>(null);
  const [anonymousReportingDefault, setAnonymousReportingDefault] = useState(false);
  const [savingAnonReport, setSavingAnonReport] = useState(false);
  const [anonReportError, setAnonReportError] = useState<string | null>(null);

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

        const [blockedRes, mutedRes, restrictedRes, accountRes, hiddenRes, anonReportRes] = await Promise.all([
          fetch(`${API_BASE}/privacy/blocked`, { headers }),
          fetch(`${API_BASE}/privacy/muted`, { headers }),
          fetch(`${API_BASE}/privacy/restricted`, { headers }),
          fetch(`${API_BASE}/accounts/me`, { headers }),
          fetch(`${API_BASE}/privacy/hidden-words`, { headers }),
          fetch(`${API_BASE}/privacy/anonymous-reporting-default`, { headers }),
        ]);
        const blockedData = (await blockedRes.json().catch(() => [])) || [];
        const mutedData = (await mutedRes.json().catch(() => [])) || [];
        const restrictedData = (await restrictedRes.json().catch(() => [])) || [];
        const accountData = await accountRes.json().catch(() => ({}));
        const hiddenCfg = await hiddenRes.json().catch(() => null);
        const anonReportData = anonReportRes.ok
          ? await anonReportRes.json().catch(() => null)
          : null;

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

        if (hiddenRes.ok && hiddenCfg && typeof hiddenCfg === 'object') {
          applyHiddenWordsFromResponse(hiddenCfg);
        } else {
          const words = accountData?.account?.hiddenWords ?? [];
          if (Array.isArray(words)) {
            setHiddenWords(
              words.filter((x: unknown): x is string => typeof x === 'string').join(', '),
            );
          }
        }

        if (
          anonReportData &&
          typeof anonReportData === 'object' &&
          typeof (anonReportData as { anonymousReportingDefault?: unknown }).anonymousReportingDefault === 'boolean'
        ) {
          setAnonymousReportingDefault(
            !!(anonReportData as { anonymousReportingDefault: boolean }).anonymousReportingDefault,
          );
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load safety center.');
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [applyHiddenWordsFromResponse]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    let cancelled = false;
    async function run() {
      setModLogLoading(true);
      setModLog([]);
      setModLogCursor(null);
      try {
        const params = new URLSearchParams({ limit: '20' });
        if (modLogFilter) params.set('type', modLogFilter);
        const res = await fetch(`${API_BASE}/accounts/me/hidden-word-moderation?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || cancelled) return;
        const items = (data.items ?? []) as HiddenWordModItem[];
        const next = typeof data.nextCursor === 'string' ? data.nextCursor : null;
        setModLog(items);
        setModLogCursor(next);
      } catch {
        /* non-fatal */
      } finally {
        if (!cancelled) setModLogLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [modLogFilter]);

  async function loadModLogMore() {
    const token = localStorage.getItem('token');
    if (!token || !modLogCursor) return;
    setModLogLoading(true);
    try {
      const params = new URLSearchParams({ limit: '20', cursor: modLogCursor });
      if (modLogFilter) params.set('type', modLogFilter);
      const res = await fetch(`${API_BASE}/accounts/me/hidden-word-moderation?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const items = (data.items ?? []) as HiddenWordModItem[];
      const next = typeof data.nextCursor === 'string' ? data.nextCursor : null;
      setModLog((prev) => [...prev, ...items]);
      setModLogCursor(next);
    } catch {
      /* non-fatal */
    } finally {
      setModLogLoading(false);
    }
  }

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
    setHiddenWordsError(null);
    try {
      const words = hiddenWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);
      const regexPatterns = hiddenRegexText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const allowListAccountIds = hiddenAllowList
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const res = await fetch(`${API_BASE}/privacy/hidden-words`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          words,
          regexPatterns,
          allowListAccountIds,
          commentFilterEnabled: hiddenCommentFilter,
          dmFilterEnabled: hiddenDmFilter,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = typeof (data as any).error === 'string' ? (data as any).error : 'Could not save hidden words.';
        setHiddenWordsError(msg);
        return;
      }
    } catch {
      setHiddenWordsError('Could not save hidden words.');
    } finally {
      setSavingHidden(false);
    }
  }

  async function exportHiddenWordsList() {
    const token = localStorage.getItem('token');
    if (!token) return;
    setExportingHidden(true);
    setHiddenWordsError(null);
    try {
      const res = await fetch(`${API_BASE}/privacy/hidden-words/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not export hidden words.';
        setHiddenWordsError(msg);
        return;
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'moxe-hidden-words-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setHiddenWordsError('Could not export hidden words.');
    } finally {
      setExportingHidden(false);
    }
  }

  async function onImportHiddenWordsFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    setImportingHidden(true);
    setHiddenWordsError(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(await file.text());
      } catch {
        setHiddenWordsError('Import file is not valid JSON.');
        return;
      }
      const o = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
      const words = Array.isArray(o?.words)
        ? o.words.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      const regexPatterns = Array.isArray(o?.regexPatterns)
        ? o.regexPatterns.filter((x: unknown): x is string => typeof x === 'string')
        : [];
      const res = await fetch(`${API_BASE}/privacy/hidden-words/import`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ words, regexPatterns }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not import hidden words.';
        setHiddenWordsError(msg);
        return;
      }
      applyHiddenWordsFromResponse(data);
    } catch {
      setHiddenWordsError('Could not import hidden words.');
    } finally {
      setImportingHidden(false);
    }
  }

  async function persistAnonymousReportingDefault(next: boolean) {
    const token = localStorage.getItem('token');
    if (!token) return;
    const prev = anonymousReportingDefault;
    setAnonymousReportingDefault(next);
    setAnonReportError(null);
    setSavingAnonReport(true);
    try {
      const res = await fetch(`${API_BASE}/privacy/anonymous-reporting-default`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anonymousReportingDefault: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAnonymousReportingDefault(prev);
        const msg =
          typeof (data as { error?: string }).error === 'string'
            ? (data as { error: string }).error
            : 'Could not update reporting preference.';
        setAnonReportError(msg);
        return;
      }
      if (
        data &&
        typeof data === 'object' &&
        typeof (data as { anonymousReportingDefault?: unknown }).anonymousReportingDefault === 'boolean'
      ) {
        setAnonymousReportingDefault(!!(data as { anonymousReportingDefault: boolean }).anonymousReportingDefault);
      }
    } catch {
      setAnonymousReportingDefault(prev);
      setAnonReportError('Could not update reporting preference.');
    } finally {
      setSavingAnonReport(false);
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
            Reporting
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-3 space-y-2">
            <ThemedText secondary className="text-moxe-caption">
              When you submit an in-app report and don&apos;t choose, MOxE uses this as the default for whether your
              account is attached to the report.
            </ThemedText>
            {anonReportError && (
              <ThemedText className="text-moxe-caption text-moxe-danger">{anonReportError}</ThemedText>
            )}
            <label className="flex items-start gap-2 text-[11px] text-moxe-caption cursor-pointer">
              <input
                type="checkbox"
                checked={anonymousReportingDefault}
                disabled={savingAnonReport || loading}
                onChange={(e) => void persistAnonymousReportingDefault(e.target.checked)}
                className="mt-0.5 w-3 h-3 rounded border-moxe-border bg-moxe-background shrink-0"
              />
              <span>
                Submit reports anonymously by default
                {savingAnonReport ? ' (saving…)' : ''}
              </span>
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Hidden words
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-3 space-y-2">
            <ThemedText secondary className="text-moxe-caption">
              Words and phrases can be filtered in comments, DM requests, story interactions directed at you, and notes you
              try to post. Regex and allow-list use the same rules everywhere.
            </ThemedText>
            {hiddenWordsError && (
              <ThemedText className="text-moxe-caption text-moxe-danger">{hiddenWordsError}</ThemedText>
            )}
            <form onSubmit={saveHiddenWords} className="space-y-2">
              <ThemedInput
                value={hiddenWords}
                onChange={(e) => setHiddenWords(e.target.value)}
                placeholder="Words / phrases, comma-separated"
              />
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[11px] text-moxe-caption">
                  <input
                    type="checkbox"
                    checked={hiddenCommentFilter}
                    onChange={(e) => setHiddenCommentFilter(e.target.checked)}
                    className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
                  />
                  Filter comments on my posts
                </label>
                <label className="flex items-center gap-2 text-[11px] text-moxe-caption">
                  <input
                    type="checkbox"
                    checked={hiddenDmFilter}
                    onChange={(e) => setHiddenDmFilter(e.target.checked)}
                    className="w-3 h-3 rounded border-moxe-border bg-moxe-background"
                  />
                  Filter DM requests / hide matching messages to me
                </label>
              </div>
              <button
                type="button"
                onClick={() => setShowAdvancedHidden((v) => !v)}
                className="text-moxe-primary text-[11px] font-medium"
              >
                {showAdvancedHidden ? 'Hide advanced' : 'Advanced: regex & allow-list'}
              </button>
              {showAdvancedHidden && (
                <div className="space-y-2 pt-1 border-t border-moxe-border/60">
                  <ThemedText secondary className="text-[11px]">
                    Regex: one pattern per line (JavaScript regex; invalid patterns are rejected when you save).
                  </ThemedText>
                  <textarea
                    value={hiddenRegexText}
                    onChange={(e) => setHiddenRegexText(e.target.value)}
                    placeholder={'e.g. buy\\s+now\nsp\\w+m'}
                    rows={4}
                    className="w-full bg-moxe-background border border-moxe-border rounded-moxe-md px-moxe-md py-moxe-sm text-moxe-text text-moxe-body placeholder:text-moxe-textSecondary text-sm font-mono"
                  />
                  <ThemedText secondary className="text-[11px]">
                    Allow-list: account IDs (comma-separated) whose messages are never blocked by these rules.
                  </ThemedText>
                  <ThemedInput
                    value={hiddenAllowList}
                    onChange={(e) => setHiddenAllowList(e.target.value)}
                    placeholder="cuid1, cuid2, …"
                    className="font-mono text-sm"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <ThemedButton
                  type="button"
                  variant="secondary"
                  label={exportingHidden ? 'Exporting…' : 'Export list (JSON)'}
                  className="flex-1 min-w-[8rem] justify-center"
                  disabled={exportingHidden || importingHidden || savingHidden}
                  onClick={() => void exportHiddenWordsList()}
                />
                <ThemedButton
                  type="button"
                  variant="secondary"
                  label={importingHidden ? 'Importing…' : 'Import list'}
                  className="flex-1 min-w-[8rem] justify-center"
                  disabled={importingHidden || exportingHidden || savingHidden}
                  onClick={() => importHiddenFileRef.current?.click()}
                />
                <input
                  ref={importHiddenFileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  aria-hidden
                  onChange={(ev) => void onImportHiddenWordsFile(ev)}
                />
              </div>
              <ThemedText secondary className="text-[10px] leading-snug">
                Import merges words and regex from the file with your current list. Use Export to download the same format.
              </ThemedText>
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

        <section>
          <h2 className="text-moxe-caption font-semibold text-moxe-textSecondary uppercase tracking-wider mb-2">
            Filter &amp; limit activity
          </h2>
          <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border p-3 space-y-3">
            <ThemedText secondary className="text-moxe-caption">
              Recent times hidden word rules or Limit interactions hid a DM, hid a comment, blocked a story interaction,
              or blocked a note you tried to post.
            </ThemedText>
            <div className="flex flex-wrap gap-2">
              {[
                { key: null as string | null, label: 'All' },
                { key: 'hidden_word_filter_dm', label: 'DMs' },
                { key: 'hidden_word_filter_comment', label: 'Comments' },
                { key: 'hidden_word_filter_story', label: 'Stories' },
                { key: 'hidden_word_filter_note', label: 'Notes' },
                { key: 'limit_interaction_dm', label: 'Limit · DMs' },
                { key: 'limit_interaction_comment', label: 'Limit · comments' },
              ].map((chip) => (
                <button
                  key={chip.key ?? 'all'}
                  type="button"
                  onClick={() => setModLogFilter(chip.key)}
                  className={`px-2 py-1 rounded-full text-[11px] border ${
                    modLogFilter === chip.key
                      ? 'bg-moxe-primary border-moxe-primary text-white'
                      : 'bg-moxe-background border-moxe-border text-moxe-textSecondary'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
            {modLog.length === 0 && !modLogLoading && (
              <ThemedText secondary className="text-moxe-caption">
                No activity yet.
              </ThemedText>
            )}
            <ul className="space-y-2">
              {modLog.map((row) => {
                const meta = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {};
                const metaBits: string[] = [];
                if (typeof meta.senderId === 'string') metaBits.push(`Sender: ${meta.senderId.slice(0, 8)}…`);
                if (typeof meta.fromAccountId === 'string') metaBits.push(`From: ${meta.fromAccountId.slice(0, 8)}…`);
                if (typeof meta.postId === 'string') metaBits.push(`Post: ${meta.postId.slice(0, 8)}…`);
                if (typeof meta.messageId === 'string') metaBits.push(`Msg: ${meta.messageId.slice(0, 8)}…`);
                const extra = metaBits.length > 0 ? metaBits.join(' · ') : null;
                const when = row.createdAt ? new Date(row.createdAt).toLocaleString() : '';
                return (
                  <li key={row.id} className="text-moxe-caption border-b border-moxe-border/40 pb-2 last:border-0">
                    <div className="flex justify-between gap-2">
                      <ThemedText className="text-moxe-body text-sm font-medium">
                        {formatModType(row.type)}
                      </ThemedText>
                      <ThemedText secondary className="text-[10px] shrink-0">
                        {when}
                      </ThemedText>
                    </div>
                    {(row.description || row.title) && (
                      <ThemedText secondary className="text-[11px] mt-0.5">
                        {row.description || row.title}
                      </ThemedText>
                    )}
                    {extra && (
                      <ThemedText secondary className="text-[10px] mt-0.5 opacity-80">
                        {extra}
                      </ThemedText>
                    )}
                  </li>
                );
              })}
            </ul>
            {modLogCursor && (
              <ThemedButton
                label={modLogLoading ? 'Loading…' : 'Load more'}
                variant="secondary"
                className="w-full justify-center text-xs"
                disabled={modLogLoading}
                onClick={() => loadModLogMore()}
              />
            )}
          </div>
        </section>
      </div>
    </ThemedView>
  );
}

