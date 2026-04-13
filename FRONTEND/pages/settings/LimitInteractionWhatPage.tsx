import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import {
  fetchLimitInteractions,
  LimitWhatLevel,
  parseWhat,
  patchLimitInteractions,
} from '../../services/limitInteractions';

export default function LimitInteractionWhatPage() {
  const [value, setValue] = useState<LimitWhatLevel>('most');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const s = await fetchLimitInteractions();
        if (!cancelled) setValue(parseWhat(s.commentsFrom));
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

  async function pick(next: LimitWhatLevel) {
    if (next === value) return;
    setValue(next);
    setSaving(true);
    setError(null);
    try {
      await patchLimitInteractions({ commentsFrom: next });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageShell
      title="What to limit"
      backTo="/settings/limit-interactions"
      right={<Link to="/settings/limit-interactions" className="text-[#0095f6] font-semibold text-sm">Done</Link>}
    >
      <div className="px-4 py-4">
        {loading && <p className="text-[#737373] text-sm mb-3">Loading…</p>}
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {saving && <p className="text-[#737373] text-xs mb-2">Saving…</p>}
        <section className="border-b border-[#262626] py-3">
          <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
            <div>
              <p className="text-white font-medium">Some interactions</p>
              <p className="text-[#a8a8a8] text-sm mt-0.5">
                New comments on your content and chats from accounts that you limit will be hidden.
              </p>
            </div>
            <input type="radio" name="what" checked={value === 'some'} onChange={() => void pick('some')} className="sr-only" />
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${value === 'some' ? 'border-white' : 'border-[#363636]'}`}
            >
              {value === 'some' && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
          </label>
          <label className="flex items-start justify-between gap-3 py-2 cursor-pointer">
            <div>
              <p className="text-white font-medium">Most interactions</p>
              <p className="text-[#a8a8a8] text-sm mt-0.5">
                Tags, mentions, story replies and content remixing will be turned off. New comments on your content and chats will also be hidden.
              </p>
            </div>
            <input type="radio" name="what" checked={value === 'most'} onChange={() => void pick('most')} className="sr-only" />
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${value === 'most' ? 'border-white' : 'border-[#363636]'}`}
            >
              {value === 'most' && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
          </label>
        </section>
      </div>
    </SettingsPageShell>
  );
}
