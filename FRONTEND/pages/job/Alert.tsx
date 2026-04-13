import React from 'react';
import { TrackJobAlertsLive } from '../../components/track/TrackJobToolsLive';
import { JobBibleReferenceSection, JobToolBibleShell, JOB_BIBLE_UI } from '../../components/job/bible';

export default function Alert() {
  const meta = JOB_BIBLE_UI.alert;
  return (
    <JobToolBibleShell toolTitle={meta.toolTitle} toolIconMaterial={meta.toolIcon}>
      <div className="space-y-4 pb-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Signals & schedules</p>
        <TrackJobAlertsLive />
      </div>
      <JobBibleReferenceSection toolKey="alert" />
    </JobToolBibleShell>
  );
}
