import React from 'react';
import { TrackAgileBoardLive } from '../../components/track/TrackJobToolsLive';
import { JobBibleReferenceSection, JobToolBibleShell, JOB_BIBLE_UI } from '../../components/job/bible';

export default function Agile() {
  const meta = JOB_BIBLE_UI.agile;
  return (
    <JobToolBibleShell toolTitle={meta.toolTitle} toolIconMaterial={meta.toolIcon}>
      <div className="space-y-4 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Live board</p>
        <TrackAgileBoardLive />
      </div>
      <JobBibleReferenceSection toolKey="agile" />
    </JobToolBibleShell>
  );
}
