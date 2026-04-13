import React, { useCallback, useEffect, useState } from 'react';
import { SettingsPageShell, SettingsRadioSection, SettingsToggleRow } from '../../components/layout/SettingsPageShell';
import {
  fetchClientSettings,
  patchClientSettings,
  type ClientSettingsData,
} from '../../services/clientSettings';

const CAPTIONS_OPTIONS = [
  { label: 'Always show closed captions', value: 'always' },
  { label: 'Only show translated closed captions', value: 'translated' },
  { label: 'Never show closed captions', value: 'never' },
];

export default function AccessibilitySettings() {
  const [loading, setLoading] = useState(true);
  const [a11y, setA11y] = useState<NonNullable<ClientSettingsData['accessibility']>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await fetchClientSettings();
      setA11y(s.accessibility ?? { captionsMode: 'never' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const merge = async (patch: ClientSettingsData['accessibility']) => {
    const next = { ...a11y, ...patch };
    setA11y(next);
    await patchClientSettings({ accessibility: next });
  };

  const captions = a11y.captionsMode ?? 'never';

  return (
    <SettingsPageShell title="Accessibility" backTo="/settings">
      {loading ? <p className="text-[#a8a8a8] text-sm px-4 py-4">Loading…</p> : null}
      {!loading && (
        <>
          <SettingsRadioSection
            name="captions"
            title="Captions"
            value={captions}
            onChange={(v) => void merge({ captionsMode: v as 'always' | 'translated' | 'never' })}
            options={CAPTIONS_OPTIONS}
          />
          {captions === 'always' && (
            <p className="text-[#a8a8a8] text-sm px-4 pb-2">
              Caption availability depends on the content publisher and playback surface.
            </p>
          )}
          {captions === 'translated' && (
            <p className="text-[#a8a8a8] text-sm px-4 pb-2">Choose languages under Language and translations.</p>
          )}
          <h2 className="text-white font-semibold px-4 pt-4 pb-2">HDR</h2>
          <SettingsToggleRow
            label="Disable HDR video playback"
            checked={!!a11y.disableHdr}
            onChange={(v) => void merge({ disableHdr: v })}
          />
          <h2 className="text-white font-semibold px-4 pt-4 pb-2">Display</h2>
          <SettingsToggleRow
            label="Reduce motion"
            description="Minimize animations in the MOxE web app (also respects system setting)."
            checked={!!a11y.reduceMotion}
            onChange={(v) => void merge({ reduceMotion: v })}
          />
          <SettingsToggleRow
            label="High contrast"
            description="Stronger text and border contrast."
            checked={!!a11y.highContrast}
            onChange={(v) => void merge({ highContrast: v })}
          />
          <SettingsToggleRow
            label="Larger text"
            description="Slightly increase base font size for this app."
            checked={!!a11y.largerText}
            onChange={(v) => void merge({ largerText: v })}
          />
        </>
      )}
    </SettingsPageShell>
  );
}
