import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function MediaQualitySettings() {
  const [useLessData, setUseLessData] = useState(false);
  const [uploadHighest, setUploadHighest] = useState(true);
  const [disableHdr, setDisableHdr] = useState(false);

  return (
    <SettingsPageShell title="Media quality" backTo="/settings">
      <SettingsToggleRow
        label="Use less mobile data"
        checked={useLessData}
        onChange={setUseLessData}
        description="Using less mobile data may affect your experience on MOxE. For example, photos and videos may take longer to load."
      />
      <SettingsToggleRow
        label="Upload at highest quality"
        checked={uploadHighest}
        onChange={setUploadHighest}
        description="Always upload the highest-quality photos and videos, even if uploading takes longer. When this is off, we'll automatically adjust upload quality to fit network conditions."
      />
      <SettingsToggleRow
        label="Disable display of HDR media"
        checked={disableHdr}
        onChange={setDisableHdr}
        description="HDR (high dynamic range) media offers better quality in areas of extreme brightness or darkness. As a result, HDR content will appear brighter than standard content."
      />
    </SettingsPageShell>
  );
}
