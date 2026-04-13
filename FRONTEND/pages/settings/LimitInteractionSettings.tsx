import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, User, Clock, ChevronRight } from 'lucide-react';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import {
  durationLabel,
  encodeWho,
  fetchLimitInteractions,
  parseWhat,
  parseWho,
  patchLimitInteractions,
  summarizeWhat,
  summarizeWho,
} from '../../services/limitInteractions';

export default function LimitInteractionSettings() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [commentsFrom, setCommentsFrom] = useState('everyone');
  const [dmsFrom, setDmsFrom] = useState('everyone');
  const [duration, setDuration] = useState('24h');

  const refresh = useCallback(async () => {
    const s = await fetchLimitInteractions();
    setActive(s.active);
    setExpiresAt(s.expiresAt);
    setCommentsFrom(s.commentsFrom);
    setDmsFrom(s.dmsFrom);
    setDuration(s.duration);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        await refresh();
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load limit interactions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => {
      void refresh().catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  const what = parseWhat(commentsFrom);
  const who = parseWho(dmsFrom);

  async function turnOn() {
    setBusy(true);
    setError(null);
    try {
      let latest = await fetchLimitInteractions();
      const body: Parameters<typeof patchLimitInteractions>[0] = { active: true };
      if (latest.commentsFrom === 'everyone' && latest.dmsFrom === 'everyone') {
        body.commentsFrom = 'most';
        body.dmsFrom = encodeWho({
          everyoneButClose: false,
          recentFollowers: true,
          accountsDontFollow: true,
        });
        body.duration = '7d';
      }
      const s = await patchLimitInteractions(body);
      setActive(s.active);
      setExpiresAt(s.expiresAt);
      setCommentsFrom(s.commentsFrom);
      setDmsFrom(s.dmsFrom);
      setDuration(s.duration);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not turn on.');
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(null);
    try {
      const s = await patchLimitInteractions({ active: false });
      setActive(s.active);
      setExpiresAt(s.expiresAt);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not turn off.');
    } finally {
      setBusy(false);
    }
  }

  const expiresLabel =
    active && expiresAt
      ? new Date(expiresAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
      : null;

  return (
    <SettingsPageShell title="Limit interactions" backTo="/settings">
      <div className="px-4 py-4">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full border-2 border-dashed border-[#363636] flex items-center justify-center">
          <User className="w-10 h-10 text-[#737373]" />
        </div>
        <h2 className="text-white font-bold text-lg text-center mb-2">Limit interactions from people who are bothering you</h2>
        <p className="text-[#a8a8a8] text-sm text-center mb-6">
          Temporarily limit people&apos;s ability to interact with you through messages, comments, tagging and more.
        </p>

        {loading && <p className="text-[#737373] text-sm text-center mb-4">Loading…</p>}
        {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

        {active && expiresLabel && (
          <p className="text-[#0095f6] text-sm text-center font-medium mb-4">On until {expiresLabel}</p>
        )}
        {!active && !loading && <p className="text-[#737373] text-sm text-center mb-4">Status: off</p>}

        <Link to="/settings/limit-interactions/what" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <MessageCircle className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">What will be limited</p>
            <p className="text-[#a8a8a8] text-sm">{summarizeWhat(what)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/limit-interactions/who" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <User className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Who will be limited</p>
            <p className="text-[#a8a8a8] text-sm">{summarizeWho(who)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>
        <Link to="/settings/limit-interactions/reminder" className="flex items-center gap-3 px-4 py-3 border-b border-[#262626] text-white active:bg-white/5">
          <Clock className="w-5 h-5 text-[#a8a8a8] flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Limit window</p>
            <p className="text-[#a8a8a8] text-sm">Each time you turn this on: {durationLabel(duration)}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#737373]" />
        </Link>

        {active ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void turnOff()}
            className="w-full py-3 rounded-lg mt-6 border border-[#363636] text-white font-semibold disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Turn off'}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || loading}
            onClick={() => void turnOn()}
            className="w-full py-3 rounded-lg bg-[#0095f6] text-white font-semibold mt-6 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Turn on'}
          </button>
        )}
        <p className="text-[#737373] text-xs text-center mt-3">We won&apos;t let people know that you&apos;ve turned this on.</p>
      </div>
    </SettingsPageShell>
  );
}
