/**
 * Quiet mode (1.7.2): silence notifications during a scheduled window.
 * Backend: quietModeEnabled, quietModeStart, quietModeEnd, quietModeDays.
 */
import React, { useEffect, useState } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { ThemedText } from '../../components/ui/Themed';
import { getApiBase } from '../../services/api';

const API_BASE = getApiBase();

const DAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

export default function QuietModeSettings() {
  const [enabled, setEnabled] = useState(false);
  const [start, setStart] = useState('22:00');
  const [end, setEnd] = useState('07:00');
  const [days, setDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // all days
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/accounts/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const acc = data?.account ?? data;
        if (acc) {
          setEnabled(!!acc.quietModeEnabled);
          if (acc.quietModeStart) setStart(acc.quietModeStart);
          if (acc.quietModeEnd) setEnd(acc.quietModeEnd);
          if (Array.isArray(acc.quietModeDays)) setDays(acc.quietModeDays);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)
    );
  };

  const save = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/accounts/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quietModeEnabled: enabled,
          quietModeStart: start,
          quietModeEnd: end,
          quietModeDays: days,
        }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Quiet mode" backTo="/settings/notifications">
        <ThemedText secondary>Loading…</ThemedText>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Quiet mode" backTo="/settings/notifications">
      <div className="py-4 space-y-4">
        <ThemedText secondary className="text-moxe-caption block">
          During this time, notifications are silenced. You can still use the app.
        </ThemedText>

        <div className="rounded-moxe-md bg-moxe-surface border border-moxe-border overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-moxe-border">
            <ThemedText className="text-moxe-body font-medium">Enable quiet mode</ThemedText>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => setEnabled((v) => !v)}
              className={`w-11 h-6 rounded-full ${enabled ? 'bg-moxe-primary' : 'bg-moxe-border'}`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white mt-0.5 transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {enabled && (
            <>
              <div className="px-3 py-3 border-b border-moxe-border flex items-center gap-3">
                <ThemedText className="text-moxe-body font-medium w-24">Start</ThemedText>
                <input
                  type="time"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body"
                />
              </div>
              <div className="px-3 py-3 border-b border-moxe-border flex items-center gap-3">
                <ThemedText className="text-moxe-body font-medium w-24">End</ThemedText>
                <input
                  type="time"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-moxe-md bg-moxe-background border border-moxe-border text-moxe-body"
                />
              </div>
              <div className="px-3 py-3">
                <ThemedText className="text-moxe-body font-medium mb-2 block">Days</ThemedText>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1.5 rounded-full text-sm ${
                        days.includes(d)
                          ? 'bg-moxe-primary text-white'
                          : 'bg-moxe-background border border-moxe-border text-moxe-caption'
                      }`}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full py-3 rounded-moxe-md bg-moxe-primary text-white font-medium disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </PageLayout>
  );
}
