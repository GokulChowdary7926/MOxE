import React from 'react';
import { JobDesignBiblePanel } from './JobDesignBiblePanel';

/** Bottom-of-page design bible reference; see `JobDesignBiblePanel` (NBK-031). */
export function JobBibleReferenceSection({ toolKey }: { toolKey: string }) {
  return <JobDesignBiblePanel toolKey={toolKey} showHero={false} />;
}
