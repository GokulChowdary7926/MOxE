import React from 'react';
import {
  SettingsPageShell,
  SettingsRadioSection,
  SettingsSaveErrorBanner,
} from '../../components/layout/SettingsPageShell';
import { usePersistedNotificationGroup } from '../../hooks/usePersistedNotificationGroup';

const DEFAULTS = {
  addYours: 'on',
  promptResponses: 'on',
  reelsMadeForYou: 'off',
} as const;

export default function LiveReelsSettings() {
  const { values, setField, ready, saveError, clearSaveError } = usePersistedNotificationGroup(
    'liveReels',
    { ...DEFAULTS } as Record<string, string>,
  );

  return (
    <SettingsPageShell title="Live and reels" backTo="/settings/notifications">
      {saveError && <SettingsSaveErrorBanner message={saveError} onDismiss={clearSaveError} />}
      <p className="text-[#a8a8a8] text-sm px-4 py-3">
        Take a look at the most watched reels in your location today.
      </p>
      {!ready && <p className="text-[#737373] text-sm px-4 py-2">Loading…</p>}
      <SettingsRadioSection
        name="add-yours"
        title="Add yours"
        value={values.addYours}
        onChange={(v) => setField('addYours', v)}
        exampleText="johnappleseed started an Add yours prompt."
      />
      <SettingsRadioSection
        name="prompt-responses"
        title="Prompt responses"
        value={values.promptResponses}
        onChange={(v) => setField('promptResponses', v)}
        exampleText="johnappleseed created a reel with your prompt: Most recent photo"
      />
      <SettingsRadioSection
        name="reels-made-for-you"
        title="Reels made for you"
        value={values.reelsMadeForYou}
        onChange={(v) => setField('reelsMadeForYou', v)}
        exampleText="See new reels made for you."
      />
    </SettingsPageShell>
  );
}
