import React, { useCallback, useEffect, useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import { ThemedText } from '../../components/ui/Themed';
import {
  fetchClientSettings,
  patchClientSettings,
  type ClientSettingsData,
} from '../../services/clientSettings';

export default function DeviceDataUsageSettings() {
  const [loading, setLoading] = useState(true);
  const [deviceAndData, setDeviceAndData] = useState<NonNullable<ClientSettingsData['deviceAndData']>>({});
  const [storage, setStorage] = useState<{ usage?: number; quota?: number }>({});
  const [conn, setConn] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchClientSettings();
      setDeviceAndData(s.deviceAndData ?? {});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (navigator.storage?.estimate) {
      void navigator.storage.estimate().then((e) => {
        setStorage({ usage: e.usage, quota: e.quota });
      });
    }
    const n = navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean; type?: string } };
    const c = n.connection;
    if (c) {
      const parts = [c.effectiveType, c.saveData ? 'save-data' : null, c.type].filter(Boolean);
      setConn(parts.join(' · ') || null);
    }
  }, []);

  const persist = async (patch: ClientSettingsData['deviceAndData']) => {
    const next = { ...deviceAndData, ...patch };
    setDeviceAndData(next);
    await patchClientSettings({ deviceAndData: next });
  };

  const clearMoxeLocal = () => {
    if (!window.confirm('Clear MOxE settings cached in this browser on this site?')) return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('moxe') || k.includes('moxe'));
    keys.forEach((k) => localStorage.removeItem(k));
    void navigator.storage?.estimate?.().then((e) => setStorage({ usage: e.usage, quota: e.quota }));
  };

  const mb = (n?: number) => (n == null ? '—' : `${(n / (1024 * 1024)).toFixed(1)} MB`);

  return (
    <SettingsPageShell title="Data usage and media" backTo="/settings">
      {loading ? (
        <ThemedText secondary className="px-4 py-4 text-sm">
          Loading…
        </ThemedText>
      ) : (
        <>
          <ThemedText secondary className="px-4 pt-4 text-sm">
            Control how much data MOxE uses in this browser. Settings sync to your account when you are
            signed in.
          </ThemedText>

          <h2 className="text-white font-semibold px-4 pt-6 pb-2">Bandwidth</h2>
          <SettingsToggleRow
            label="Data saver"
            description="Use less data: lighter reel preloads and shorter media hints."
            checked={!!deviceAndData.dataSaver}
            onChange={(v) => void persist({ dataSaver: v })}
          />
          <SettingsToggleRow
            label="Preload next reel"
            description="Prefetch the next reel video while you watch (uses more data)."
            checked={deviceAndData.preloadReels !== false}
            onChange={(v) => void persist({ preloadReels: v })}
          />
          <SettingsToggleRow
            label="Only preload on Wi‑Fi / unmetered"
            description="Skip reel prefetch on cellular when the browser reports a connection type."
            checked={!!deviceAndData.preloadReelsWifiOnly}
            onChange={(v) => void persist({ preloadReelsWifiOnly: v })}
          />
          <SettingsToggleRow
            label="High‑quality uploads"
            description="Prefer higher resolution when uploading photos and video (more data)."
            checked={deviceAndData.highQualityUploads !== false}
            onChange={(v) => void persist({ highQualityUploads: v })}
          />

          <h2 className="text-white font-semibold px-4 pt-6 pb-2">Storage (this browser)</h2>
          <div className="px-4 pb-3 space-y-1">
            <ThemedText secondary className="text-sm">
              Origin storage (approx.): {mb(storage.usage)} used
              {storage.quota != null ? ` · ${mb(storage.quota)} quota` : null}
            </ThemedText>
            {conn ? (
              <ThemedText secondary className="text-sm">
                Network hint: {conn}
              </ThemedText>
            ) : null}
          </div>
          <button
            type="button"
            onClick={clearMoxeLocal}
            className="mx-4 mb-4 px-4 py-2 rounded-lg border border-moxe-border text-moxe-body text-sm"
          >
            Clear MOxE local cache keys
          </button>

          <ThemedText secondary className="px-4 pb-6 text-xs">
            For a full export of your MOxE data, use Download your data in settings. Cache clearing only
            affects this browser profile.
          </ThemedText>
        </>
      )}
    </SettingsPageShell>
  );
}
