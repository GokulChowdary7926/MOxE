import React from 'react';
import { TrackScrumLive } from '../../components/track/TrackJobToolsLive';
import { JobBibleReferenceSection, JobToolBibleShell, JOB_BIBLE_UI } from '../../components/job/bible';

export default function Scrum() {
  const meta = JOB_BIBLE_UI.scrum;
  return (
    <JobToolBibleShell toolTitle={meta.toolTitle} toolIconMaterial={meta.toolIcon}>
      <div className="space-y-4 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Sprints & rituals</p>
        <TrackScrumLive />
      </div>
      <JobBibleReferenceSection toolKey="scrum" />
    </JobToolBibleShell>
  );
}
