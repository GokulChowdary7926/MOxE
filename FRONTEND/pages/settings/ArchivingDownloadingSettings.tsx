import React, { useState } from 'react';
import { SettingsPageShell, SettingsToggleRow } from '../../components/layout/SettingsPageShell';

export default function ArchivingDownloadingSettings() {
  const [saveStoryToArchive, setSaveStoryToArchive] = useState(false);
  const [saveLiveToArchive, setSaveLiveToArchive] = useState(true);
  const [saveOriginalPhotos, setSaveOriginalPhotos] = useState(false);
  const [saveStoryToCameraRoll, setSaveStoryToCameraRoll] = useState(true);

  return (
    <SettingsPageShell title="Archiving and downloading" backTo="/settings">
      <h2 className="text-white font-semibold px-4 pt-4 pb-2">Saving to archive</h2>
      <SettingsToggleRow
        label="Save story to archive"
        checked={saveStoryToArchive}
        onChange={setSaveStoryToArchive}
        description="Automatically save photos and videos to your archive so you don't have to save them to your phone. Only you can see your archive."
      />
      <div className="px-4 py-3 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium">Save live to archive</p>
            <p className="text-[#a8a8a8] text-sm mt-0.5">
              Automatically save your live video to your archive. Only you can see your archive. Archived videos aren&apos;t visible unless you share them. Videos that you&apos;ve shared publicly will be used to improve AI at Meta.{' '}
              <span className="text-[#0095f6]">Learn more</span>
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={saveLiveToArchive}
            onClick={() => setSaveLiveToArchive((v) => !v)}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ml-2 ${saveLiveToArchive ? 'bg-[#0095f6]' : 'bg-[#363636]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${saveLiveToArchive ? 'left-5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <h2 className="text-white font-semibold px-4 pt-6 pb-2">Saving to Camera Roll</h2>
      <SettingsToggleRow
        label="Save original photos"
        checked={saveOriginalPhotos}
        onChange={setSaveOriginalPhotos}
        description="Automatically save the unedited photos and videos taken with MOxE's feed camera to your camera roll."
      />
      <SettingsToggleRow
        label="Save story to Camera Roll"
        checked={saveStoryToCameraRoll}
        onChange={setSaveStoryToCameraRoll}
        description="Automatically save photos and videos to your phone's camera roll."
      />
    </SettingsPageShell>
  );
}
