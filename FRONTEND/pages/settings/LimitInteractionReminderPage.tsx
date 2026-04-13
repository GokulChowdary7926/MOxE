import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SettingsPageShell } from '../../components/layout/SettingsPageShell';
import { fetchLimitInteractions, LIMIT_DURATION_OPTIONS, patchLimitInteractions } from '../../services/limitInteractions';

export default function LimitInteractionReminderPage() {
  const [duration, setDuration] = useState<string>('7d');
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
        if (!cancelled) {
          const ok = LIMIT_DURATION_OPTIONS.some((o) => o.value === s.duration);
          setDuration(ok ? s.duration : '7d');
        }
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

  async function pick(next: string) {
    if (next === duration) return;
    setDuration(next);
    setSaving(true);
    setError(null);
    try {
      await patchLimitInteractions({ duration: next });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsPageShell
      title="Limit window"
      backTo="/settings/limit-interactions"
      right={<Link to="/settings/limit-interactions" className="text-[#0095f6] font-semibold text-sm">Done</Link>}
    >
      <div className="px-4 py-4">
        <p className="text-[#a8a8a8] text-sm mb-4">
          When you turn limit interactions on, it stays active for this length of time. You can turn it off sooner from the main screen.
        </p>
        {loading && <p className="text-[#737373] text-sm mb-3">Loading…</p>}
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        {saving && <p className="text-[#737373] text-xs mb-2">Saving…</p>}
        <section className="border border-[#262626] rounded-lg overflow-hidden">
          {LIMIT_DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => void pick(opt.value)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left border-b border-[#262626] last:border-0 ${
                duration === opt.value ? 'bg-white/5' : 'active:bg-white/5'
              }`}
            >
              <span className="text-white font-medium">{opt.label}</span>
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  duration === opt.value ? 'border-white' : 'border-[#363636]'
                }`}
              >
                {duration === opt.value && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
              </span>
            </button>
          ))}
        </section>
      </div>
    </SettingsPageShell>
  );
}
