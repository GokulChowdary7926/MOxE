import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { encodeWho, fetchLimitInteractions, LimitWhoFlags, parseWho, patchLimitInteractions } from '../../services/limitInteractions';

export default function LimitInteractionWhoPage() {
  const [flags, setFlags] = useState<LimitWhoFlags>({
    everyoneButClose: false,
    recentFollowers: true,
    accountsDontFollow: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const s = await fetchLimitInteractions();
        if (!cancelled) setFlags(parseWho(s.dmsFrom));
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(next: LimitWhoFlags) {
    const prev = flags;
    setFlags(next);
    setError(null);
    try {
      await patchLimitInteractions({ dmsFrom: encodeWho(next) });
    } catch (e: unknown) {
      setFlags(prev);
      setError(e instanceof Error ? e.message : 'Could not save.');
    }
  }

  return (
    <SettingsPageShell
      title="Who to limit"
      backTo="/settings/limit-interactions"
      right={<Link to="/settings/limit-interactions" className="text-[#0095f6] font-semibold text-sm">Done</Link>}
    >
      <div className="px-4 py-4 space-y-0">
        {loading && <p className="text-[#737373] text-sm pb-3">Loading…</p>}
        {error && <p className="text-red-400 text-sm pb-3">{error}</p>}
        <SettingsToggleRow
          label="Everyone but your close friends"
          checked={flags.everyoneButClose}
          onChange={(v) => void persist({ ...flags, everyoneButClose: v })}
          description="Accounts not on your Close Friends list"
        />
        <SettingsToggleRow
          label="Recent followers"
          checked={flags.recentFollowers}
          onChange={(v) => void persist({ ...flags, recentFollowers: v })}
          description="Accounts that started following you in the past week or after you turn this on"
        />
        <SettingsToggleRow
          label="Accounts that don't follow you"
          checked={flags.accountsDontFollow}
          onChange={(v) => void persist({ ...flags, accountsDontFollow: v })}
        />
      </div>
    </SettingsPageShell>
  );
}
