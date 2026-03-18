import React, { useState } from 'react';
import { SettingsPageShell, SettingsRadioSection, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

const CAPTIONS_OPTIONS = [
  { label: 'Always show closed captions', value: 'always' },
  { label: 'Only show translated closed captions', value: 'translated' },
  { label: 'Never show closed captions', value: 'never' },
];

export default function AccessibilitySettings() {
  const [captions, setCaptions] = useState('never');
  const [disableHdr, setDisableHdr] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  return (
    <SettingsPageShell title="Accessibility" backTo="/settings">
      <SettingsRadioSection
        name="captions"
        title="Captions"
        value={captions}
        onChange={setCaptions}
        options={CAPTIONS_OPTIONS}
      />
      {captions === 'always' && <p className="text-[#a8a8a8] text-sm px-4 pb-2">Closed captions are auto-generated. <span className="text-[#0095f6]">Learn more</span></p>}
      {captions === 'translated' && <p className="text-[#a8a8a8] text-sm px-4 pb-2">Choose which languages to translate in <span className="text-[#0095f6]">translation settings</span></p>}
      <h2 className="text-white font-semibold px-4 pt-4 pb-2">HDR</h2>
      <SettingsToggleRow
        label="Disable HDR video playback"
        checked={disableHdr}
        onChange={setDisableHdr}
      />
      <h2 className="text-white font-semibold px-4 pt-4 pb-2">Reduce motion</h2>
      <SettingsToggleRow
        label="Reduce motion"
        checked={reduceMotion}
        onChange={setReduceMotion}
      />
    </SettingsPageShell>
  );
}
